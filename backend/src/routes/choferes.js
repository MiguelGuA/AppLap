//src>routes>choferes.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { autenticarToken } from '../middlewares/auth.js' 


const router = express.Router();
const prisma = new PrismaClient();

// los choferes con nombre del proveedor incluido
router.get('/', autenticarToken, async (req, res) => {
  try {
    const choferes = await prisma.chofer.findMany({
      include: {
        proveedor: {
          select: {
            nombre: true,
            locatarios: {
              select: {
                locatario: {
                  select: { nombre: true },
                },
              },
            },
          },
        },
        citas: {
          select: {
            nuevoChoferNombre: true,
          },
          orderBy: { fechaCita: 'desc' },
          take: 1, // última cita
        },
      },
    });

    // temporal `nuevoChoferPropuesto` al resultado
    const conPropuesto = choferes.map((ch) => ({
      ...ch,
      nuevoChoferPropuesto: ch.citas?.[0]?.nuevoChoferNombre || null,
    }));

    res.json(conPropuesto);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener choferes' });
  }
});

// Crear chofer
router.post('/', autenticarToken, async (req, res) => {
  const { nombre, placa, telefono, proveedorId } = req.body;

  if (!proveedorId || isNaN(proveedorId)) {
    return res.status(400).json({ error: 'Debe seleccionar un proveedor válido' });
  }

  try {
    const nuevo = await prisma.chofer.create({
      data: {
        nombre,
        placa,
        telefono,
        proveedorId: Number(proveedorId),
      },
    });
    res.json(nuevo);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear chofer' });
  }
});


// Actualizar chofer
router.patch('/:id', autenticarToken, async (req, res) => {
  try {
    const { nombre, placa, telefono, proveedorId } = req.body;

    const actualizado = await prisma.chofer.update({
      where: { id: parseInt(req.params.id) },
      data: {
        nombre,
        placa,
        telefono,
        proveedorId: proveedorId ? Number(proveedorId) : null,
      },
    });

    res.json(actualizado);
  } catch (e) {
    console.error("Error al actualizar chofer:", e);
    res.status(500).json({ error: 'Error al actualizar chofer' });
  }
});


// Eliminar chofer
router.delete('/:id', autenticarToken, async (req, res) => {
  try {
    await prisma.chofer.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ mensaje: 'Eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar chofer' });
  }
});

// choferes de los proveedores vinculados al locatario autenticado //PARA CREAR CITAS
router.get('/mis-choferes', autenticarToken, async (req, res) => {
  try {
    const userId = req.user.userId; 
console.log("🧪 userId del token:", userId);

    const locatario = await prisma.locatario.findUnique({
      where: { usuarioId: userId },
      select: { id: true },
    });

    if (!locatario) {
      return res.status(404).json({ error: "Locatario no encontrado" });
    }

    const vinculaciones = await prisma.proveedorPorLocatario.findMany({
      where: { locatarioId: locatario.id },
      select: { proveedorId: true },
    });

    const proveedorIds = vinculaciones.map(v => v.proveedorId);

    if (proveedorIds.length === 0) {
      return res.json([]);
    }

    const choferes = await prisma.chofer.findMany({
      where: {
        proveedorId: { in: proveedorIds },
      },
    });

    res.json(choferes);
  } catch (e) {
    console.error("❌ Error en /mis-choferes:", e);
    res.status(500).json({ error: 'Error al obtener choferes' });
  }
});


export default router;

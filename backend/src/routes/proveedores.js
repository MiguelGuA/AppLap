import express from 'express';
import { PrismaClient } from '@prisma/client';
import { autenticarToken } from '../auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /proveedores - Obtener todos los proveedores
router.get('/', autenticarToken, async (req, res) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      include: {
        locatarios: {
          include: {
            locatario: true,
          },
        },
      },
    });
    res.json(proveedores);
  } catch (e) {
    console.error("Error al obtener proveedores:", e);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

// GET /proveedores/mis-proveedores - Obtener proveedores asociados al locatario autenticado
router.get('/mis-proveedores', autenticarToken, async (req, res) => {
    try {
        const locatario = await prisma.locatario.findUnique({
            where: { usuarioId: req.user.userId },
            include: {
                proveedores: {
                    include: {
                        proveedor: true
                    }
                }
            }
        });

        if (!locatario) {
            return res.status(404).json({ error: "Locatario no encontrado." });
        }
        
        const proveedoresAsociados = locatario.proveedores.map(p => p.proveedor);
        res.json(proveedoresAsociados);

    } catch (error) {
        console.error("Error al obtener mis proveedores:", error);
        res.status(500).json({ error: 'No se pudieron obtener los proveedores.' });
    }
});

// POST /proveedores - Crear un nuevo proveedor y asociarlo a múltiples locatarios
router.post('/', autenticarToken, async (req, res) => {
  const { nombre, ruc, locatarioIds } = req.body;

  if (!nombre || !ruc) {
    return res.status(400).json({ error: 'El nombre y el RUC del proveedor son requeridos.' });
  }

  try {
    const proveedor = await prisma.$transaction(async (tx) => {
      const prov = await tx.proveedor.upsert({
        where: { ruc },
        update: { nombre },
        create: { nombre, ruc },
      });

      if (locatarioIds && locatarioIds.length > 0) {
        const associations = locatarioIds.map(locatarioId => ({
          proveedorId: prov.id,
          locatarioId: parseInt(locatarioId),
        }));
        await tx.proveedorPorLocatario.createMany({
          data: associations,
          skipDuplicates: true,
        });
      }
      return prov;
    });
    res.status(201).json(proveedor);
  } catch (error) {
    console.error("Error en POST /proveedores:", error);
    res.status(500).json({ error: 'No se pudo procesar la solicitud.' });
  }
});

// PATCH /proveedores/:id - Actualizar un proveedor y sus asociaciones
router.patch('/:id', autenticarToken, async (req, res) => {
  const proveedorId = parseInt(req.params.id);
  const { nombre, ruc, locatarioIds } = req.body;

  if (!nombre || !ruc) {
    return res.status(400).json({ error: 'El nombre y el RUC son requeridos.' });
  }

  try {
    const proveedorActualizado = await prisma.$transaction(async (tx) => {
      const prov = await tx.proveedor.update({
        where: { id: proveedorId },
        data: { nombre, ruc },
      });

      await tx.proveedorPorLocatario.deleteMany({
        where: { proveedorId: proveedorId },
      });

      if (locatarioIds && locatarioIds.length > 0) {
        const associations = locatarioIds.map(locatarioId => ({
          proveedorId: prov.id,
          locatarioId: parseInt(locatarioId),
        }));
        await tx.proveedorPorLocatario.createMany({
          data: associations,
        });
      }
      return prov;
    });

    res.json(proveedorActualizado);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El RUC ya está en uso por otro proveedor.' });
    }
    console.error("Error al actualizar proveedor:", error);
    res.status(500).json({ error: 'No se pudo actualizar el proveedor.' });
  }
});

// POST /proveedores/para-locatario - Crear un nuevo proveedor y asociarlo al locatario (desde CrearCita)
router.post('/para-locatario', autenticarToken, async (req, res) => {
  const { nombre, ruc } = req.body;
  const { userId } = req.user;

  if (!nombre || !ruc) {
    return res.status(400).json({ error: 'El nombre y el RUC del proveedor son requeridos.' });
  }

  try {
    const locatario = await prisma.locatario.findUnique({ where: { usuarioId: userId } });
    if (!locatario) {
      return res.status(404).json({ error: 'Locatario no encontrado.' });
    }

    const proveedor = await prisma.$transaction(async (tx) => {
      let prov = await tx.proveedor.findUnique({ where: { ruc } });
      if (!prov) {
        prov = await tx.proveedor.create({ data: { nombre, ruc } });
      }
      const asociacionExistente = await tx.proveedorPorLocatario.findUnique({
        where: { proveedorId_locatarioId: { proveedorId: prov.id, locatarioId: locatario.id } }
      });
      if (!asociacionExistente) {
        await tx.proveedorPorLocatario.create({ data: { proveedorId: prov.id, locatarioId: locatario.id } });
      }
      return prov;
    });

    res.status(201).json(proveedor);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un proveedor con ese RUC.' });
    }
    console.error(error);
    res.status(500).json({ error: 'No se pudo procesar la solicitud del proveedor.' });
  }
});


// DELETE /proveedores/:id - Eliminar un proveedor
router.delete('/:id', autenticarToken, async (req, res) => {
  const proveedorId = parseInt(req.params.id);

  try {
    
    await prisma.proveedor.delete({
      where: { id: proveedorId },
    });
    res.status(200).json({ mensaje: 'Proveedor eliminado correctamente.' });
  } catch (error) {
    // Código de Prisma para "Registro a eliminar no encontrado"
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Proveedor no encontrado.' });
    }
    console.error("Error al eliminar proveedor:", error);
    res.status(500).json({ error: 'No se pudo eliminar el proveedor.' });
  }
});


export default router;

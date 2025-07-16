import express from 'express';
import { PrismaClient } from '@prisma/client';
import { autenticarToken } from '../auth.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// GET /locadores - Obtener todos los locadores
router.get('/', autenticarToken, async (req, res) => {
  try {
    const locadores = await prisma.locatario.findMany({
      include: {
        usuario: {
          select: {
            username: true,
            activo: true
          }
        }
      }
    });
    res.json(locadores);
  } catch (error) {
    console.error("Error al obtener locadores:", error);
    res.status(500).json({ error: 'No se pudieron obtener los locadores.' });
  }
});

// GET /locadores/mi-locatario - Obtener el locatario del usuario autenticado
router.get('/mi-locatario', autenticarToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(403).json({ error: "Token no contiene ID de usuario" });
    }
    const locatario = await prisma.locatario.findUnique({
      where: { usuarioId: parseInt(userId) },
    });
    if (!locatario) {
      return res.status(404).json({ error: "Locatario no encontrado para este usuario." });
    }
    res.json(locatario);
  } catch (e) {
    console.error("❌ Error al obtener locatario:", e);
    res.status(500).json({ error: "Error al obtener locatario" });
  }
});


// POST /locadores - Crear un nuevo locador Y su usuario asociado
router.post('/', autenticarToken, async (req, res) => {
  const { nombre, empresa, ruc } = req.body;

  if (!nombre || !empresa || !ruc) {
    return res.status(400).json({ error: 'Razón Social, Nombre Comercial y RUC son requeridos.' });
  }

  try {
    // Generar credenciales temporales para el nuevo usuario
    const tempUsername = `ruc${ruc}`;
    const tempPassword = `123456`; // Contraseña aleatoria de 8 caracteres
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const nuevoLocadorConUsuario = await prisma.locatario.create({
      data: {
        nombre: empresa, // Nombre Comercial
        empresa: nombre, // Razón Social
        ruc: ruc,
        // Crear el usuario asociado en la misma operación
        usuario: {
          create: {
            nombre: empresa, // Usamos el nombre comercial como nombre de usuario inicial
            username: tempUsername,
            password: hashedPassword,
            rol: 'LOCATARIO',
          }
        }
      },
      include: {
        usuario: true // Devolver el locador con su nuevo usuario
      }
    });
    
    // futuro, aquí podrías enviar un email con la contraseña temporal.
    console.log(`Usuario creado para ${empresa}: user=${tempUsername}, pass=${tempPassword}`);

    res.status(201).json(nuevoLocadorConUsuario);

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un locador o usuario con ese RUC/username.' });
    }
    console.error("Error al crear locador:", error);
    res.status(500).json({ error: 'No se pudo crear el locador.' });
  }
});

// PATCH /locadores/:id - Actualizar un locador
router.patch('/:id', autenticarToken, async (req, res) => {
    const { id } = req.params;
    const { nombre, empresa, ruc } = req.body;
    try {
        const locadorActualizado = await prisma.locatario.update({
            where: { id: parseInt(id) },
            data: {
                nombre: empresa,
                empresa: nombre,
                ruc,
            }
        });
        res.json(locadorActualizado);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'El RUC ya está en uso por otro locador.' });
        }
        console.error("Error al actualizar locador:", error);
        res.status(500).json({ error: 'No se pudo actualizar el locador.' });
    }
});


// DELETE /locadores/:id - Eliminar un locador y su usuario asociado (si existe)
router.delete('/:id', autenticarToken, async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.$transaction(async (tx) => {
      const locador = await tx.locatario.findUnique({
        where: { id },
        select: { usuarioId: true },
      });

      if (!locador) {
        throw new Error('Locador no encontrado');
      }

      await tx.proveedorPorLocatario.deleteMany({ where: { locatarioId: id } });
      await tx.cita.deleteMany({ where: { locatarioId: id } });
      await tx.locatario.delete({ where: { id } });

      if (locador.usuarioId) {
        await tx.usuario.delete({ where: { id: locador.usuarioId } });
      }
    });

    res.status(200).json({ mensaje: 'Locador y sus datos asociados eliminados correctamente' });
  } catch (e) {
    console.error(e);
    if (e.message === 'Locador no encontrado') {
        return res.status(404).json({ error: e.message });
    }
    res.status(500).json({ error: 'Error al eliminar el locador' });
  }
});


export default router;

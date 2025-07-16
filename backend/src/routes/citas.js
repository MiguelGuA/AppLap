import express from 'express';
import { PrismaClient } from '@prisma/client';
import { autenticarToken } from '../auth.js';
import { add, startOfHour } from 'date-fns';

const router = express.Router();
const prisma = new PrismaClient();

// POST /citas - Crear una nueva cita con validación de cupo
router.post('/', autenticarToken, async (req, res) => {
  const {
    proveedorId,
    locatarioId,
    descripcion,
    fechaCita,
    aceptoCondiciones,
    requiereConfirmacion,
    placaVehiculo,
    nombreChofer,
    dniChofer,
    acompanantes,
  } = req.body;

  if (!fechaCita || !locatarioId) {
    return res.status(400).json({ error: 'La fecha de la cita y el locatario son requeridos.' });
  }

  const plateRegex = /^[A-Za-z0-9]{6}$/;
  if (!requiereConfirmacion && (!placaVehiculo || !plateRegex.test(placaVehiculo))) {
    alert("La placa debe contener exactamente 6 caracteres alfanuméricos (letras y números).");
    return;
  }


  try {
    const fechaCitaObj = new Date(fechaCita);

    // --- LÓGICA DE VALIDACIÓN DE CUPO ---
    const inicioDeLaHora = startOfHour(fechaCitaObj);
    const finDeLaHora = add(inicioDeLaHora, { hours: 1 });

    const citasEnLaMismaHora = await prisma.cita.count({
      where: {
        fechaCita: {
          gte: inicioDeLaHora,
          lt: finDeLaHora,
        },
      },
    });

    if (citasEnLaMismaHora >= 8) {
      return res.status(409).json({
        error: "Cupo lleno para este horario. Ya existen 8 citas programadas en esta hora. Por favor, elija otra."
      });
    }
    // --- FIN DE LA LÓGICA DE VALIDACIÓN ---

    const nuevaCita = await prisma.cita.create({
      data: {
        proveedorId: proveedorId ? parseInt(proveedorId) : null,
        locatarioId: parseInt(locatarioId),
        descripcion,
        fechaCita: fechaCitaObj,
        aceptoCondiciones,
        requiereConfirmacion,
        placaVehiculo,
        nombreChofer,
        dniChofer,
        acompanantes,
        usuarioId: req.user.userId,
      },
    });
    res.status(201).json(nuevaCita);
  } catch (error) {
    console.error("❌ Error al crear cita:", error);
    res.status(500).json({ error: 'No se pudo crear la cita', detalle: error.message });
  }
});

// GET /citas - Ruta principal para buscar citas por rango (usada por PanelOperador)
router.get('/', autenticarToken, async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  try {
    let whereClause = {};
    if (fechaInicio && fechaFin) {
      whereClause = {
        fechaCita: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      };
    }
    const citas = await prisma.cita.findMany({
      where: whereClause,
      include: {
        proveedor: true,
        locatario: true,
      },
      orderBy: {
        fechaCita: 'asc'
      },
    });
    res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ error: 'No se pudieron obtener las citas' });
  }
});

// PATCH /citas/:id - Cambiar estado con fechas automáticas
router.patch('/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const estadosValidos = ["PENDIENTE", "LLEGO", "DESCARGANDO", "FINALIZADO", "RETIRADO"];
  if (!estado || !estadosValidos.includes(estado)) {
    return res.status(400).json({ error: "El estado proporcionado no es válido." });
  }
  try {
    const dataToUpdate = { estado };
    const ahora = new Date();
    switch (estado) {
      case "LLEGO": dataToUpdate.horaIngreso = ahora; break;
      case "DESCARGANDO": dataToUpdate.horaDescarga = ahora; break;
      case "FINALIZADO": dataToUpdate.horaFinaliza = ahora; break;
      case "RETIRADO": dataToUpdate.horaSalida = ahora; break;
    }
    const citaActualizada = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      include: { proveedor: true, locatario: true }
    });
    res.json(citaActualizada);
  } catch (error) {
    console.error("Error al actualizar la cita:", error);
    res.status(500).json({ error: "No se pudo actualizar la cita." });
  }
});

// GET /citas/mis-citas - Obtener las citas de un rango amplio para el locatario
router.get('/mis-citas', autenticarToken, async (req, res) => {
  try {
    const locatario = await prisma.locatario.findUnique({
      where: { usuarioId: req.user.userId },
    });
    if (!locatario) {
      return res.status(404).json({ error: "Locatario no encontrado para este usuario." });
    }

    const hoy = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(hoy.getDate() - 7);
    const fechaFin = new Date();
    fechaFin.setDate(hoy.getDate() + 30);

    const citas = await prisma.cita.findMany({
      where: {
        locatarioId: locatario.id,
        fechaCita: { gte: fechaInicio, lte: fechaFin },
      },
      include: { proveedor: true },
      orderBy: { fechaCita: 'desc' }
    });
    res.json(citas);
  } catch (error) {
    console.error("Error al obtener mis citas:", error);
    res.status(500).json({ error: "No se pudieron obtener las citas" });
  }
});

// PATCH /citas/:id/confirmar - Ruta para que el operador confirme y edite una cita
router.patch('/:id/confirmar', autenticarToken, async (req, res) => {
  const citaId = parseInt(req.params.id);
  const { proveedorId, descripcion, placaVehiculo, nombreChofer, dniChofer, acompanantes } = req.body;
  const userRole = req.user.rol.toUpperCase();

  const plateRegex = /^[A-Za-z0-9]{6}$/;
  if (!placaVehiculo || !plateRegex.test(placaVehiculo)) {
    alert("La placa debe contener exactamente 6 caracteres alfanuméricos (letras y números).");
    return;
  }


  if (userRole !== 'OPERADOR' && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
  }
  try {
    const dataToUpdate = {
      requiereConfirmacion: false,
      proveedorId: proveedorId ? parseInt(proveedorId) : undefined,
      descripcion: descripcion,
      placaVehiculo: placaVehiculo,
      nombreChofer: nombreChofer,
      dniChofer: dniChofer,
      acompanantes: acompanantes
    };

    const citaConfirmada = await prisma.cita.update({
      where: { id: citaId },
      data: dataToUpdate,
      include: { proveedor: true, locatario: true }
    });
    res.json(citaConfirmada);
  } catch (error) {
    console.error("Error al confirmar la cita:", error);
    res.status(500).json({ error: 'No se pudo confirmar la cita.' });
  }
});

export default router;

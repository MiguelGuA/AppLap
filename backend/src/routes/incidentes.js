import express from 'express';
import { PrismaClient } from '@prisma/client';
import { autenticarToken } from '../auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST /incidentes - Crear un nuevo incidente
router.post('/', autenticarToken, upload.array('archivos', 5), async (req, res) => {
    const { citaId, what, why, where, who, how, howMuch } = req.body;
    const usuarioId = req.user.userId;

    if (!citaId || !what || !why || !where || !who || !how) {
        if (req.files) req.files.forEach(file => fs.unlinkSync(file.path));
        return res.status(400).json({ error: 'Faltan campos requeridos del formulario 5W2H.' });
    }

    try {
        const nuevoIncidente = await prisma.incidente.create({
            data: {
                cita: { connect: { id: parseInt(citaId) } },
                usuario: { connect: { id: usuarioId } },
                what, why, where, who, how,
                howMuch: howMuch || null,
                ...(req.files && {
                    archivos: {
                        create: req.files.map(file => ({
                            nombre: file.originalname,
                            url: `/uploads/${file.filename}`,
                            tipo: file.mimetype,
                        }))
                    }
                })
            },
            include: { archivos: true }
        });
        res.status(201).json(nuevoIncidente);
    } catch (error) {
        console.error("❌ Error al crear incidente:", error);
        res.status(500).json({ error: 'No se pudo crear el incidente', detalle: error.message });
    }
});

// GET /incidentes - Obtener todos los incidentes con detalles de la cita
router.get('/', autenticarToken, async (req, res) => {
    try {
        const incidentes = await prisma.incidente.findMany({
            include: {
                
                cita: {
                    include: {
                        proveedor: true,
                        locatario: true,
                    }
                },
                usuario: { select: { nombre: true } },
                archivos: true 
            },
            orderBy: { fechaHora: 'desc' }
        });
        res.json(incidentes);
    } catch (error) {
        console.error("❌ Error al obtener todos los incidentes:", error);
        res.status(500).json({ error: 'No se pudieron obtener los incidentes' });
    }
});

export default router;
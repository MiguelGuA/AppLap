// backend/src/index.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// --- IMPORTACIONES DE RUTAS ---
import authRoutes from './routes/auth.js'; 
import locadoresRoutes from './routes/locadores.js';
import proveedoresRoutes from './routes/proveedores.js';
import citaRoutes from './routes/citas.js';
import incidentesRoutes from './routes/incidentes.js';
import consultasRoutes from './routes/consultas.js'; 
import logger from './middlewares/logger.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(logger);

app.use('/uploads', express.static('uploads'));

// --- REGISTRO DE RUTAS ---
app.use('/auth', authRoutes);
app.use('/locadores', locadoresRoutes);
app.use('/proveedores', proveedoresRoutes);
app.use('/citas', citaRoutes);
app.use('/incidentes', incidentesRoutes);
app.use('/consultas', consultasRoutes); 

// Inicio del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'miclaveultrasecreta123';

// Ruta para login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { username } });
  if (!usuario) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const match = await bcrypt.compare(password, usuario.password);
  if (!match) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // ESTANDARIZACIÓN: token, siempre usaremos 'userId'.
  const tokenPayload = { 
    userId: usuario.id, 
    rol: usuario.rol, 
  };
  
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

  res.json({ token, rol: usuario.rol });
});

// Middleware para verificar JWT
export function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' }); 
  }

  jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
    if (err) {
      return res.status(403).json({ mensaje: 'Token inválido' }); 
    }
    
    // ESTANDARIZACIÓN: Guardamos la información decodificada siempre en 'req.user'.
    req.user = decodedPayload; 
    
    next();
  });
}

export default router;

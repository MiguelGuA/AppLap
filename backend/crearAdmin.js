//backend>crearAdmin.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function crearAdmin() {
  const username = 'admin';
  const passwordPlano = 'admin123';
  const rol = 'OPERADOR';
  const nombre = 'Admin LAP';

  // Verifica si ya existe
  const existente = await prisma.usuario.findUnique({ where: { username } });
  if (existente) {
    console.log('⚠️ Ya existe un usuario con este username.');
    return;
  }

  const hash = await bcrypt.hash(passwordPlano, 10);

  const nuevo = await prisma.usuario.create({
    data: {
      nombre,
      username,
      password: hash,
      rol,
    },
  });

  console.log('✅ Usuario admin creado:', nuevo);
}

crearAdmin()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

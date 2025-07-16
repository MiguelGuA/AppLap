// src/scripts/deleteChoferes.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.chofer.deleteMany()
  console.log("Todos los choferes fueron eliminados.")
}

main().finally(() => prisma.$disconnect())

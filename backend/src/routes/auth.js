// src/routes/auth.js
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

router.post('/register', async (req, res) => {
  const { nombre, username, password, rol } = req.body
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.usuario.create({
      data: { nombre, username, password: hashedPassword, rol }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar' })
  }
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await prisma.usuario.findUnique({ where: { username } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenciales incorrectas' })
  }

  console.log('🔐 JWT_SECRET actual:', process.env.JWT_SECRET);

  const token = jwt.sign({ userId: user.id, rol: user.rol }, process.env.JWT_SECRET)
  res.json({ token, rol: user.rol })
})

export default router

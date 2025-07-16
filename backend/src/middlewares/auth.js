// src/middlewares/auth.js
import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET

export function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' })

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ mensaje: 'Token inválido' })

    // token tiene userId y rol
    req.user = {
      userId: decoded.userId, // userId como id
      rol: decoded.rol
    }

    console.log("🔐 Usuario decodificado:", req.user)
    next()
  })
}

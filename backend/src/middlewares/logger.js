export default function logger(req, res, next) {
  const now = new Date().toISOString()
  console.log(`\n📝 [${now}] ${req.method} ${req.originalUrl}`)

  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    console.log("📦 Body:", req.body)
  }

  next()
}

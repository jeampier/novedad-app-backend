const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token requerido' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch { res.status(401).json({ error: 'Token invalido' }) }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' })
    const userRoles = req.user.roles || [req.user.role]
    const hasRole = roles.some(r => userRoles.includes(r))
    if (!hasRole) return res.status(403).json({ error: 'Acceso denegado' })
    next()
  }
}

module.exports = { requireAuth, requireRole }

const { query } = require('../db/client')

const MODULE_MAP = {
  '/api/employees': 'employees',
  '/api/absences':  'absences',
  '/api/accidents': 'accidents',
  '/api/shifts':    'shifts',
  '/api/admin/users': 'admin',
  '/api/admin/roles': 'admin',
  '/api/admin/audit': 'admin',
}

function auditRead(module) {
  return async (req, res, next) => {
    if (!req.user) return next()
    try {
      await query(
        'INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
        [`View:${module}`, { method: req.method, path: req.path }, req.user.id]
      )
    } catch {}
    next()
  }
}

module.exports = { auditRead }

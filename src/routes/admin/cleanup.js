const router = require('express').Router()
const { pool } = require('../../db/client')
const { requireAuth, requireRole } = require('../../middleware/auth')

const ADMIN_EMAIL = 'admin@novedad.com'

router.use(requireAuth, requireRole('admin'))

router.post('/', async (req, res, next) => {
  if (req.body.confirm !== 'limpiar') {
    const err = new Error('Confirmación inválida. Envía { "confirm": "limpiar" }')
    err.status = 400
    return next(err)
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      TRUNCATE TABLE
        concept_execution_logs,
        rule_snapshots,
        payroll_records,
        work_schedule,
        employee_requests,
        contracts,
        absences,
        accidents,
        shifts,
        audit_log,
        login_history,
        payroll_periods,
        employees
      RESTART IDENTITY CASCADE
    `)

    await client.query(`DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email != $1)`, [ADMIN_EMAIL])
    await client.query(`DELETE FROM users WHERE email != $1`, [ADMIN_EMAIL])

    await client.query('COMMIT')

    res.json({ ok: true, message: 'Base de datos limpiada. Lista para el cliente.' })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
})

module.exports = router

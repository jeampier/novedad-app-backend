const router = require('express').Router()
const { query } = require('../../db/client')
const { requireAuth, requireRole } = require('../../middleware/auth')

router.use(requireAuth, requireRole('admin'))

router.get('/stats', async (req, res, next) => {
  try {
    const [users, roles, activity, logins] = await Promise.all([
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM users"),
      query('SELECT COUNT(*) AS total FROM roles'),
      query("SELECT COUNT(*) AS total FROM audit_log WHERE created_at > NOW() - INTERVAL '7 days'"),
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE success=false) AS failed FROM login_history WHERE created_at > NOW() - INTERVAL '7 days'"),
    ])
    res.json({
      total_users:    parseInt(users.rows[0].total),
      active_users:   parseInt(users.rows[0].active),
      total_roles:    parseInt(roles.rows[0].total),
      activity_week:  parseInt(activity.rows[0].total),
      logins_week:    parseInt(logins.rows[0].total),
      failed_logins:  parseInt(logins.rows[0].failed),
    })
  } catch (err) { next(err) }
})

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, user_id, command } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const params = []
    const conditions = []
    if (user_id) { params.push(user_id);  conditions.push(`al.user_id = $${params.length}`) }
    if (command) { params.push(`%${command}%`); conditions.push(`al.command ILIKE $${params.length}`) }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    params.push(parseInt(limit), offset)
    const { rows } = await query(`
      SELECT al.id, al.command, al.payload, al.created_at,
        u.email AS user_email, u.full_name AS user_name
      FROM audit_log al
      LEFT JOIN users u ON u.id = al.user_id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params)
    res.json(rows)
  } catch (err) { next(err) }
})

router.get('/login-history', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const { rows } = await query(`
      SELECT lh.id, lh.email, lh.ip_address, lh.user_agent, lh.success, lh.created_at,
        u.full_name AS user_name
      FROM login_history lh
      LEFT JOIN users u ON u.id = lh.user_id
      ORDER BY lh.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), offset])
    res.json(rows)
  } catch (err) { next(err) }
})

module.exports = router

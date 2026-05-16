const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { query } = require('../db/client')

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const ip        = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    const userAgent = req.headers['user-agent'] || ''

    const { rows } = await query('SELECT * FROM users WHERE email=$1', [email])
    const user = rows[0]

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await query(
        'INSERT INTO login_history (email, ip_address, user_agent, success) VALUES ($1,$2,$3,false)',
        [email, ip, userAgent]
      ).catch(() => {})
      return res.status(401).json({ error: 'Credenciales invalidas' })
    }

    if (user.status === 'inactive')
      return res.status(403).json({ error: 'Usuario desactivado. Contacta al administrador.' })

    const { rows: roleRows } = await query(`
      SELECT r.name FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `, [user.id]).catch(() => ({ rows: [] }))

    const roles = roleRows.map(r => r.name)

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, roles },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    await query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]).catch(() => {})
    await query(
      'INSERT INTO login_history (user_id, email, ip_address, user_agent, success) VALUES ($1,$2,$3,$4,true)',
      [user.id, email, ip, userAgent]
    ).catch(() => {})

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, roles, full_name: user.full_name }
    })
  } catch (err) { next(err) }
})

module.exports = router

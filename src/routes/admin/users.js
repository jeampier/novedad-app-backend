const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { query } = require('../../db/client')
const { requireAuth, requireRole } = require('../../middleware/auth')

router.use(requireAuth, requireRole('admin'))

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT u.id, u.email, u.full_name, u.role, u.status, u.last_login, u.created_at,
        COALESCE(json_agg(r.name) FILTER (WHERE r.id IS NOT NULL), '[]') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id ORDER BY u.created_at DESC
    `)
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { email, password, full_name, role = 'operator' } = req.body
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await query(
      'INSERT INTO users (email, password, full_name, role) VALUES ($1,$2,$3,$4) RETURNING id, email, full_name, role, status, created_at',
      [email, hash, full_name, role]
    )
    const { rows: roleRows } = await query('SELECT id FROM roles WHERE name=$1', [role])
    if (roleRows[0])
      await query('INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rows[0].id, roleRows[0].id])
    await query('INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['CreateUser', { email, full_name, role }, req.user.id])
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { full_name, role, status } = req.body
    const { rows } = await query(
      'UPDATE users SET full_name=$1, role=$2, status=$3 WHERE id=$4 RETURNING id, email, full_name, role, status',
      [full_name, role, status, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })
    await query('DELETE FROM user_roles WHERE user_id=$1', [req.params.id])
    const { rows: roleRows } = await query('SELECT id FROM roles WHERE name=$1', [role])
    if (roleRows[0])
      await query('INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, roleRows[0].id])
    await query('INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['UpdateUser', { userId: req.params.id, full_name, role, status }, req.user.id])
    res.json(rows[0])
  } catch (err) { next(err) }
})

router.patch('/:id/deactivate', async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ error: 'No puedes desactivar tu propio usuario' })
    const { rows } = await query(
      "UPDATE users SET status='inactive' WHERE id=$1 RETURNING id, email, status",
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })
    await query('INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['DeactivateUser', { userId: req.params.id }, req.user.id])
    res.json(rows[0])
  } catch (err) { next(err) }
})

router.patch('/:id/activate', async (req, res, next) => {
  try {
    const { rows } = await query(
      "UPDATE users SET status='active' WHERE id=$1 RETURNING id, email, status",
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })
    await query('INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['ActivateUser', { userId: req.params.id }, req.user.id])
    res.json(rows[0])
  } catch (err) { next(err) }
})

router.patch('/:id/reset-password', async (req, res, next) => {
  try {
    const { password } = req.body
    if (!password || password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    const hash = await bcrypt.hash(password, 10)
    await query('UPDATE users SET password=$1 WHERE id=$2', [hash, req.params.id])
    await query('INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['ResetPassword', { userId: req.params.id }, req.user.id])
    res.json({ message: 'Contraseña actualizada' })
  } catch (err) { next(err) }
})

module.exports = router

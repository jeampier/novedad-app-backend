const router = require('express').Router()
const { query } = require('../../db/client')
const { requireAuth, requireRole } = require('../../middleware/auth')

router.use(requireAuth, requireRole('admin'))

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT r.id, r.name, r.description, r.is_system, r.created_at,
        COALESCE(
          json_agg(json_build_object('id', p.id, 'module', p.module, 'action', p.action))
          FILTER (WHERE p.id IS NOT NULL), '[]'
        ) AS permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      GROUP BY r.id ORDER BY r.created_at ASC
    `)
    res.json(rows)
  } catch (err) { next(err) }
})

router.get('/permissions', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM permissions ORDER BY module, action')
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body
    const { rows } = await query(
      'INSERT INTO roles (name, description) VALUES ($1,$2) RETURNING *',
      [name, description]
    )
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body
    const { rows } = await query(
      'UPDATE roles SET name=$1, description=$2 WHERE id=$3 AND is_system=false RETURNING *',
      [name, description, req.params.id]
    )
    if (!rows[0]) return res.status(400).json({ error: 'No se puede modificar un rol del sistema' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

router.put('/:id/permissions', async (req, res, next) => {
  try {
    const { permissionIds } = req.body
    await query('DELETE FROM role_permissions WHERE role_id=$1', [req.params.id])
    for (const permId of permissionIds) {
      await query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [req.params.id, permId])
    }
    await query('INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['UpdateRolePermissions', { roleId: req.params.id, permissionIds }, req.user.id])
    res.json({ message: 'Permisos actualizados' })
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      'DELETE FROM roles WHERE id=$1 AND is_system=false RETURNING id', [req.params.id]
    )
    if (!rows[0]) return res.status(400).json({ error: 'No se puede eliminar un rol del sistema' })
    res.json({ message: 'Rol eliminado' })
  } catch (err) { next(err) }
})

module.exports = router

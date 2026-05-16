const router = require('express').Router()
const { query } = require('../../db/client')
const { requireAuth, requireRole } = require('../../middleware/auth')

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM absence_code_catalog ORDER BY code')
    res.json({ data: rows })
  } catch (err) { next(err) }
})

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { code, description } = req.body
    if (!code?.trim()) return res.status(400).json({ error: 'El código es requerido' })
    const { rows } = await query(
      'INSERT INTO absence_code_catalog (code, description) VALUES ($1, $2) RETURNING *',
      [code.trim().toLowerCase(), description || null]
    )
    res.status(201).json({ data: rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ese código ya existe' })
    next(err)
  }
})

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM absence_code_catalog WHERE id=$1', [req.params.id])
    res.json({ message: 'Eliminado' })
  } catch (err) { next(err) }
})

module.exports = router

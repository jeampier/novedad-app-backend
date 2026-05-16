const router = require('express').Router()
const { query } = require('../../db/client')
const { requireAuth, requireRole } = require('../../middleware/auth')

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT key, value, description, updated_at FROM payroll_settings ORDER BY key')
    res.json({ data: rows })
  } catch (e) { next(e) }
})

router.put('/:key', requireRole('admin'), async (req, res, next) => {
  try {
    const { value } = req.body
    if (value === undefined || value === null || value === '') {
      return res.status(400).json({ error: 'value es requerido' })
    }
    const num = Number(value)
    if (isNaN(num)) return res.status(400).json({ error: 'value debe ser numérico' })

    const { rows } = await query(
      `UPDATE payroll_settings SET value = $1, updated_at = NOW()
       WHERE key = $2 RETURNING key, value, description, updated_at`,
      [num, req.params.key]
    )
    if (!rows.length) return res.status(404).json({ error: 'Parámetro no encontrado' })
    res.json({ data: rows[0] })
  } catch (e) { next(e) }
})

module.exports = router

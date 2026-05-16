const router = require('express').Router()
const repo   = require('../../repositories/workScheduleRepo')
const { requireAuth, requireRole } = require('../../middleware/auth')

// GET /api/payroll/schedule?year=2026&month=5
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const year  = parseInt(req.query.year  || new Date().getFullYear())
    const month = parseInt(req.query.month || new Date().getMonth() + 1)
    const rows  = await repo.findByMonth(year, month)
    res.json({ data: rows })
  } catch (err) { next(err) }
})

// POST /api/payroll/schedule  — upsert único
router.post('/', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const entry = await repo.upsert({ ...req.body, userId: req.user.id })
    res.status(201).json({ data: entry })
  } catch (err) { next(err) }
})

// POST /api/payroll/schedule/bulk  — upsert masivo
router.post('/bulk', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { entries } = req.body
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo de entradas' })
    }
    const results = await repo.upsertBulk(entries, req.user.id)
    res.status(201).json({ data: results })
  } catch (err) { next(err) }
})

// DELETE /api/payroll/schedule/:id
router.delete('/:id', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    await repo.remove(req.params.id)
    res.json({ message: 'Eliminado' })
  } catch (err) { next(err) }
})

module.exports = router

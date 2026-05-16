const router = require('express').Router()
const repo   = require('../../repositories/payrollRecordRepo')
const { requireAuth } = require('../../middleware/auth')

// GET /api/payroll/records?period_id=1
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { period_id } = req.query
    if (!period_id) return res.status(400).json({ error: 'Se requiere period_id' })
    res.json({ data: await repo.findByPeriod(period_id) })
  } catch (err) { next(err) }
})

// GET /api/payroll/records/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const record = await repo.findById(req.params.id)
    if (!record) return res.status(404).json({ error: 'Registro no encontrado' })
    res.json({ data: record })
  } catch (err) { next(err) }
})

module.exports = router

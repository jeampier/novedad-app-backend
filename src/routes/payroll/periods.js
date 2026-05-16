const router = require('express').Router()
const repo   = require('../../repositories/payrollPeriodRepo')
const { requireAuth, requireRole } = require('../../middleware/auth')

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.findAll() }) }
  catch (err) { next(err) }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const period = await repo.findById(req.params.id)
    if (!period) return res.status(404).json({ error: 'Período no encontrado' })
    res.json({ data: period })
  } catch (err) { next(err) }
})

router.post('/', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { name, startDate, endDate } = req.body
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Se requieren name, startDate y endDate' })
    }
    const period = await repo.create({ name, startDate, endDate, createdBy: req.user.id })
    res.status(201).json({ data: period })
  } catch (err) { next(err) }
})

router.patch('/:id/close', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const period = await repo.close(req.params.id)
    if (!period) return res.status(404).json({ error: 'Período no encontrado' })
    res.json({ data: period })
  } catch (err) { next(err) }
})

router.patch('/:id/reopen', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const period = await repo.reopen(req.params.id)
    if (!period) return res.status(404).json({ error: 'Período no encontrado' })
    res.json({ data: period })
  } catch (err) { next(err) }
})

module.exports = router

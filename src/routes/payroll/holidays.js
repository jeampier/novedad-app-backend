const router = require('express').Router()
const repo   = require('../../repositories/holidayRepo')
const { requireAuth, requireRole } = require('../../middleware/auth')

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear()
    res.json({ data: await repo.findByYear(year) })
  } catch (err) { next(err) }
})

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const holiday = await repo.create(req.body)
    res.status(201).json({ data: holiday })
  } catch (err) { next(err) }
})

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await repo.remove(req.params.id)
    res.json({ message: 'Eliminado' })
  } catch (err) { next(err) }
})

module.exports = router

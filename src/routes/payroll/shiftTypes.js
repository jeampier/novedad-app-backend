const router = require('express').Router()
const repo   = require('../../repositories/shiftTypeRepo')
const { requireAuth, requireRole } = require('../../middleware/auth')

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.findAll() }) }
  catch (err) { next(err) }
})

router.post('/', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const type = await repo.create({ ...req.body, createdBy: req.user.id })
    res.status(201).json({ data: type })
  } catch (err) { next(err) }
})

router.put('/:id', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const type = await repo.update(req.params.id, req.body)
    if (!type) return res.status(404).json({ error: 'Tipo de turno no encontrado' })
    res.json({ data: type })
  } catch (err) { next(err) }
})

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await repo.remove(req.params.id)
    res.json({ message: 'Eliminado' })
  } catch (err) { next(err) }
})

module.exports = router

const { Router } = require('express')
const { requireAuth } = require('../../middleware/auth')
const repo = require('../../repositories/rateRulesRepo')

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json(await repo.findAll()) } catch (e) { next(e) }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const rule = await repo.create({ ...req.body, created_by: req.user.id })
    res.status(201).json(rule)
  } catch (e) { next(e) }
})

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const rule = await repo.update(req.params.id, req.body)
    if (!rule) return res.status(404).json({ error: 'Regla no encontrada' })
    res.json(rule)
  } catch (e) { next(e) }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await repo.delete(req.params.id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

module.exports = router

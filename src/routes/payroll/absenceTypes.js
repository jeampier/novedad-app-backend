const router = require('express').Router()
const repo   = require('../../repositories/absenceTypeRepo')
const { requireAuth, requireRole } = require('../../middleware/auth')

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    res.json({ data: await repo.findAll() })
  } catch (e) { next(e) }
})

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { code, name, description, deduction_pct, active } = req.body
    if (!code || !name || deduction_pct === undefined) {
      return res.status(400).json({ error: 'code, name y deduction_pct son requeridos' })
    }
    const pct = Number(deduction_pct)
    if (isNaN(pct) || pct < 0 || pct > 1) {
      return res.status(400).json({ error: 'deduction_pct debe ser un número entre 0 y 1' })
    }
    const type = await repo.create({ code, name, description, deduction_pct: pct, active })
    res.status(201).json({ data: type })
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ya existe un tipo de ausencia con ese código' })
    next(e)
  }
})

router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { name, description, deduction_pct, active } = req.body
    if (!name || deduction_pct === undefined) {
      return res.status(400).json({ error: 'name y deduction_pct son requeridos' })
    }
    const pct = Number(deduction_pct)
    if (isNaN(pct) || pct < 0 || pct > 1) {
      return res.status(400).json({ error: 'deduction_pct debe ser un número entre 0 y 1' })
    }
    const type = await repo.update(req.params.id, { name, description, deduction_pct: pct, active })
    if (!type) return res.status(404).json({ error: 'Tipo de ausencia no encontrado' })
    res.json({ data: type })
  } catch (e) { next(e) }
})

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await repo.remove(req.params.id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

module.exports = router

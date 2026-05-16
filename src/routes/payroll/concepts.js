const router      = require('express').Router()
const { requireAuth, requireRole } = require('../../middleware/auth')
const conceptRepo = require('../../repositories/conceptRepo')
const ruleRepo    = require('../../repositories/ruleRepo')
const evaluator   = require('../../services/formulaEvaluator')
const { query }   = require('../../db/client')

router.use(requireAuth)

// ── Concepts ──────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try { res.json(await conceptRepo.findAll()) } catch (e) { next(e) }
})

router.get('/variables', (req, res) => {
  res.json(evaluator.BASE_VARIABLES)
})

router.post('/validate-formula', (req, res) => {
  const { formula } = req.body
  if (!formula) return res.status(400).json({ error: 'formula requerida' })
  res.json(evaluator.validate(formula))
})

router.post('/simulate', async (req, res, next) => {
  try {
    const { conceptId, variables } = req.body
    const concept = await conceptRepo.findById(conceptId)
    if (!concept) return res.status(404).json({ error: 'Concepto no encontrado' })

    const rules = await ruleRepo.findByConcept(conceptId)
    const active = rules.filter(r => r.active).sort((a, b) => a.priority - b.priority)

    const results = active.map(rule => {
      const conditionsMet = evaluator.evaluateConditions(rule.conditions, variables)
      if (!conditionsMet) {
        return { ruleId: rule.id, ruleName: rule.name, priority: rule.priority, skipped: true, reason: 'Condiciones no cumplidas' }
      }
      const r = evaluator.evaluate(rule.formula, variables)
      return { ruleId: rule.id, ruleName: rule.name, formula: rule.formula, priority: rule.priority, conditionsMet, ...r }
    })

    const applied = results.find(r => !r.skipped && r.success)

    await query(
      `INSERT INTO concept_execution_logs (concept_id, input_variables, result, executed_by)
       VALUES ($1,$2,$3,$4)`,
      [conceptId, JSON.stringify(variables), applied?.result ?? null, req.user?.id ?? null]
    ).catch(() => {})

    res.json({ concept, results, finalResult: applied?.result ?? null })
  } catch (e) { next(e) }
})

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const c = await conceptRepo.create({ ...req.body, createdBy: req.user.id })
    res.status(201).json(c)
  } catch (e) { next(e) }
})

router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const c = await conceptRepo.update(req.params.id, req.body)
    if (!c) return res.status(404).json({ error: 'Concepto no encontrado' })
    res.json(c)
  } catch (e) { next(e) }
})

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try { await conceptRepo.remove(req.params.id); res.json({ ok: true }) }
  catch (e) { next(e) }
})

// ── Rules ─────────────────────────────────────────────────

router.get('/:id/rules', async (req, res, next) => {
  try { res.json(await ruleRepo.findByConcept(req.params.id)) } catch (e) { next(e) }
})

router.post('/:id/rules', requireRole('admin'), async (req, res, next) => {
  try {
    const v = evaluator.validate(req.body.formula)
    if (!v.valid) return res.status(400).json({ error: `Fórmula inválida: ${v.error}` })
    const rule = await ruleRepo.create({ ...req.body, conceptId: req.params.id, createdBy: req.user.id })
    res.status(201).json(rule)
  } catch (e) { next(e) }
})

router.put('/:cid/rules/:rid', requireRole('admin'), async (req, res, next) => {
  try {
    if (req.body.formula) {
      const v = evaluator.validate(req.body.formula)
      if (!v.valid) return res.status(400).json({ error: `Fórmula inválida: ${v.error}` })
    }
    const existing = await ruleRepo.findById(req.params.rid)
    if (existing) await ruleRepo.saveSnapshot(existing.id, existing, req.user.id)
    const rule = await ruleRepo.update(req.params.rid, req.body)
    if (!rule) return res.status(404).json({ error: 'Regla no encontrada' })
    res.json(rule)
  } catch (e) { next(e) }
})

router.delete('/:cid/rules/:rid', requireRole('admin'), async (req, res, next) => {
  try { await ruleRepo.remove(req.params.rid); res.json({ ok: true }) }
  catch (e) { next(e) }
})

router.get('/:cid/rules/:rid/snapshots', async (req, res, next) => {
  try { res.json(await ruleRepo.getSnapshots(req.params.rid)) } catch (e) { next(e) }
})

module.exports = router

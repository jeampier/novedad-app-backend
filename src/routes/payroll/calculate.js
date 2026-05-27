const router   = require('express').Router()
const { calculate, calculateWithLogs } = require('../../services/payrollCalculator')
const { requireAuth, requireRole }     = require('../../middleware/auth')
const { query }                        = require('../../db/client')

// POST /api/payroll/calculate — API original (backward compatible)
router.post('/', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { periodId } = req.body
    if (!periodId) return res.status(400).json({ error: 'Se requiere periodId' })

    const ctx = await calculateWithLogs(periodId, req.user.id)

    await query(
      'INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['Payroll:Calculate', { periodId, count: ctx.savedRecords.length, engine: 'v2' }, req.user.id]
    )

    res.json({
      data:     ctx.savedRecords,
      message:  `Nómina calculada para ${ctx.savedRecords.length} empleados`,
      warnings: ctx.warnings || [],
      logs:     ctx.logs,
    })
  } catch (err) { next(err) }
})

// POST /api/payroll/calculate/dry-run — simulación sin persistencia
router.post('/dry-run', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { periodId } = req.body
    if (!periodId) return res.status(400).json({ error: 'Se requiere periodId' })

    const ctx = await calculateWithLogs(periodId, req.user.id, { dryRun: true })

    res.json({
      data:    ctx.savedRecords,
      message: `[DRY RUN] Cálculo simulado para ${ctx.savedRecords.length} empleados`,
      logs:    ctx.logs,
    })
  } catch (err) { next(err) }
})

module.exports = router

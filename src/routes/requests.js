const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')
const repo    = require('../repositories/requestsRepo')
const absRepo = require('../repositories/absenceRepo')

const router = Router()

// GET /api/requests
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, type, employee_id } = req.query
    res.json(await repo.findAll({ status, type, employeeId: employee_id }))
  } catch (e) { next(e) }
})

// GET /api/requests/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const r = await repo.findById(req.params.id)
    if (!r) return res.status(404).json({ error: 'Solicitud no encontrada' })
    res.json(r)
  } catch (e) { next(e) }
})

// POST /api/requests
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { type, employeeId, startDate, endDate, reason } = req.body
    if (!type || !employeeId || !startDate || !endDate)
      return res.status(400).json({ error: 'type, employeeId, startDate y endDate son requeridos' })
    if (new Date(endDate) < new Date(startDate))
      return res.status(400).json({ error: 'La fecha fin debe ser igual o posterior a la fecha inicio' })
    const r = await repo.create({ type, employeeId, startDate, endDate, reason, userId: req.user.id })
    res.status(201).json(r)
  } catch (e) { next(e) }
})

// PUT /api/requests/:id/approve
router.put('/:id/approve', requireAuth, async (req, res, next) => {
  try {
    const request = await repo.findById(req.params.id)
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' })
    if (request.status !== 'pendiente')
      return res.status(400).json({ error: `No se puede aprobar una solicitud en estado "${request.status}"` })

    // Crear ausencia automáticamente al aprobar
    let absenceId = null
    try {
      const absence = await absRepo.create({
        employeeId: request.employee_id,
        type:       request.type,
        startDate:  request.start_date,
        endDate:    request.end_date,
        reason:     `Aprobado desde solicitud #${request.id}`,
        createdBy:  req.user.id,
      })
      absenceId = absence?.id || null
    } catch (_) {}

    const updated = await repo.approve(req.params.id, {
      userId: req.user.id,
      notes:  req.body.notes,
      absenceId,
    })
    res.json(updated)
  } catch (e) { next(e) }
})

// PUT /api/requests/:id/reject
router.put('/:id/reject', requireAuth, async (req, res, next) => {
  try {
    const request = await repo.findById(req.params.id)
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' })
    if (request.status !== 'pendiente')
      return res.status(400).json({ error: `No se puede rechazar una solicitud en estado "${request.status}"` })
    const updated = await repo.reject(req.params.id, { userId: req.user.id, notes: req.body.notes })
    res.json(updated)
  } catch (e) { next(e) }
})

// PUT /api/requests/:id/liquidate
router.put('/:id/liquidate', requireAuth, async (req, res, next) => {
  try {
    const updated = await repo.liquidate(req.params.id)
    if (!updated) return res.status(400).json({ error: 'Solo se pueden liquidar solicitudes aprobadas' })
    res.json(updated)
  } catch (e) { next(e) }
})

module.exports = router

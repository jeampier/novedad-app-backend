const router = require('express').Router()
const repo   = require('../repositories/employeeRepo')
const { requireAuth, requireRole } = require('../middleware/auth')
const { auditRead } = require('../middleware/auditLog')

router.get('/', requireAuth, auditRead('Empleados'), async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true'
    const data = includeInactive
      ? await repo.findAll_including_inactive()
      : await repo.findAll()
    res.json({ data })
  } catch (err) { next(err) }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const emp = await repo.findById(req.params.id)
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' })
    res.json({ data: emp })
  } catch (err) { next(err) }
})

router.post('/', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { firstName, lastName, documentType, document, position, area, groupName,
            shiftTypeId, startDate, baseSalary, smmlv, phone, email } = req.body

    if (!firstName || !document || !position) {
      return res.status(400).json({ error: 'firstName, document y position son requeridos' })
    }

    const emp = await repo.create({
      firstName, lastName, documentType, document, position, area, groupName,
      shiftTypeId, startDate, baseSalary, smmlv, phone, email,
      createdBy: req.user.id,
    })
    res.status(201).json({ data: emp })
  } catch (err) { next(err) }
})

router.put('/:id', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const emp = await repo.update(req.params.id, req.body)
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' })
    res.json({ data: emp })
  } catch (err) { next(err) }
})

router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'status debe ser active o inactive' })
    }
    const emp = await repo.setStatus(req.params.id, status)
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' })
    res.json({ data: emp })
  } catch (err) { next(err) }
})

module.exports = router

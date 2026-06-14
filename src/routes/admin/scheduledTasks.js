const router = require('express').Router()
const repo   = require('../../repositories/scheduledTaskRepo')
const { requireAuth, requireRole } = require('../../middleware/auth')
const { query } = require('../../db/client')

router.use(requireAuth, requireRole('admin'))

router.get('/', async (req, res, next) => {
  try {
    const tasks = await repo.findAll()
    res.json({ data: tasks })
  } catch (err) { next(err) }
})

router.get('/:id/logs', async (req, res, next) => {
  try {
    const logs = await repo.findRecentLogs(req.params.id, req.query.limit || 10)
    res.json({ data: logs })
  } catch (err) { next(err) }
})

const TASK_TYPES = ['calculate_period', 'close_period', 'calculate_and_close']

function validateBody(body) {
  const { name, taskType, hour, minute, daysOfWeek } = body
  if (!name || !taskType) return 'Se requieren name y taskType'
  if (!TASK_TYPES.includes(taskType)) return 'taskType inválido'
  if (hour == null || minute == null) return 'Se requieren hour y minute'
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return 'hour/minute fuera de rango'
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) return 'Se requiere al menos un día'
  return null
}

router.post('/', async (req, res, next) => {
  try {
    const err = validateBody(req.body)
    if (err) return res.status(400).json({ error: err })

    const task = await repo.create({ ...req.body, createdBy: req.user.id })

    await query(
      'INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['ScheduledTask:Create', { id: task.id, name: task.name, taskType: task.task_type }, req.user.id]
    )

    res.status(201).json({ data: task })
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const err = validateBody(req.body)
    if (err) return res.status(400).json({ error: err })

    const task = await repo.update(req.params.id, req.body)
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' })

    await query(
      'INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['ScheduledTask:Update', { id: task.id, name: task.name }, req.user.id]
    )

    res.json({ data: task })
  } catch (err) { next(err) }
})

router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const { enabled } = req.body
    if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'Se requiere enabled (boolean)' })

    const task = await repo.setEnabled(req.params.id, enabled)
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' })

    await query(
      'INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['ScheduledTask:Toggle', { id: task.id, enabled }, req.user.id]
    )

    res.json({ data: task })
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await repo.remove(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Tarea no encontrada' })

    await query(
      'INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
      ['ScheduledTask:Delete', { id: req.params.id }, req.user.id]
    )

    res.json({ message: 'Tarea eliminada' })
  } catch (err) { next(err) }
})

module.exports = router

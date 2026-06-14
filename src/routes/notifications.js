const router = require('express').Router()
const repo = require('../repositories/notificationRepo')
const { requireAuth } = require('../middleware/auth')

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20
    const data = await repo.findByUser(req.user.id, { limit })
    res.json({ data })
  } catch (err) { next(err) }
})

router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await repo.unreadCount(req.user.id)
    res.json({ data: { count } })
  } catch (err) { next(err) }
})

router.patch('/read-all', async (req, res, next) => {
  try {
    await repo.markAllRead(req.user.id)
    res.json({ message: 'Notificaciones marcadas como leídas' })
  } catch (err) { next(err) }
})

router.patch('/:id/read', async (req, res, next) => {
  try {
    const notif = await repo.markRead(req.params.id, req.user.id)
    if (!notif) return res.status(404).json({ error: 'Notificación no encontrada' })
    res.json({ data: notif })
  } catch (err) { next(err) }
})

module.exports = router

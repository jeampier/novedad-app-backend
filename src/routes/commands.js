const router = require('express').Router()
const { dispatch } = require('../commands/commandBus')
const { requireAuth } = require('../middleware/auth')
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { command, payload } = req.body
    if (!command) return res.status(400).json({ error: 'command requerido' })
    const result = await dispatch(command, payload, { userId: req.user.id })
    res.json({ ok: true, data: result })
  } catch (err) { next(err) }
})
module.exports = router

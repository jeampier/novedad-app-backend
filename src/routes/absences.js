const router = require('express').Router()
const repo   = require('../repositories/absenceRepo')
const { requireAuth } = require('../middleware/auth')
const { auditRead }   = require('../middleware/auditLog')
router.get('/', requireAuth, auditRead('Ausencias'), async (req, res, next) => {
  try { res.json({ data: await repo.findAll() }) }
  catch (err) { next(err) }
})
module.exports = router

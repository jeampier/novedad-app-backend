const router = require('express').Router()
const repo   = require('../repositories/accidentRepo')
const { requireAuth } = require('../middleware/auth')
const { auditRead }   = require('../middleware/auditLog')
router.get('/', requireAuth, auditRead('Accidentes'), async (req, res, next) => {
  try { res.json({ data: await repo.findAll() }) }
  catch (err) { next(err) }
})
module.exports = router

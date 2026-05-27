const router = require('express').Router()
const validationRulesRepo = require('../../repositories/validationRulesRepo')
const { requireAuth, requireRole } = require('../../middleware/auth')

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json({ data: await validationRulesRepo.findAll() }) }
  catch (err) { next(err) }
})

module.exports = router

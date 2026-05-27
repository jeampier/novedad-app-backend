  const { Router } = require('express')
  const { requireAuth } = require('../middleware/auth')
  const repo = require('../repositories/contractsRepo')

  const router = Router()

  // Lista todos los contratos con nombre del empleado
  router.get('/', requireAuth, async (req, res, next) => {
    try {
      res.json(await repo.findAll())
    } catch (e) { next(e) }
  })

  // Contratos de un empleado específico
  router.get('/employee/:employee_id', requireAuth, async (req, res, next) => {
    try {
      res.json(await repo.findByEmployee(req.params.employee_id))
    } catch (e) { next(e) }
  })

  // Un contrato por ID
  router.get('/:id', requireAuth, async (req, res, next) => {
    try {
      const row = await repo.findById(req.params.id)
      if (!row) return res.status(404).json({ error: 'Contrato no encontrado' })
      res.json(row)
    } catch (e) { next(e) }
  })

  module.exports = router
const validationRulesRepo = require('../repositories/validationRulesRepo')

async function updateValidationRule(payload) {
  const { id, active } = payload
  if (!id || active === undefined) {
    const e = new Error('Faltan campos requeridos: id, active')
    e.status = 400
    throw e
  }
  const rule = await validationRulesRepo.setActive(id, active)
  if (!rule) { const e = new Error('Regla no encontrada'); e.status = 404; throw e }
  return rule
}

module.exports = { updateValidationRule }

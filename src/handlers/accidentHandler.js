const accidentRepo = require('../repositories/accidentRepo')
async function registerAccident(payload, context) {
  const { employeeId, date, description, severity, location } = payload
  if (!employeeId || !date || !description) { const e = new Error('Faltan campos requeridos'); e.status=400; throw e }
  return accidentRepo.create({ employeeId, date, description, severity, location, createdBy: context.userId })
}
module.exports = { registerAccident }

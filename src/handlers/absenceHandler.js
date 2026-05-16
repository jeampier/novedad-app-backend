const absenceRepo = require('../repositories/absenceRepo')
async function registerAbsence(payload, context) {
  const { employeeId, type, startDate, endDate, reason } = payload
  if (!employeeId || !type || !startDate) { const e = new Error('Faltan campos requeridos'); e.status=400; throw e }
  return absenceRepo.create({ employeeId, type, startDate, endDate, reason, createdBy: context.userId })
}
module.exports = { registerAbsence }

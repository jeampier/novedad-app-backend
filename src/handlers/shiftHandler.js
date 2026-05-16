const shiftRepo = require('../repositories/shiftRepo')
async function changeShift(payload, context) {
  const { employeeId, newShift, effectiveDate, reason } = payload
  if (!employeeId || !newShift || !effectiveDate) { const e = new Error('Faltan campos requeridos'); e.status=400; throw e }
  return shiftRepo.change({ employeeId, newShift, effectiveDate, reason, createdBy: context.userId })
}
module.exports = { changeShift }

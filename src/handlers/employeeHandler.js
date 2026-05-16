const employeeRepo = require('../repositories/employeeRepo')

async function onboardEmployee(payload, context) {
  // Acepta tanto { firstName, lastName } (API nueva) como { name } (backward compat)
  let { firstName, lastName, name, documentType, document, position, area, startDate, shiftTypeId, phone, email } = payload

  if (!firstName && name) {
    const parts = name.trim().split(' ')
    firstName = parts[0]
    lastName  = parts.slice(1).join(' ')
  }

  if (!firstName || !document || !position) {
    const e = new Error('firstName (o name), document y position son requeridos')
    e.status = 400
    throw e
  }

  return employeeRepo.create({
    firstName, lastName: lastName || '', documentType, document,
    position, area, startDate, shiftTypeId, phone, email,
    createdBy: context.userId,
  })
}

async function offboardEmployee(payload, context) {
  const { employeeId, endDate } = payload
  if (!employeeId || !endDate) {
    const e = new Error('employeeId y endDate son requeridos')
    e.status = 400
    throw e
  }
  return employeeRepo.deactivate({ employeeId, endDate, createdBy: context.userId })
}

module.exports = { onboardEmployee, offboardEmployee }

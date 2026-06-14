const accidentRepo = require('../repositories/accidentRepo')
const notificationRepo = require('../repositories/notificationRepo')

async function registerAccident(payload, context) {
  const { employeeId, date, description, severity, location } = payload
  if (!employeeId || !date || !description) { const e = new Error('Faltan campos requeridos'); e.status=400; throw e }
  const accident = await accidentRepo.create({ employeeId, date, description, severity, location, createdBy: context.userId })

  await notificationRepo.createForAdmins({
    type: 'accident_created',
    title: 'Nuevo accidente reportado',
    message: `Accidente registrado el ${date}${severity ? ` (severidad: ${severity})` : ''}`,
    link: '/accidents',
  })

  return accident
}
module.exports = { registerAccident }

const workScheduleRepo = require('../../../repositories/workScheduleRepo')
const payrollPeriodRepo = require('../../../repositories/payrollPeriodRepo')

async function loadSchedules(ctx) {
  // Resolve period if not already loaded
  if (!ctx.period) {
    ctx.period = await payrollPeriodRepo.findById(ctx.periodId)
  }

  if (!ctx.period) {
    const err = new Error(`Período ${ctx.periodId} no encontrado`)
    err.status = 404
    throw err
  }

  if (ctx.period.status === 'closed') {
    const err = new Error('El período está cerrado')
    err.status = 400
    throw err
  }

  ctx.log('loadSchedules', `Período: ${ctx.period.name} (${ctx.period.start_date} → ${ctx.period.end_date})`)

  const schedules = await workScheduleRepo.findForPeriod(ctx.period.start_date, ctx.period.end_date)
  ctx.schedules = schedules

  // Group by employee_id for O(1) lookup in later steps
  ctx.schedulesByEmployee = {}
  for (const row of schedules) {
    if (!ctx.schedulesByEmployee[row.employee_id]) {
      ctx.schedulesByEmployee[row.employee_id] = []
    }
    ctx.schedulesByEmployee[row.employee_id].push(row)
  }

  const empCount = Object.keys(ctx.schedulesByEmployee).length
  ctx.log('loadSchedules', `${schedules.length} días programados para ${empCount} empleados`)

  return ctx
}

module.exports = loadSchedules

const holidayRepo = require('../../../repositories/holidayRepo')
const { isWorkedDay } = require('../calculators/HoursCalculator')

function isSunday(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay() === 0
}

function n(v) { return Number(v) || 0 }

// Reclasifica las horas de un día trabajado en domingo/festivo a sus
// equivalentes dominicales/festivos (RDF, HEDDF, HENDF, RNDF), según
// CST art. 168 + Ley 789/2002. RN y RG (recargo nocturno 35%) son el
// mismo concepto legal y ambos van a RNDF (110%).
function reclassify(day) {
  day.sunday_holiday_hours = n(day.sunday_holiday_hours) + n(day.ordinary_hours)
  day.extra_diur_dom_hours = n(day.extra_diur_dom_hours) + n(day.extra_hours)
  day.extra_noct_dom_hours = n(day.extra_noct_dom_hours) + n(day.extra_noct_hours)
  day.rec_dom_noct_hours   = n(day.rec_dom_noct_hours) + n(day.night_hours) + n(day.surcharge_hours)

  day.ordinary_hours  = 0
  day.extra_hours     = 0
  day.extra_noct_hours = 0
  day.night_hours     = 0
  day.surcharge_hours = 0
}

async function applyHolidayReclassification(ctx) {
  const holidayRows = await holidayRepo.findInRange(ctx.period.start_date, ctx.period.end_date)
  const holidaySet  = new Set(holidayRows.map(r => r.holiday_date))

  let reclassifiedDays = 0
  for (const days of Object.values(ctx.schedulesByEmployee)) {
    for (const day of days) {
      if (!isWorkedDay(day)) continue
      if (!isSunday(day.schedule_date) && !holidaySet.has(day.schedule_date)) continue

      reclassify(day)
      reclassifiedDays++
    }
  }

  ctx.log('applyHolidayReclassification',
    `${reclassifiedDays} días reclasificados a dominical/festivo`,
    { holidaysInRange: holidaySet.size }
  )

  return ctx
}

module.exports = applyHolidayReclassification

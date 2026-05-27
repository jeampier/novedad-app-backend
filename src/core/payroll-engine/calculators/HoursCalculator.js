// Pure functions — no DB access, no side effects.

const DEFAULTS = {
  extraMultiplier:         1.25,
  extraDiurDomMultiplier:  1.75,
  extraNoctMultiplier:     1.75,
  extraNoctDomMultiplier:  2.10,
  nightMultiplier:         1.35,
  surchargeMultiplier:     1.35,
  sundayHolidayMultiplier: 1.75,
  recDomNoctMultiplier:    2.10,
}

function n(v) { return Number(v) || 0 }

function calculateDay(day) {
  return {
    ordinary:            n(day.ordinary_hours),
    extra:               n(day.extra_hours),
    extraDiurDom:        n(day.extra_diur_dom_hours),
    extraNoct:           n(day.extra_noct_hours),
    extraNoctDom:        n(day.extra_noct_dom_hours),
    night:               n(day.night_hours),
    surcharge:           n(day.surcharge_hours),
    sundayHoliday:       n(day.sunday_holiday_hours),
    recDomNoct:          n(day.rec_dom_noct_hours),
    extraMul:            n(day.extra_multiplier)            || DEFAULTS.extraMultiplier,
    extraDiurDomMul:     n(day.extra_diur_dom_multiplier)  || DEFAULTS.extraDiurDomMultiplier,
    extraNoctMul:        n(day.extra_noct_multiplier)       || DEFAULTS.extraNoctMultiplier,
    extraNoctDomMul:     n(day.extra_noct_dom_multiplier)   || DEFAULTS.extraNoctDomMultiplier,
    nightMul:            n(day.night_multiplier)            || DEFAULTS.nightMultiplier,
    surchargeMul:        n(day.surcharge_multiplier)        || DEFAULTS.surchargeMultiplier,
    sundayHolidayMul:    n(day.sunday_holiday_multiplier)   || DEFAULTS.sundayHolidayMultiplier,
    recDomNoctMul:       n(day.rec_dom_noct_multiplier)     || DEFAULTS.recDomNoctMultiplier,
  }
}

function dayPay(hours, hourlyRate) {
  return (
    hours.ordinary      * hourlyRate +
    hours.extra         * hourlyRate * hours.extraMul +
    hours.extraDiurDom  * hourlyRate * hours.extraDiurDomMul +
    hours.extraNoct     * hourlyRate * hours.extraNoctMul +
    hours.extraNoctDom  * hourlyRate * hours.extraNoctDomMul +
    hours.night         * hourlyRate * hours.nightMul +
    hours.surcharge     * hourlyRate * hours.surchargeMul +
    hours.sundayHoliday * hourlyRate * hours.sundayHolidayMul +
    hours.recDomNoct    * hourlyRate * hours.recDomNoctMul
  )
}

function isWorkedDay(day) {
  return !day.is_rest_day && !day.absence_type && !!day.shift_type_id
}

function aggregateEmployee(days, baseSalary, behaviorMap = {}) {
  const disabilityCode = behaviorMap.disability
  const vacationCode   = behaviorMap.vacation
  const hourlyRate = n(baseSalary) / 240
  let daysWorked = 0, restDays = 0, absenceDays = 0, disabilityDays = 0, vacationDays = 0
  let ordinary = 0, extra = 0, extraDiurDom = 0, extraNoct = 0, extraNoctDom = 0
  let night = 0, surcharge = 0, sundayHoliday = 0, recDomNoct = 0
  let grossPay = 0
  const breakdown = []

  for (const day of days) {
    if (day.is_rest_day) { restDays++; continue }
    if (disabilityCode && day.absence_type === disabilityCode) { disabilityDays++; continue }
    if (vacationCode   && day.absence_type === vacationCode)   { vacationDays++;   continue }
    if (day.absence_type)                                      { absenceDays++;    continue }
    if (!day.shift_type_id)                                    { continue }

    daysWorked++
    const h   = calculateDay(day)
    const pay = dayPay(h, hourlyRate)
    ordinary     += h.ordinary
    extra        += h.extra
    extraDiurDom += h.extraDiurDom
    extraNoct    += h.extraNoct
    extraNoctDom += h.extraNoctDom
    night        += h.night
    surcharge    += h.surcharge
    sundayHoliday+= h.sundayHoliday
    recDomNoct   += h.recDomNoct
    grossPay     += pay

    breakdown.push({
      date:         day.schedule_date,
      shiftCode:    day.shift_code || null,
      ordinary:     h.ordinary,
      extra:        h.extra,
      extraDiurDom: h.extraDiurDom,
      extraNoct:    h.extraNoct,
      extraNoctDom: h.extraNoctDom,
      night:        h.night,
      surcharge:    h.surcharge,
      sundayHoliday:h.sundayHoliday,
      recDomNoct:   h.recDomNoct,
      pay:          Math.round(pay),
    })
  }

  return {
    hourlyRate,
    daysWorked, restDays, absenceDays, disabilityDays, vacationDays,
    ordinary, extra, extraDiurDom, extraNoct, extraNoctDom,
    night, surcharge, sundayHoliday, recDomNoct,
    grossPay: Math.round(grossPay),
    breakdown,
  }
}

module.exports = { calculateDay, dayPay, aggregateEmployee, isWorkedDay }

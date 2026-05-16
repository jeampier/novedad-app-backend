const { registry: builtinRegistry } = require('../concepts/builtin')
const { aggregateEmployee }         = require('../calculators/HoursCalculator')

async function applyConcepts(ctx) {
  const builtins  = builtinRegistry.getAll()
  let totalWorked = 0

  for (const emp of ctx.employees) {
    const days    = ctx.schedulesByEmployee[emp.id] || []
    const agg     = aggregateEmployee(days, emp.base_salary)
    const concepts = {}

    // Run each built-in concept calculator
    for (const concept of builtins) {
      const result = concept.calculate(emp, days, ctx.settings)
      concepts[concept.code] = {
        label:    concept.label,
        type:     concept.type,
        category: concept.category,
        builtin:  true,
        value:    result.value,
        hours:    result.hours ?? null,
        breakdown: result.breakdown,
      }
    }

    // Absence deductions — one entry per absence type configured with deduction_pct > 0
    const absenceTypesMap = ctx.absenceTypesMap || {}
    const dailyRate       = Number(emp.base_salary) / 30
    const daysByType      = {}
    for (const day of days) {
      if (day.absence_type && !day.is_rest_day) {
        daysByType[day.absence_type] = (daysByType[day.absence_type] || 0) + 1
      }
    }

    let absenceDeductionTotal = 0
    const absenceBreakdown    = []
    for (const [code, daysCount] of Object.entries(daysByType)) {
      const cfg = absenceTypesMap[code]
      if (!cfg) continue
      const pct   = Number(cfg.deduction_pct)
      if (pct <= 0) continue
      const value = Math.round(daysCount * dailyRate * pct)
      absenceDeductionTotal += value
      absenceBreakdown.push({ type: code, name: cfg.name, days: daysCount, pct, value })
    }

    if (absenceDeductionTotal > 0) {
      concepts['DESC_AUSENCIA'] = {
        label:     'Descuento por ausencias',
        type:      'deduction',
        category:  'absence',
        builtin:   true,
        value:     absenceDeductionTotal,
        hours:     null,
        breakdown: absenceBreakdown,
      }
    }

    ctx.employeeResults[emp.id] = {
      employee:      emp,
      days,
      attendance: {
        daysWorked:     agg.daysWorked,
        restDays:       agg.restDays,
        absenceDays:    agg.absenceDays,
        disabilityDays: agg.disabilityDays,
        vacationDays:   agg.vacationDays,
      },
      hours: {
        ordinary:     agg.ordinary,
        extra:        agg.extra,
        extraDiurDom: agg.extraDiurDom,
        extraNoct:    agg.extraNoct,
        extraNoctDom: agg.extraNoctDom,
        night:        agg.night,
        surcharge:    agg.surcharge,
        sundayHoliday:agg.sundayHoliday,
        recDomNoct:   agg.recDomNoct,
      },
      hourlyRate: agg.hourlyRate,
      concepts,
      // Final totals filled by calculateTotals
      grossPay:   0,
      deductions: 0,
      netPay:     0,
    }

    totalWorked += agg.daysWorked
  }

  ctx.log(
    'applyConcepts',
    `${ctx.employees.length} empleados procesados con ${builtins.length} conceptos built-in`,
    { builtinCodes: builtinRegistry.codes(), totalDaysWorked: totalWorked }
  )

  return ctx
}

module.exports = applyConcepts

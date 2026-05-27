const { evaluate, evaluateConditions } = require('../evaluators/FormulaEvaluator')

function buildVariables(result, settings = {}) {
  const { employee, attendance, hours } = result
  return {
    base_salary:          Number(employee.base_salary) || 0,
    days_worked:          attendance.daysWorked,
    absence_days:         attendance.absenceDays,
    disability_days:      attendance.disabilityDays,
    vacation_days:        attendance.vacationDays,
    hours_worked:              hours.ordinary,
    extra_hours:               hours.extra,
    extra_diur_dom_hours:      hours.extraDiurDom,
    extra_noct_hours:          hours.extraNoct,
    extra_noct_dom_hours:      hours.extraNoctDom,
    night_hours:               hours.night,
    surcharge_hours:           hours.surcharge,
    sunday_holiday_hours:      hours.sundayHoliday,
    rec_dom_noct_hours:        hours.recDomNoct,
    hourly_rate:          result.hourlyRate,
    smmlv:                Number(employee.smmlv) || Number(settings.smmlv) || 0,
  }
}

async function applyRules(ctx) {
  if (!ctx.dynamicConcepts.length) {
    ctx.log('applyRules', 'Sin conceptos dinámicos configurados — paso omitido')
    return ctx
  }

  let applied = 0, skipped = 0, errors = 0

  for (const emp of ctx.employees) {
    const result    = ctx.employeeResults[emp.id]
    const variables = buildVariables(result, ctx.settings)

    for (const concept of ctx.dynamicConcepts) {
      const activeRules = concept.rules
        .filter(r => r.active)
        .sort((a, b) => a.priority - b.priority)

      let conceptApplied = false

      for (const rule of activeRules) {
        const conditionsMet = evaluateConditions(rule.conditions, variables)
        if (!conditionsMet) { skipped++; continue }

        const evalResult = evaluate(rule.formula, variables)

        if (!evalResult.success) {
          ctx.warn('applyRules', `Regla ${rule.id} (${concept.code}) falló para ${emp.name}: ${evalResult.error}`, {
            ruleId: rule.id, empId: emp.id, formula: rule.formula,
          })
          errors++
          continue
        }

        result.concepts[concept.code] = {
          label:    concept.name,
          type:     concept.type,
          category: concept.category,
          builtin:  false,
          ruleId:   rule.id,
          ruleName: rule.name,
          value:    evalResult.result,
          variables,
          formula:  rule.formula,
        }

        conceptApplied = true
        applied++
        break // First matching rule wins
      }

      if (!conceptApplied && activeRules.length > 0) {
        ctx.log('applyRules', `Concepto ${concept.code} sin regla aplicable para ${emp.name}`)
      }
    }
  }

  ctx.log(
    'applyRules',
    `Conceptos dinámicos: ${applied} aplicados · ${skipped} omitidos · ${errors} errores`,
    { concepts: ctx.dynamicConcepts.map(c => c.code) }
  )

  return ctx
}

module.exports = applyRules

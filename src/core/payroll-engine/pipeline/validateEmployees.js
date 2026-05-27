const { query } = require('../../../db/client')
const validationRulesRepo = require('../../../repositories/validationRulesRepo')

async function validateEmployees(ctx) {
  const activeRules = new Set(await validationRulesRepo.findActive())

  if (activeRules.size === 0) {
    ctx.log('validateEmployees', 'Sin reglas de validación activas — paso omitido')
    ctx.warnings = []
    return ctx
  }

  const warnings = []
  const empIds = ctx.employees.map(e => e.id)

  // Cargar contratos activos en bulk para todos los empleados
  let activeContractIds = new Set()
  if (activeRules.has('CHECK_ACTIVE_CONTRACT') && empIds.length > 0) {
    const { rows } = await query(
      `SELECT DISTINCT employee_id FROM contracts WHERE status = 'activo' AND employee_id = ANY($1)`,
      [empIds]
    )
    activeContractIds = new Set(rows.map(r => r.employee_id))
  }

  // Verificar si el período ya tiene registros
  let periodAlreadyCalculated = false
  if (activeRules.has('CHECK_RECALCULATION')) {
    const { rows } = await query(
      `SELECT COUNT(*) AS cnt FROM payroll_records WHERE period_id = $1`,
      [ctx.periodId]
    )
    periodAlreadyCalculated = Number(rows[0].cnt) > 0
    if (periodAlreadyCalculated) {
      warnings.push({
        rule:    'CHECK_RECALCULATION',
        scope:   'period',
        message: `El período ya tiene ${rows[0].cnt} registro(s) calculado(s). Este cálculo sobreescribirá los valores anteriores.`,
      })
    }
  }

  for (const emp of ctx.employees) {
    if (activeRules.has('CHECK_ACTIVE_CONTRACT') && !activeContractIds.has(emp.id)) {
      warnings.push({ rule: 'CHECK_ACTIVE_CONTRACT', scope: 'employee', employeeId: emp.id, employeeName: emp.name,
        message: `${emp.name} no tiene contrato activo.` })
    }

    if (activeRules.has('CHECK_BASE_SALARY') && Number(emp.base_salary) === 0) {
      warnings.push({ rule: 'CHECK_BASE_SALARY', scope: 'employee', employeeId: emp.id, employeeName: emp.name,
        message: `${emp.name} tiene salario base en $0.` })
    }

    if (activeRules.has('CHECK_SCHEDULE')) {
      const days = ctx.schedulesByEmployee[emp.id] || []
      if (days.length === 0) {
        warnings.push({ rule: 'CHECK_SCHEDULE', scope: 'employee', employeeId: emp.id, employeeName: emp.name,
          message: `${emp.name} no tiene programación en este período.` })
      }
    }
  }

  ctx.warnings = warnings

  if (warnings.length > 0) {
    ctx.warn('validateEmployees', `${warnings.length} advertencia(s) encontrada(s)`, { warnings })
  } else {
    ctx.log('validateEmployees', 'Validación OK — sin advertencias')
  }

  return ctx
}

module.exports = validateEmployees

const math = require('mathjs')

const BASE_VARIABLES = [
  { key: 'base_salary',          label: 'Salario base',          category: 'Empleado',   example: 1500000 },
  { key: 'days_worked',          label: 'Días trabajados',       category: 'Asistencia', example: 25 },
  { key: 'hours_worked',         label: 'Horas ordinarias',      category: 'Horas',      example: 192 },
  { key: 'extra_hours',          label: 'Horas extra',           category: 'Horas',      example: 8 },
  { key: 'night_hours',          label: 'Horas nocturnas',       category: 'Horas',      example: 0 },
  { key: 'surcharge_hours',      label: 'Horas recargo',         category: 'Horas',      example: 0 },
  { key: 'sunday_holiday_hours', label: 'Horas dom/festivo',     category: 'Horas',      example: 0 },
  { key: 'absence_days',         label: 'Días ausencia',         category: 'Ausencias',  example: 0 },
  { key: 'disability_days',      label: 'Días incapacidad',      category: 'Ausencias',  example: 0 },
  { key: 'vacation_days',        label: 'Días vacaciones',       category: 'Ausencias',  example: 0 },
  { key: 'smmlv',                label: 'SMMLV',                 category: 'Legales',    example: 1300000 },
  { key: 'hourly_rate',          label: 'Valor hora (base/240)', category: 'Derivados',  example: 6250 },
]

const BLOCKED_FNS = new Set(['import', 'createUnit', 'require', 'process', 'eval', 'Function'])

function buildScope(vars) {
  const scope = {}
  for (const [k, v] of Object.entries(vars || {})) {
    const n = Number(v)
    scope[k] = isNaN(n) ? 0 : n
  }
  if (scope.hourly_rate === undefined && scope.base_salary) {
    scope.hourly_rate = scope.base_salary / 240
  }
  return scope
}

function validate(formula) {
  if (!formula || !formula.trim()) return { valid: false, error: 'Fórmula vacía' }
  try {
    const node = math.parse(formula)
    node.traverse(n => {
      if (n.type === 'FunctionNode' && BLOCKED_FNS.has(n.name)) {
        throw new Error(`Función no permitida: ${n.name}`)
      }
    })
    return { valid: true }
  } catch (e) {
    return { valid: false, error: e.message }
  }
}

function evaluate(formula, variables) {
  const v = validate(formula)
  if (!v.valid) return { success: false, error: v.error }
  try {
    const scope = buildScope(variables)
    const result = math.evaluate(formula, scope)
    if (typeof result !== 'number') return { success: false, error: 'La fórmula debe retornar un número' }
    if (!isFinite(result)) return { success: false, error: 'División por cero o resultado inválido' }
    return { success: true, result: Math.round(result * 100) / 100 }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

function evaluateConditions(conditions, variables) {
  if (!conditions || !conditions.rules || conditions.rules.length === 0) return true
  return evalGroup(conditions, buildScope(variables))
}

function evalGroup(group, scope) {
  const op = group.operator || 'AND'
  const rules = group.rules || []
  if (!rules.length) return true
  const results = rules.map(r => r.rules ? evalGroup(r, scope) : evalRule(r, scope))
  return op === 'AND' ? results.every(Boolean) : results.some(Boolean)
}

function evalRule({ variable, comparator, value }, scope) {
  const left  = Number(scope[variable] ?? 0)
  const right = Number(value)
  switch (comparator) {
    case 'eq':  return left === right
    case 'ne':  return left !== right
    case 'gt':  return left > right
    case 'gte': return left >= right
    case 'lt':  return left < right
    case 'lte': return left <= right
    default:    return false
  }
}

module.exports = { validate, evaluate, evaluateConditions, BASE_VARIABLES, buildScope }

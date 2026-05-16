const { query } = require('../../../db/client')

async function loadEmployees(ctx) {
  const { rows } = await query(`
    SELECT id, name, document, position, group_name, area, base_salary, smmlv, shift
    FROM employees
    WHERE status = 'active'
    ORDER BY name
  `)

  ctx.employees = rows
  ctx.log('loadEmployees', `${rows.length} empleados activos cargados`)

  if (rows.length === 0) {
    ctx.warn('loadEmployees', 'No hay empleados activos — el resultado será vacío')
  }

  return ctx
}

module.exports = loadEmployees

const { query } = require('../db/client')

async function findAll() {
  const { rows } = await query(`
    SELECT c.*, e.first_name, e.last_name
    FROM contracts c
    JOIN employees e ON e.id = c.employee_id
    ORDER BY c.created_at DESC
  `)
  return rows
}

async function findById(id) {
  const { rows } = await query(
    `SELECT c.*, e.first_name, e.last_name
     FROM contracts c
     JOIN employees e ON e.id = c.employee_id
     WHERE c.id = $1`,
    [id]
  )
  return rows[0] || null
}

async function findByEmployee(employee_id) {
  const { rows } = await query(
    `SELECT * FROM contracts WHERE employee_id = $1 ORDER BY start_date DESC`,
    [employee_id]
  )
  return rows
}

async function create(data) {
  const { employee_id, contract_type, start_date, end_date, position, base_salary, notes } = data
  const { rows } = await query(
    `INSERT INTO contracts (employee_id, contract_type, start_date, end_date, position, base_salary, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [employee_id, contract_type, start_date, end_date || null, position, base_salary, notes || null]
  )
  return rows[0]
}

async function updateStatus(id, status) {
  const { rows } = await query(
    `UPDATE contracts SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  )
  return rows[0] || null
}

async function remove(id) {
  await query('DELETE FROM contracts WHERE id = $1', [id])
}

module.exports = { findAll, findById, findByEmployee, create, updateStatus, remove }

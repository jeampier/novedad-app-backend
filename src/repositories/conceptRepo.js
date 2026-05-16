const { query } = require('../db/client')

async function findAll() {
  const { rows } = await query(`
    SELECT c.*,
      (SELECT COUNT(*) FROM payroll_rules r WHERE r.concept_id = c.id AND r.active = true)::int AS rules_count
    FROM payroll_concepts c
    ORDER BY c.type, c.category, c.code
  `)
  return rows
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM payroll_concepts WHERE id = $1', [id])
  return rows[0] || null
}

async function create({ code, name, type, category, description, active, createdBy }) {
  const { rows } = await query(
    `INSERT INTO payroll_concepts (code, name, type, category, description, active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [code, name, type, category, description || null, active ?? true, createdBy || null]
  )
  return rows[0]
}

async function update(id, { name, type, category, description, active }) {
  const { rows } = await query(
    `UPDATE payroll_concepts
     SET name=$1, type=$2, category=$3, description=$4, active=$5, updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [name, type, category, description || null, active, id]
  )
  return rows[0] || null
}

async function remove(id) {
  await query('DELETE FROM payroll_concepts WHERE id = $1', [id])
}

module.exports = { findAll, findById, create, update, remove }

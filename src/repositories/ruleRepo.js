const { query } = require('../db/client')

async function findByConcept(conceptId) {
  const { rows } = await query(
    'SELECT * FROM payroll_rules WHERE concept_id=$1 ORDER BY priority ASC, id ASC',
    [conceptId]
  )
  return rows
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM payroll_rules WHERE id=$1', [id])
  return rows[0] || null
}

async function create({ conceptId, name, formula, conditions, priority, active, createdBy }) {
  const { rows } = await query(
    `INSERT INTO payroll_rules (concept_id, name, formula, conditions, priority, active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [conceptId, name || null, formula, JSON.stringify(conditions || {}), priority ?? 0, active ?? true, createdBy || null]
  )
  return rows[0]
}

async function update(id, { name, formula, conditions, priority, active }) {
  const { rows } = await query(
    `UPDATE payroll_rules
     SET name=$1, formula=$2, conditions=$3, priority=$4, active=$5, updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [name || null, formula, JSON.stringify(conditions || {}), priority, active, id]
  )
  return rows[0] || null
}

async function remove(id) {
  await query('DELETE FROM payroll_rules WHERE id=$1', [id])
}

async function saveSnapshot(ruleId, ruleData, userId) {
  await query(
    'INSERT INTO rule_snapshots (rule_id, rule_data, created_by) VALUES ($1,$2,$3)',
    [ruleId, JSON.stringify(ruleData), userId || null]
  )
}

async function getSnapshots(ruleId) {
  const { rows } = await query(
    'SELECT * FROM rule_snapshots WHERE rule_id=$1 ORDER BY snapshot_at DESC LIMIT 20',
    [ruleId]
  )
  return rows
}

module.exports = { findByConcept, findById, create, update, remove, saveSnapshot, getSnapshots }

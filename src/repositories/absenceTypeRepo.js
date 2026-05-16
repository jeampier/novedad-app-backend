const { query } = require('../db/client')

const absenceTypeRepo = {
  async findAll() {
    const { rows } = await query(
      'SELECT * FROM absence_types ORDER BY active DESC, name ASC'
    )
    return rows
  },

  async findActive() {
    const { rows } = await query(
      'SELECT * FROM absence_types WHERE active = true ORDER BY name ASC'
    )
    return rows
  },

  async create(d) {
    const { rows } = await query(
      `INSERT INTO absence_types (code, name, description, deduction_pct, active)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [d.code, d.name, d.description || null, d.deduction_pct, d.active !== false]
    )
    return rows[0]
  },

  async update(id, d) {
    const { rows } = await query(
      `UPDATE absence_types
       SET name=$1, description=$2, deduction_pct=$3, active=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [d.name, d.description || null, d.deduction_pct, d.active !== false, id]
    )
    return rows[0] || null
  },

  async remove(id) {
    await query('DELETE FROM absence_types WHERE id=$1', [id])
  },
}

module.exports = absenceTypeRepo

const { query } = require('../db/client')

const validationRulesRepo = {
  async findAll() {
    const { rows } = await query(`SELECT * FROM payroll_validation_rules ORDER BY id`)
    return rows
  },

  async findActive() {
    const { rows } = await query(`SELECT code FROM payroll_validation_rules WHERE active = true`)
    return rows.map(r => r.code)
  },

  async setActive(id, active) {
    const { rows } = await query(
      `UPDATE payroll_validation_rules SET active = $1 WHERE id = $2 RETURNING *`,
      [active, id]
    )
    return rows[0]
  },
}

module.exports = validationRulesRepo

const { query } = require('../db/client')

const payrollPeriodRepo = {
  async findAll() {
    const { rows } = await query(
      'SELECT * FROM payroll_periods ORDER BY start_date DESC'
    )
    return rows
  },

  async findById(id) {
    const { rows } = await query(
      'SELECT * FROM payroll_periods WHERE id=$1', [id]
    )
    return rows[0]
  },

  async create(d) {
    const { rows } = await query(
      `INSERT INTO payroll_periods (name, start_date, end_date, created_by)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [d.name, d.startDate, d.endDate, d.createdBy]
    )
    return rows[0]
  },

  async close(id) {
    const { rows } = await query(
      `UPDATE payroll_periods SET status='closed' WHERE id=$1 RETURNING *`, [id]
    )
    return rows[0]
  },

  async reopen(id) {
    const { rows } = await query(
      `UPDATE payroll_periods SET status='open' WHERE id=$1 RETURNING *`, [id]
    )
    return rows[0]
  }
}

module.exports = payrollPeriodRepo

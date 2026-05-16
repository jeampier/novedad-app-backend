const { query } = require('../db/client')

const holidayRepo = {
  async findByYear(year) {
    const { rows } = await query(
      `SELECT * FROM holidays
       WHERE EXTRACT(YEAR FROM holiday_date) = $1
       ORDER BY holiday_date`,
      [year]
    )
    return rows
  },

  async findInRange(startDate, endDate) {
    const { rows } = await query(
      'SELECT holiday_date FROM holidays WHERE holiday_date BETWEEN $1 AND $2',
      [startDate, endDate]
    )
    return rows
  },

  async create(d) {
    const { rows } = await query(
      'INSERT INTO holidays (holiday_date, name) VALUES ($1,$2) RETURNING *',
      [d.holidayDate, d.name || null]
    )
    return rows[0]
  },

  async remove(id) {
    await query('DELETE FROM holidays WHERE id=$1', [id])
  }
}

module.exports = holidayRepo

const { query } = require('../db/client')
const accidentRepo = {
  async create(d) {
    const { rows } = await query(
      'INSERT INTO accidents (employee_id,date,description,severity,location,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [d.employeeId, d.date, d.description, d.severity, d.location, d.createdBy]
    )
    return rows[0]
  },
  async findAll() {
    const { rows } = await query('SELECT a.*,e.name as employee_name FROM accidents a JOIN employees e ON e.id=a.employee_id ORDER BY a.created_at DESC')
    return rows
  }
}
module.exports = accidentRepo

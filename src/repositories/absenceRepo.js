const { query } = require('../db/client')
const absenceRepo = {
  async create(d) {
    const { rows } = await query(
      'INSERT INTO absences (employee_id,type,start_date,end_date,reason,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [d.employeeId, d.type, d.startDate, d.endDate, d.reason, d.createdBy]
    )
    return rows[0]
  },
  async findAll() {
    const { rows } = await query('SELECT a.*,e.name as employee_name FROM absences a JOIN employees e ON e.id=a.employee_id ORDER BY a.created_at DESC')
    return rows
  }
}
module.exports = absenceRepo

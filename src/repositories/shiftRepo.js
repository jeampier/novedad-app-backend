const { query } = require('../db/client')
const shiftRepo = {
  async change(d) {
    const { rows } = await query(
      'INSERT INTO shifts (employee_id,new_shift,effective_date,reason,created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [d.employeeId, d.newShift, d.effectiveDate, d.reason, d.createdBy]
    )
    return rows[0]
  },
  async findAll() {
    const { rows } = await query('SELECT s.*,e.name as employee_name FROM shifts s JOIN employees e ON e.id=s.employee_id ORDER BY s.created_at DESC')
    return rows
  }
}
module.exports = shiftRepo

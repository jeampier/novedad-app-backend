const { query } = require('../db/client')

const BASE_SELECT = `
  SELECT r.*,
    e.name AS employee_name, e.document, e.position, e.group_name,
    u1.email AS requested_by_email,
    u2.email AS reviewed_by_email
  FROM employee_requests r
  JOIN employees e ON e.id = r.employee_id
  LEFT JOIN users u1 ON u1.id = r.requested_by
  LEFT JOIN users u2 ON u2.id = r.reviewed_by
`

const requestsRepo = {
  async findAll({ status, type, employeeId } = {}) {
    const where = []
    const vals  = []
    if (status)     { vals.push(status);     where.push(`r.status = $${vals.length}`) }
    if (type)       { vals.push(type);       where.push(`r.type = $${vals.length}`) }
    if (employeeId) { vals.push(employeeId); where.push(`r.employee_id = $${vals.length}`) }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const { rows } = await query(
      `${BASE_SELECT} ${clause} ORDER BY r.created_at DESC`, vals
    )
    return rows
  },

  async findById(id) {
    const { rows } = await query(`${BASE_SELECT} WHERE r.id=$1`, [id])
    return rows[0] || null
  },

  async create(d) {
    const { rows } = await query(
      `INSERT INTO employee_requests
         (type, employee_id, start_date, end_date, reason, requested_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [d.type, d.employeeId, d.startDate, d.endDate, d.reason || null, d.userId]
    )
    return requestsRepo.findById(rows[0].id)
  },

  async approve(id, { userId, notes, absenceId } = {}) {
    const { rows } = await query(
      `UPDATE employee_requests SET
         status='aprobada', reviewed_by=$2, reviewed_at=NOW(),
         review_notes=$3, absence_id=$4, updated_at=NOW()
       WHERE id=$1 AND status='pendiente' RETURNING id`,
      [id, userId, notes || null, absenceId || null]
    )
    if (!rows.length) return null
    return requestsRepo.findById(id)
  },

  async reject(id, { userId, notes } = {}) {
    const { rows } = await query(
      `UPDATE employee_requests SET
         status='rechazada', reviewed_by=$2, reviewed_at=NOW(),
         review_notes=$3, updated_at=NOW()
       WHERE id=$1 AND status='pendiente' RETURNING id`,
      [id, userId, notes || null]
    )
    if (!rows.length) return null
    return requestsRepo.findById(id)
  },

  async liquidate(id) {
    const { rows } = await query(
      `UPDATE employee_requests SET status='liquidada', updated_at=NOW()
       WHERE id=$1 AND status='aprobada' RETURNING id`,
      [id]
    )
    if (!rows.length) return null
    return requestsRepo.findById(id)
  },
}

module.exports = requestsRepo

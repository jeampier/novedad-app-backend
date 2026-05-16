const { query } = require('../db/client')

const employeeRepo = {
  async create(d) {
    const { rows } = await query(
      `INSERT INTO employees
         (first_name, last_name, document_type, document, position, area, group_name,
          start_date, shift_type_id, base_salary, smmlv, phone, email, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        d.firstName, d.lastName || '', d.documentType || 'CC',
        d.document, d.position, d.area || null, d.groupName || null,
        d.startDate || null, d.shiftTypeId || null, d.baseSalary || 0,
        d.smmlv || 0, d.phone || null, d.email || null, d.createdBy,
      ]
    )
    return rows[0]
  },

  async update(id, d) {
    const { rows } = await query(
      `UPDATE employees SET
         first_name    = $1,
         last_name     = $2,
         document_type = $3,
         document      = $4,
         position      = $5,
         area          = $6,
         group_name    = $7,
         shift_type_id = $8,
         base_salary   = $9,
         smmlv         = $10,
         phone         = $11,
         email         = $12
       WHERE id = $13 RETURNING *`,
      [
        d.firstName, d.lastName || '', d.documentType || 'CC',
        d.document, d.position, d.area || null, d.groupName || null,
        d.shiftTypeId || null, d.baseSalary ?? 0,
        d.smmlv ?? 0, d.phone || null, d.email || null, id,
      ]
    )
    return rows[0] || null
  },

  async deactivate(d) {
    const { rows } = await query(
      `UPDATE employees SET status='inactive', end_date=$2 WHERE id=$1 RETURNING *`,
      [d.employeeId, d.endDate]
    )
    return rows[0]
  },

  async setStatus(id, status) {
    const { rows } = await query(
      `UPDATE employees SET status=$2 WHERE id=$1 RETURNING *`,
      [id, status]
    )
    return rows[0]
  },

  async findAll() {
    const { rows } = await query(`
      SELECT e.*,
             st.name  AS shift_name,
             st.code  AS shift_code,
             st.color AS shift_color
      FROM employees e
      LEFT JOIN shift_types st ON st.id = e.shift_type_id
      WHERE e.status = 'active'
      ORDER BY e.last_name, e.first_name
    `)
    return rows
  },

  async findAll_including_inactive() {
    const { rows } = await query(`
      SELECT e.*,
             st.name  AS shift_name,
             st.code  AS shift_code,
             st.color AS shift_color
      FROM employees e
      LEFT JOIN shift_types st ON st.id = e.shift_type_id
      ORDER BY e.last_name, e.first_name
    `)
    return rows
  },

  async findById(id) {
    const { rows } = await query(`
      SELECT e.*,
             st.name  AS shift_name,
             st.code  AS shift_code,
             st.color AS shift_color
      FROM employees e
      LEFT JOIN shift_types st ON st.id = e.shift_type_id
      WHERE e.id = $1
    `, [id])
    return rows[0] || null
  },
}

module.exports = employeeRepo

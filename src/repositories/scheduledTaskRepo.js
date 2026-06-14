const { query } = require('../db/client')

const scheduledTaskRepo = {
  async findAll() {
    const { rows } = await query(`
      SELECT st.*, pp.name AS period_name
      FROM scheduled_tasks st
      LEFT JOIN payroll_periods pp ON pp.id = st.period_id
      ORDER BY st.created_at DESC
    `)
    return rows
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM scheduled_tasks WHERE id=$1', [id])
    return rows[0]
  },

  async findDue(hour, minute, dayOfWeek) {
    const { rows } = await query(
      `SELECT * FROM scheduled_tasks
       WHERE enabled = true AND hour = $1 AND minute = $2 AND $3 = ANY(days_of_week)`,
      [hour, minute, dayOfWeek]
    )
    return rows
  },

  async create(d) {
    const { rows } = await query(
      `INSERT INTO scheduled_tasks
        (name, task_type, period_id, hour, minute, days_of_week, enabled, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [d.name, d.taskType, d.periodId || null, d.hour, d.minute, d.daysOfWeek, d.enabled ?? true, d.createdBy]
    )
    return rows[0]
  },

  async update(id, d) {
    const { rows } = await query(
      `UPDATE scheduled_tasks SET
        name=$1, task_type=$2, period_id=$3, hour=$4, minute=$5,
        days_of_week=$6, enabled=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [d.name, d.taskType, d.periodId || null, d.hour, d.minute, d.daysOfWeek, d.enabled, id]
    )
    return rows[0]
  },

  async setEnabled(id, enabled) {
    const { rows } = await query(
      'UPDATE scheduled_tasks SET enabled=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [enabled, id]
    )
    return rows[0]
  },

  async remove(id) {
    const { rows } = await query('DELETE FROM scheduled_tasks WHERE id=$1 RETURNING id', [id])
    return rows[0]
  },

  async recordRun(id, status) {
    await query(
      'UPDATE scheduled_tasks SET last_run_at=NOW(), last_run_status=$1 WHERE id=$2',
      [status, id]
    )
  },

  async addLog(taskId, status, message, details = null) {
    await query(
      'INSERT INTO scheduled_task_logs (task_id, status, message, details) VALUES ($1,$2,$3,$4)',
      [taskId, status, message, details]
    )
  },

  async findRecentLogs(taskId, limit = 10) {
    const { rows } = await query(
      'SELECT * FROM scheduled_task_logs WHERE task_id=$1 ORDER BY run_at DESC LIMIT $2',
      [taskId, limit]
    )
    return rows
  },
}

module.exports = scheduledTaskRepo

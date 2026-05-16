const { query } = require('../db/client')

const workScheduleRepo = {
  async findByMonth(year, month) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end   = `${year}-${String(month).padStart(2, '0')}-31`
    const { rows } = await query(
      `SELECT
         e.id AS employee_id, e.name AS employee_name,
         e.position, e.group_name, e.area,
         ws.id, ws.schedule_date, ws.is_rest_day, ws.absence_type, ws.notes,
         st.id AS shift_type_id, st.code AS shift_code,
         st.name AS shift_name, st.color AS shift_color,
         st.ordinary_hours, st.extra_hours, st.extra_diur_dom_hours,
         st.extra_noct_hours, st.extra_noct_dom_hours,
         st.night_hours, st.surcharge_hours, st.sunday_holiday_hours, st.rec_dom_noct_hours
       FROM employees e
       LEFT JOIN work_schedule ws
         ON ws.employee_id = e.id
         AND ws.schedule_date BETWEEN $1 AND $2
       LEFT JOIN shift_types st ON st.id = ws.shift_type_id
       WHERE e.status = 'active'
       ORDER BY e.name, ws.schedule_date`,
      [start, end]
    )
    return rows
  },

  async findByEmployeeAndMonth(employeeId, year, month) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end   = `${year}-${String(month).padStart(2, '0')}-31`
    const { rows } = await query(
      `SELECT ws.*, st.code AS shift_code, st.name AS shift_name, st.color AS shift_color
       FROM work_schedule ws
       LEFT JOIN shift_types st ON st.id = ws.shift_type_id
       WHERE ws.employee_id=$1 AND ws.schedule_date BETWEEN $2 AND $3
       ORDER BY ws.schedule_date`,
      [employeeId, start, end]
    )
    return rows
  },

  async upsert(d) {
    const { rows } = await query(
      `INSERT INTO work_schedule
         (employee_id, schedule_date, shift_type_id, is_rest_day, absence_type, notes, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
       ON CONFLICT (employee_id, schedule_date)
       DO UPDATE SET
         shift_type_id = EXCLUDED.shift_type_id,
         is_rest_day   = EXCLUDED.is_rest_day,
         absence_type  = EXCLUDED.absence_type,
         notes         = EXCLUDED.notes,
         updated_by    = EXCLUDED.updated_by,
         updated_at    = NOW()
       RETURNING *`,
      [
        d.employeeId, d.scheduleDate,
        d.shiftTypeId || null, d.isRestDay || false,
        d.absenceType || null, d.notes || null,
        d.userId
      ]
    )
    return rows[0]
  },

  async upsertBulk(entries, userId) {
    const results = []
    for (const entry of entries) {
      results.push(await workScheduleRepo.upsert({ ...entry, userId }))
    }
    return results
  },

  async remove(id) {
    await query('DELETE FROM work_schedule WHERE id=$1', [id])
  },

  async findForPeriod(startDate, endDate) {
    const { rows } = await query(
      `SELECT ws.*, e.base_salary, e.name AS employee_name,
              st.ordinary_hours, st.extra_hours, st.extra_diur_dom_hours,
              st.extra_noct_hours, st.extra_noct_dom_hours,
              st.night_hours, st.surcharge_hours, st.sunday_holiday_hours, st.rec_dom_noct_hours,
              st.extra_multiplier, st.extra_diur_dom_multiplier,
              st.extra_noct_multiplier, st.extra_noct_dom_multiplier,
              st.night_multiplier, st.surcharge_multiplier,
              st.sunday_holiday_multiplier, st.rec_dom_noct_multiplier
       FROM work_schedule ws
       JOIN employees e ON e.id = ws.employee_id
       LEFT JOIN shift_types st ON st.id = ws.shift_type_id
       WHERE ws.schedule_date BETWEEN $1 AND $2
       ORDER BY ws.employee_id, ws.schedule_date`,
      [startDate, endDate]
    )
    return rows
  }
}

module.exports = workScheduleRepo

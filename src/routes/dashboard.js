const router = require('express').Router()
const { query } = require('../db/client')
const { requireAuth } = require('../middleware/auth')

router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const OPEN_PERIOD = `(SELECT id FROM payroll_periods WHERE status='open' LIMIT 1)`

    const [
      employees, absencesMonth, accidentsMonth,
      recentAbsences, absencesByType, activePeriod,
      absencesActiveToday, absenceDaysMonth, daysSinceAccident,
      scheduledEmployees, scheduledRestDays, scheduledAbsenceDays,
    ] = await Promise.all([
      query(`SELECT COUNT(*) FROM employees WHERE status='active'`),
      query(
        `SELECT COUNT(*) FROM absences
         WHERE EXTRACT(YEAR FROM start_date)=$1 AND EXTRACT(MONTH FROM start_date)=$2`,
        [year, month]
      ),
      query(
        `SELECT COUNT(*) FROM accidents
         WHERE EXTRACT(YEAR FROM date)=$1 AND EXTRACT(MONTH FROM date)=$2`,
        [year, month]
      ),
      query(
        `SELECT a.id, a.type, a.start_date, a.end_date, a.reason,
                e.name AS employee_name,
                COALESCE(at.name, a.type) AS type_name
         FROM absences a
         JOIN employees e ON e.id = a.employee_id
         LEFT JOIN absence_types at ON at.code = a.type
         ORDER BY a.created_at DESC LIMIT 8`
      ),
      query(
        `SELECT COALESCE(at.name, a.type) AS type_name, COUNT(*) AS count
         FROM absences a
         LEFT JOIN absence_types at ON at.code = a.type
         WHERE EXTRACT(YEAR FROM a.start_date)=$1 AND EXTRACT(MONTH FROM a.start_date)=$2
         GROUP BY type_name ORDER BY count DESC`,
        [year, month]
      ),
      query(`SELECT * FROM payroll_periods WHERE status='open' ORDER BY start_date DESC LIMIT 1`),
      query(
        `SELECT COUNT(*) FROM absences
         WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`
      ),
      query(
        `SELECT COALESCE(SUM(
           LEAST(end_date, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date)
           - GREATEST(start_date, DATE_TRUNC('month', CURRENT_DATE)::date)
           + 1
         ), 0) AS total_days
         FROM absences
         WHERE start_date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date
           AND end_date >= DATE_TRUNC('month', CURRENT_DATE)::date`
      ),
      query(`SELECT (CURRENT_DATE - MAX(date))::int AS days_since FROM accidents`),
      query(`SELECT COUNT(DISTINCT employee_id) FROM work_schedule
             WHERE period_id = ${OPEN_PERIOD} AND is_rest_day = false AND absence_type IS NULL`),
      query(`SELECT COUNT(*) FROM work_schedule
             WHERE period_id = ${OPEN_PERIOD} AND is_rest_day = true`),
      query(`SELECT COUNT(*) FROM work_schedule
             WHERE period_id = ${OPEN_PERIOD} AND absence_type IS NOT NULL`),
    ])

    res.json({
      data: {
        activeEmployees:      parseInt(employees.rows[0].count),
        absencesThisMonth:    parseInt(absencesMonth.rows[0].count),
        accidentsThisMonth:   parseInt(accidentsMonth.rows[0].count),
        recentAbsences:       recentAbsences.rows,
        absencesByType:       absencesByType.rows,
        activePeriod:         activePeriod.rows[0] || null,
        absencesActiveToday:  parseInt(absencesActiveToday.rows[0].count),
        absenceDaysMonth:     parseInt(absenceDaysMonth.rows[0].total_days),
        daysSinceAccident:    daysSinceAccident.rows[0].days_since ?? null,
        scheduledEmployees:   parseInt(scheduledEmployees.rows[0].count),
        scheduledRestDays:    parseInt(scheduledRestDays.rows[0].count),
        scheduledAbsenceDays: parseInt(scheduledAbsenceDays.rows[0].count),
      },
    })
  } catch (err) { next(err) }
})

module.exports = router

const router = require('express').Router()
const multer = require('multer')
const { requireAuth, requireRole } = require('../../middleware/auth')
const { importSchedule } = require('../../services/scheduleImportService')
const { query } = require('../../db/client')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.post('/:id/import-schedule', requireAuth, requireRole('admin', 'supervisor'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Se requiere un archivo .xlsx' })
    const result = await importSchedule(req.file.buffer, Number(req.params.id), req.user.id)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/schedule-grid', requireAuth, async (req, res, next) => {
  try {
    const { rows: periods } = await query('SELECT * FROM payroll_periods WHERE id=$1', [req.params.id])
    if (!periods.length) return res.status(404).json({ error: 'Período no encontrado' })

    const period = periods[0]
    const { rows } = await query(
      `SELECT
         e.id AS employee_id, e.name AS employee_name, e.group_name,
         ws.schedule_date, ws.is_rest_day, ws.absence_type, ws.notes
       FROM employees e
       JOIN work_schedule ws ON ws.employee_id = e.id
       WHERE ws.period_id = $1
       ORDER BY e.name, ws.schedule_date`,
      [req.params.id]
    )

    // Agrupar por empleado
    const employeeMap = new Map()
    for (const row of rows) {
      if (!employeeMap.has(row.employee_id)) {
        employeeMap.set(row.employee_id, {
          id: row.employee_id,
          name: row.employee_name,
          group: row.group_name,
          days: {}
        })
      }
      const day = String(row.schedule_date).slice(8, 10).replace(/^0/, '')
      const emp = employeeMap.get(row.employee_id)
      emp.days[day] = row.is_rest_day ? 'D' : (row.absence_type || row.notes || '')
    }

    res.json({
      data: {
        period: { id: period.id, name: period.name, start_date: period.start_date, end_date: period.end_date },
        employees: Array.from(employeeMap.values())
      }
    })
  } catch (err) { next(err) }
})

module.exports = router

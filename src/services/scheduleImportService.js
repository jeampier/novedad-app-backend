const ExcelJS = require('exceljs')
const { query } = require('../db/client')

const MONTH_NAMES = {
  ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6,
  JULIO: 7, AGOSTO: 8, SEPTIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12
}

function normalizeText(str) {
  return String(str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim()
}

function roundHours(val) {
  return Math.round(Number(val) * 100) / 100
}

async function buildColumnMap(ws) {
  const colMap = []
  let currentMonth = null

  for (let col = 4; col <= ws.columnCount; col++) {
    const monthCell = normalizeText(ws.getCell(1, col).value)
    const dayCell = ws.getCell(2, col).value

    if (monthCell && MONTH_NAMES[monthCell]) currentMonth = MONTH_NAMES[monthCell]
    if (!currentMonth || !dayCell) continue

    colMap.push({ col, month: currentMonth, day: Number(dayCell) })
  }

  return colMap
}

async function findEmployees() {
  const { rows } = await query(`SELECT id, name FROM employees WHERE status = 'active'`)
  return rows.map(e => ({ id: e.id, normalized_name: normalizeText(e.name) }))
}

async function importSchedule(fileBuffer, periodId, userId) {
  const { rows: periods } = await query('SELECT * FROM payroll_periods WHERE id = $1', [periodId])
  if (!periods.length) throw Object.assign(new Error('Período no encontrado'), { status: 404 })

  const period = periods[0]
  // Parsear como string para evitar offset de timezone del driver pg
  const startStr = String(period.start_date).slice(0, 10)
  const endStr   = String(period.end_date).slice(0, 10)
  const [targetYear, targetMonth] = startStr.split('-').map(Number)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(fileBuffer)
  const ws = wb.worksheets[0]

  const colMap = await buildColumnMap(ws)
  const monthCols = colMap.filter(c => c.month === targetMonth)

  if (!monthCols.length) {
    throw Object.assign(
      new Error(`El archivo no contiene datos para el mes ${targetMonth}/${targetYear}`),
      { status: 422 }
    )
  }

  // Check if unaccent extension is available, fallback to ilike
  const employees = await findEmployees()

  // Mapa horas → shift_type_id
  const { rows: shiftTypes } = await query('SELECT id, total_hours FROM shift_types WHERE active = true')
  const shiftMap = new Map(shiftTypes.map(s => [Number(s.total_hours), s.id]))

  const employeeMap = new Map(employees.map(e => [e.normalized_name, e.id]))

  const inserted = []
  const unmatched = []

  for (let row = 4; row <= ws.rowCount; row++) {
    const rawName = ws.getCell(row, 1).value
    if (!rawName) continue

    const normalizedName = normalizeText(rawName)
    if (normalizedName === 'MARMATO' || normalizedName === '') continue

    const employeeId = employeeMap.get(normalizedName)
    if (!employeeId) {
      unmatched.push(rawName)
      continue
    }

    for (const { col, day } of monthCols) {
      const scheduleDate = `${targetYear}-${String(targetMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      if (scheduleDate < startStr || scheduleDate > endStr) continue

      const cellVal = ws.getCell(row, col).value
      if (cellVal === null || cellVal === undefined) continue
      let isRestDay = false
      let absenceType = null
      let notes = null
      let shiftTypeId = null

      if (cellVal === 'D') {
        isRestDay = true
      } else if (cellVal === 'I') {
        absenceType = 'incapacidad'
      } else if (typeof cellVal === 'number') {
        const hours = roundHours(cellVal)
        notes = String(hours)
        shiftTypeId = shiftMap.get(hours) || null
      } else {
        continue
      }

      await query(
        `INSERT INTO work_schedule
           (employee_id, schedule_date, shift_type_id, is_rest_day, absence_type, notes, period_id, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
         ON CONFLICT (employee_id, schedule_date) DO UPDATE SET
           shift_type_id = EXCLUDED.shift_type_id,
           is_rest_day   = EXCLUDED.is_rest_day,
           absence_type  = EXCLUDED.absence_type,
           notes         = EXCLUDED.notes,
           period_id     = EXCLUDED.period_id,
           updated_by    = EXCLUDED.updated_by,
           updated_at    = NOW()`,
        [employeeId, scheduleDate, shiftTypeId, isRestDay, absenceType, notes, periodId, userId]
      )

      inserted.push({ employeeId, scheduleDate })
    }
  }

  return {
    period: period.name,
    month: targetMonth,
    year: targetYear,
    recordsUpserted: inserted.length,
    unmatchedEmployees: unmatched
  }
}

module.exports = { importSchedule }

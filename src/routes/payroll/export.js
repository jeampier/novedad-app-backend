const router = require('express').Router()
const repo   = require('../../repositories/payrollRecordRepo')
const periodRepo = require('../../repositories/payrollPeriodRepo')
const { requireAuth } = require('../../middleware/auth')

const COLUMNS = [
  { key: 'document',            label: 'Documento'         },
  { key: 'employee_name',       label: 'Empleado'          },
  { key: 'position',            label: 'Cargo'             },
  { key: 'group_name',          label: 'Grupo'             },
  { key: 'area',                label: 'Área'              },
  { key: 'days_worked',         label: 'Días trabajados'   },
  { key: 'rest_days',           label: 'Descansos'         },
  { key: 'absence_days',        label: 'Ausencias'         },
  { key: 'disability_days',     label: 'Incapacidades'     },
  { key: 'vacation_days',       label: 'Vacaciones'        },
  { key: 'ordinary_hours',      label: 'H. Ordinarias'     },
  { key: 'extra_hours',         label: 'H. Extras'         },
  { key: 'night_hours',         label: 'H. Nocturnas'      },
  { key: 'surcharge_hours',     label: 'H. Recargos'       },
  { key: 'sunday_holiday_hours',label: 'H. Dom/Festivos'   },
  { key: 'gross_pay',           label: 'Devengado'         },
  { key: 'deductions',          label: 'Deducciones'       },
  { key: 'net_pay',             label: 'Neto'              },
]

// GET /api/payroll/export?period_id=1&format=csv|xlsx
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { period_id, format = 'csv' } = req.query
    if (!period_id) return res.status(400).json({ error: 'Se requiere period_id' })

    const period  = await periodRepo.findById(period_id)
    if (!period)  return res.status(404).json({ error: 'Período no encontrado' })

    const records = await repo.findByPeriod(period_id)

    if (format === 'xlsx') {
      return exportXlsx(res, period, records)
    }
    return exportCsv(res, period, records)
  } catch (err) { next(err) }
})

function exportCsv(res, period, records) {
  const header = COLUMNS.map(c => `"${c.label}"`).join(',')
  const rows   = records.map(r =>
    COLUMNS.map(c => {
      const v = r[c.key]
      return v == null ? '' : `"${String(v).replace(/"/g, '""')}"`
    }).join(',')
  )
  const csv = [header, ...rows].join('\r\n')

  const filename = `nomina_${period.name.replace(/\s+/g, '_')}.csv`
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send('﻿' + csv) // BOM para Excel
}

async function exportXlsx(res, period, records) {
  const ExcelJS = require('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Novedad App'
  wb.created = new Date()

  const ws = wb.addWorksheet('Nómina', {
    views: [{ state: 'frozen', ySplit: 2 }]
  })

  ws.mergeCells('A1', String.fromCharCode(64 + COLUMNS.length) + '1')
  const titleCell = ws.getCell('A1')
  titleCell.value = `Nómina — ${period.name} (${period.start_date} al ${period.end_date})`
  titleCell.font  = { bold: true, size: 13 }
  titleCell.alignment = { horizontal: 'center' }

  ws.addRow(COLUMNS.map(c => c.label))
  const headerRow = ws.getRow(2)
  headerRow.font      = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
  headerRow.alignment = { horizontal: 'center' }

  const currencyCols = new Set(['gross_pay', 'deductions', 'net_pay'])
  const numberCols   = new Set([
    'days_worked', 'rest_days', 'absence_days', 'disability_days', 'vacation_days',
    'ordinary_hours', 'extra_hours', 'night_hours', 'surcharge_hours', 'sunday_holiday_hours'
  ])

  for (const record of records) {
    const row = ws.addRow(COLUMNS.map(c => record[c.key] ?? ''))
    COLUMNS.forEach((c, i) => {
      const cell = row.getCell(i + 1)
      if (currencyCols.has(c.key)) cell.numFmt = '#,##0'
      else if (numberCols.has(c.key)) cell.numFmt = '#,##0.00'
    })
  }

  // Totals row
  const totalRow = ws.addRow(
    COLUMNS.map(c => {
      if (c.key === 'employee_name') return 'TOTAL'
      if (numberCols.has(c.key) || currencyCols.has(c.key)) {
        return records.reduce((s, r) => s + Number(r[c.key] || 0), 0)
      }
      return ''
    })
  )
  totalRow.font = { bold: true }
  totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2F7' } }

  ws.columns.forEach((col, i) => {
    col.width = i < 5 ? 22 : 14
  })

  const filename = `nomina_${period.name.replace(/\s+/g, '_')}.xlsx`
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  await wb.xlsx.write(res)
  res.end()
}

module.exports = router

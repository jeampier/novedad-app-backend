require('dotenv').config()
const ExcelJS = require('exceljs')
const path = require('path')
const { pool } = require('./client')

const EXCEL_PATH = process.argv[2]

if (!EXCEL_PATH) {
  console.error('Uso: node seed_employees_from_excel.js <ruta-del-excel>')
  process.exit(1)
}

function splitName(fullName) {
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] }
  // 3+ words: primera palabra = nombre, resto = apellidos
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function normalizeCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim()
}

;(async () => {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path.resolve(EXCEL_PATH))
  const ws = wb.worksheets[0]

  const employees = []
  const seen = new Set()

  for (let row = 4; row <= ws.rowCount; row++) {
    const rawName = ws.getCell(row, 1).value
    const grupo   = ws.getCell(row, 2).value

    if (!rawName) continue
    const name = String(rawName).trim()
    if (!name || name.toUpperCase() === 'MARMATO') continue
    if (seen.has(name.toUpperCase())) continue
    seen.add(name.toUpperCase())

    const { firstName, lastName } = splitName(normalizeCase(name))
    employees.push({ firstName, lastName, groupName: grupo ? String(grupo) : null })
  }

  console.log(`Empleados encontrados en el Excel: ${employees.length}`)

  let inserted = 0
  let skipped = 0

  for (let i = 0; i < employees.length; i++) {
    const { firstName, lastName, groupName } = employees[i]
    const tempDoc = `TEMP-${String(i + 1).padStart(3, '0')}`

    try {
      await pool.query(
        `INSERT INTO employees (first_name, last_name, document, document_type, group_name, status, created_at)
         VALUES ($1, $2, $3, 'CC', $4, 'active', NOW())
         ON CONFLICT (document) DO NOTHING`,
        [firstName, lastName, tempDoc, groupName]
      )
      inserted++
      console.log(`  [OK] ${firstName} ${lastName} (doc: ${tempDoc}, grupo: ${groupName || '-'})`)
    } catch (e) {
      console.error(`  [ERROR] ${firstName} ${lastName}: ${e.message}`)
      skipped++
    }
  }

  console.log(`\nResumen: ${inserted} insertados, ${skipped} errores`)
  console.log('IMPORTANTE: Los documentos son temporales (TEMP-001, TEMP-002...). Actualízalos con los documentos reales.')

  await pool.end()
})()

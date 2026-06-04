const ExcelJS = require('exceljs')
const { query } = require('../db/client')

function str(v) { return v != null ? String(v).trim() : '' }
function num(v) { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n }
function bool(v) { if (v == null) return true; const s = String(v).toLowerCase().trim(); return s !== 'false' && s !== '0' && s !== 'no' }

async function parseExcel(buffer) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]
  const rows = []
  const headers = []
  ws.eachRow((row, i) => {
    const vals = row.values.slice(1)
    if (i === 1) { vals.forEach(h => headers.push(str(h).toLowerCase().replace(/\s+/g, '_'))); return }
    if (vals.every(v => v == null || str(v) === '')) return
    const obj = {}
    headers.forEach((h, idx) => { obj[h] = vals[idx] != null ? vals[idx] : null })
    obj.__row = i
    rows.push(obj)
  })
  return rows
}

async function importEmployees(buffer, userId) {
  const rows = await parseExcel(buffer)
  let inserted = 0, updated = 0
  const errors = []

  for (const r of rows) {
    const first_name = str(r.first_name || r.nombre)
    const document   = str(r.document || r.documento)
    const position   = str(r.position || r.cargo)

    if (!first_name) { errors.push({ row: r.__row, reason: 'first_name es requerido' }); continue }
    if (!document)   { errors.push({ row: r.__row, reason: 'document es requerido' }); continue }
    if (!position)   { errors.push({ row: r.__row, reason: 'position es requerido' }); continue }

    const last_name      = str(r.last_name || r.apellido)
    const document_type  = str(r.document_type || r.tipo_documento) || 'CC'
    const area           = str(r.area) || null
    const group_name     = str(r.group_name || r.grupo) || null
    const phone          = str(r.phone || r.telefono) || null
    const email          = str(r.email || r.correo) || null
    const start_date     = r.start_date || r.fecha_inicio || null
    const base_salary    = num(r.base_salary || r.salario_base)
    const smmlv          = num(r.smmlv)
    const shift_type_id  = r.shift_type_id ? parseInt(r.shift_type_id) : null

    const { rows: res } = await query(
      `INSERT INTO employees
         (first_name, last_name, document_type, document, position, area, group_name,
          phone, email, start_date, base_salary, smmlv, shift_type_id, status, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'active',$14,NOW())
       ON CONFLICT (document) DO UPDATE SET
         first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
         document_type=EXCLUDED.document_type, position=EXCLUDED.position,
         area=EXCLUDED.area, group_name=EXCLUDED.group_name, phone=EXCLUDED.phone,
         email=EXCLUDED.email, start_date=EXCLUDED.start_date, base_salary=EXCLUDED.base_salary,
         smmlv=EXCLUDED.smmlv, shift_type_id=EXCLUDED.shift_type_id
       RETURNING (xmax = 0) AS is_insert`,
      [first_name, last_name, document_type, document, position, area, group_name,
       phone, email, start_date, base_salary ?? 0, smmlv ?? 0, shift_type_id, userId]
    )
    res[0].is_insert ? inserted++ : updated++
  }

  return { total: rows.length, inserted, updated, errors }
}

async function importRateRules(buffer, userId) {
  const rows = await parseExcel(buffer)
  let inserted = 0, updated = 0
  const errors = []

  for (const r of rows) {
    const group_name = str(r.group_name || r.grupo) || null
    const position   = str(r.position || r.cargo)   || null

    const fields = {
      extra_multiplier:          num(r.extra_multiplier)          ?? 1.25,
      extra_diur_dom_multiplier: num(r.extra_diur_dom_multiplier) ?? 1.75,
      extra_noct_multiplier:     num(r.extra_noct_multiplier)     ?? 1.75,
      extra_noct_dom_multiplier: num(r.extra_noct_dom_multiplier) ?? 2.10,
      night_multiplier:          num(r.night_multiplier)          ?? 1.35,
      surcharge_multiplier:      num(r.surcharge_multiplier)      ?? 1.35,
      sunday_holiday_multiplier: num(r.sunday_holiday_multiplier) ?? 1.75,
      rec_dom_noct_multiplier:   num(r.rec_dom_noct_multiplier)   ?? 2.10,
      notes:                     str(r.notes || r.notas)          || null,
    }

    const { rows: existing } = await query(
      `SELECT id FROM payroll_rate_rules
       WHERE (group_name IS NOT DISTINCT FROM $1) AND (position IS NOT DISTINCT FROM $2)`,
      [group_name, position]
    )
    if (existing.length) {
      await query(
        `UPDATE payroll_rate_rules SET
           extra_multiplier=$1, extra_diur_dom_multiplier=$2, extra_noct_multiplier=$3,
           extra_noct_dom_multiplier=$4, night_multiplier=$5, surcharge_multiplier=$6,
           sunday_holiday_multiplier=$7, rec_dom_noct_multiplier=$8, notes=$9, updated_at=NOW()
         WHERE id=$10`,
        [fields.extra_multiplier, fields.extra_diur_dom_multiplier, fields.extra_noct_multiplier,
         fields.extra_noct_dom_multiplier, fields.night_multiplier, fields.surcharge_multiplier,
         fields.sunday_holiday_multiplier, fields.rec_dom_noct_multiplier, fields.notes, existing[0].id]
      )
      updated++
    } else {
      await query(
        `INSERT INTO payroll_rate_rules
           (group_name, position, extra_multiplier, extra_diur_dom_multiplier,
            extra_noct_multiplier, extra_noct_dom_multiplier, night_multiplier,
            surcharge_multiplier, sunday_holiday_multiplier, rec_dom_noct_multiplier,
            notes, created_by, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
        [group_name, position, fields.extra_multiplier, fields.extra_diur_dom_multiplier,
         fields.extra_noct_multiplier, fields.extra_noct_dom_multiplier, fields.night_multiplier,
         fields.surcharge_multiplier, fields.sunday_holiday_multiplier, fields.rec_dom_noct_multiplier,
         fields.notes, userId]
      )
      inserted++
    }
  }

  return { total: rows.length, inserted, updated, errors }
}

async function importAbsenceTypes(buffer, userId) {
  const rows = await parseExcel(buffer)
  let inserted = 0, updated = 0
  const errors = []

  for (const r of rows) {
    const code         = str(r.code || r.codigo).toLowerCase()
    const name         = str(r.name || r.nombre)
    const deduction_pct = num(r.deduction_pct ?? r.porcentaje_deduccion)

    if (!code)                   { errors.push({ row: r.__row, reason: 'code es requerido' }); continue }
    if (!name)                   { errors.push({ row: r.__row, reason: 'name es requerido' }); continue }
    if (deduction_pct == null)   { errors.push({ row: r.__row, reason: 'deduction_pct es requerido (0 a 1)' }); continue }
    if (deduction_pct < 0 || deduction_pct > 1) { errors.push({ row: r.__row, reason: 'deduction_pct debe estar entre 0 y 1' }); continue }

    const description = str(r.description || r.descripcion) || null
    const active      = bool(r.active || r.activo)

    const { rows: res } = await query(
      `INSERT INTO absence_types (code, name, description, deduction_pct, active)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (code) DO UPDATE SET
         name=EXCLUDED.name, description=EXCLUDED.description,
         deduction_pct=EXCLUDED.deduction_pct, active=EXCLUDED.active
       RETURNING (xmax = 0) AS is_insert`,
      [code, name, description, deduction_pct, active]
    )
    res[0].is_insert ? inserted++ : updated++
  }

  return { total: rows.length, inserted, updated, errors }
}

async function importAbsenceCatalog(buffer, userId) {
  const rows = await parseExcel(buffer)
  let inserted = 0, updated = 0
  const errors = []

  for (const r of rows) {
    const code        = str(r.code || r.codigo).toLowerCase()
    const description = str(r.description || r.descripcion) || null

    if (!code) { errors.push({ row: r.__row, reason: 'code es requerido' }); continue }

    const { rows: res } = await query(
      `INSERT INTO absence_code_catalog (code, description)
       VALUES ($1,$2)
       ON CONFLICT (code) DO UPDATE SET description=EXCLUDED.description
       RETURNING (xmax = 0) AS is_insert`,
      [code, description]
    )
    res[0].is_insert ? inserted++ : updated++
  }

  return { total: rows.length, inserted, updated, errors }
}

async function importConcepts(buffer, userId) {
  const rows = await parseExcel(buffer)
  let inserted = 0, updated = 0
  const errors = []
  const validTypes = ['earning', 'deduction', 'base', 'derived']

  for (const r of rows) {
    const code     = str(r.code || r.codigo).toUpperCase()
    const name     = str(r.name || r.nombre)
    const type     = str(r.type || r.tipo).toLowerCase()
    const category = str(r.category || r.categoria)

    if (!code)                      { errors.push({ row: r.__row, reason: 'code es requerido' }); continue }
    if (!name)                      { errors.push({ row: r.__row, reason: 'name es requerido' }); continue }
    if (!validTypes.includes(type)) { errors.push({ row: r.__row, reason: `type inválido: "${type}". Valores: ${validTypes.join(', ')}` }); continue }
    if (!category)                  { errors.push({ row: r.__row, reason: 'category es requerido' }); continue }

    const description = str(r.description || r.descripcion) || null
    const active      = bool(r.active || r.activo)

    const { rows: res } = await query(
      `INSERT INTO payroll_concepts (code, name, type, category, description, active, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (code) DO UPDATE SET
         name=EXCLUDED.name, type=EXCLUDED.type, category=EXCLUDED.category,
         description=EXCLUDED.description, active=EXCLUDED.active,
         updated_at=NOW()
       RETURNING (xmax = 0) AS is_insert`,
      [code, name, type, category, description, active, userId]
    )
    res[0].is_insert ? inserted++ : updated++
  }

  return { total: rows.length, inserted, updated, errors }
}

const TEMPLATES = {
  employees: {
    headers: ['first_name','last_name','document_type','document','position','area','group_name','shift_type_id','start_date','base_salary','smmlv','phone','email'],
    example:  ['Juan','Pérez','CC','123456789','Operador','Producción','Grupo A',1,'2024-01-01',1300000,1,'3001234567','juan@empresa.com'],
  },
  'rate-rules': {
    headers: ['group_name','position','extra_multiplier','extra_diur_dom_multiplier','extra_noct_multiplier','extra_noct_dom_multiplier','night_multiplier','surcharge_multiplier','sunday_holiday_multiplier','rec_dom_noct_multiplier','notes'],
    example:  ['Grupo A','Operador',1.25,1.75,1.75,2.10,1.35,1.35,1.75,2.10,'Regla estándar'],
  },
  'absence-types': {
    headers: ['code','name','deduction_pct','description','active'],
    example:  ['incapacidad','Incapacidad médica',0,'Cubierta por EPS desde día 3',true],
  },
  'absence-catalog': {
    headers: ['code','description'],
    example:  ['eps001','Incapacidad EPS general'],
  },
  concepts: {
    headers: ['code','name','type','category','description','active'],
    example:  ['BONO_ALIM','Bonificación de alimentación','earning','Bonificaciones','Pago mensual de alimentación',true],
  },
}

async function generateTemplate(entity) {
  const tpl = TEMPLATES[entity]
  if (!tpl) return null
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Plantilla')
  ws.addRow(tpl.headers)
  ws.addRow(tpl.example)
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  tpl.headers.forEach((_, i) => { ws.getColumn(i + 1).width = 22 })
  return wb
}

module.exports = { importEmployees, importRateRules, importAbsenceTypes, importAbsenceCatalog, importConcepts, generateTemplate, TEMPLATES }

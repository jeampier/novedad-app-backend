require('dotenv').config()
const { pool } = require('./client')

const CONCEPTS = [
  // ── DEVENGOS ─────────────────────────────────────────────────────────────
  {
    code:        'BONO_ALIM',
    name:        'Bonificación de alimentación',
    type:        'earning',
    category:    'Bonificaciones',
    description: 'Auxilio de alimentación por día efectivamente trabajado',
    rules: [
      {
        name:       'Valor por día trabajado',
        formula:    'days_worked * 6000',
        conditions: { operator: 'AND', rules: [{ variable: 'days_worked', comparator: 'gt', value: 0 }] },
        priority:   0,
      },
    ],
  },
  {
    code:        'PRIMA_SERV',
    name:        'Prima de servicios (prop.)',
    type:        'earning',
    category:    'Prestaciones',
    description: 'Prima proporcional al período — base_salary / 360 × días trabajados',
    rules: [
      {
        name:       'Cálculo proporcional',
        formula:    'round((base_salary / 360) * days_worked)',
        conditions: { operator: 'AND', rules: [{ variable: 'days_worked', comparator: 'gt', value: 0 }] },
        priority:   0,
      },
    ],
  },
  {
    code:        'RODAMIENTO',
    name:        'Rodamiento / Movilización',
    type:        'earning',
    category:    'Bonificaciones',
    description: 'Auxilio de transporte adicional para cargos con desplazamiento',
    rules: [
      {
        name:       'Valor fijo mensual',
        formula:    '150000',
        conditions: { operator: 'AND', rules: [{ variable: 'days_worked', comparator: 'gt', value: 0 }] },
        priority:   0,
      },
    ],
  },

  // ── DEDUCCIONES ───────────────────────────────────────────────────────────
  {
    code:        'SINDICATO',
    name:        'Cuota sindical',
    type:        'deduction',
    category:    'Deducciones voluntarias',
    description: 'Cuota mensual al sindicato — 1% del salario base',
    rules: [
      {
        name:       '1% salario base',
        formula:    'round(base_salary * 0.01)',
        conditions: { operator: 'AND', rules: [{ variable: 'base_salary', comparator: 'gt', value: 0 }] },
        priority:   0,
      },
    ],
  },
  {
    code:        'LIBRANZA',
    name:        'Libranza / Crédito empresa',
    type:        'deduction',
    category:    'Deducciones voluntarias',
    description: 'Descuento por libranza o crédito desembolsado por la empresa (valor fijo por acuerdo)',
    rules: [
      {
        name:       'Cuota fija acordada',
        formula:    '200000',
        conditions: { operator: 'AND', rules: [{ variable: 'days_worked', comparator: 'gt', value: 0 }] },
        priority:   0,
      },
    ],
  },
  {
    code:        'EMBARGO',
    name:        'Embargo judicial',
    type:        'deduction',
    category:    'Deducciones legales',
    description: 'Embargo ordenado por juzgado — máximo 20% del salario neto según CST art. 154',
    rules: [
      {
        name:       '20% del salario base',
        formula:    'round(base_salary * 0.20)',
        conditions: { operator: 'AND', rules: [{ variable: 'base_salary', comparator: 'gt', value: 0 }] },
        priority:   0,
      },
    ],
  },
]

async function seed() {
  let created = 0

  for (const c of CONCEPTS) {
    // Skip if code already exists
    const { rows: existing } = await pool.query(
      `SELECT id FROM payroll_concepts WHERE code=$1`, [c.code]
    )
    if (existing.length > 0) {
      console.log(`  ⚠  ${c.code} ya existe — omitido`)
      continue
    }

    const { rows } = await pool.query(
      `INSERT INTO payroll_concepts (code, name, type, category, description, active)
       VALUES ($1,$2,$3,$4,$5,true) RETURNING id`,
      [c.code, c.name, c.type, c.category, c.description]
    )
    const conceptId = rows[0].id

    for (const r of c.rules) {
      await pool.query(
        `INSERT INTO payroll_rules (concept_id, name, formula, conditions, priority, active)
         VALUES ($1,$2,$3,$4,$5,true)`,
        [conceptId, r.name, r.formula, JSON.stringify(r.conditions), r.priority]
      )
    }

    console.log(`  ✓ ${c.code} — ${c.name}`)
    created++
  }

  console.log(`\nseed_concepts: ${created} conceptos creados`)
}

seed()
  .then(() => process.exit(0))
  .catch(e => { console.error(e.message); process.exit(1) })

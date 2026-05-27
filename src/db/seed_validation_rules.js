require('dotenv').config()
const { pool } = require('./client')

const RULES = [
  {
    code:        'CHECK_ACTIVE_CONTRACT',
    name:        'Empleado sin contrato activo',
    description: 'Advierte si el empleado no tiene un contrato en estado activo al momento del cálculo.',
  },
  {
    code:        'CHECK_BASE_SALARY',
    name:        'Empleado con salario base cero',
    description: 'Advierte si el empleado tiene salario base en $0, lo que generará un pago neto de $0.',
  },
  {
    code:        'CHECK_RECALCULATION',
    name:        'Período ya calculado',
    description: 'Advierte si el período ya tiene registros de nómina guardados (posible recálculo).',
  },
  {
    code:        'CHECK_SCHEDULE',
    name:        'Empleado sin programación en el período',
    description: 'Advierte si el empleado no tiene ningún día programado en el período a calcular.',
  },
]

async function seed() {
  for (const r of RULES) {
    const { rows } = await pool.query(`SELECT id FROM payroll_validation_rules WHERE code = $1`, [r.code])
    if (rows.length > 0) { console.log(`  ⚠  ${r.code} ya existe — omitido`); continue }
    await pool.query(
      `INSERT INTO payroll_validation_rules (code, name, description) VALUES ($1, $2, $3)`,
      [r.code, r.name, r.description]
    )
    console.log(`  ✓ ${r.code}`)
  }
  console.log('\nseed_validation_rules: OK')
}

seed()
  .then(() => process.exit(0))
  .catch(e => { console.error(e.message); process.exit(1) })

require('dotenv').config()
const { pool } = require('./client')

const settings = [
  { key: 'smmlv',              value: 1750905, description: 'Salario Mínimo Mensual Legal Vigente 2026' },
  { key: 'aux_trans',          value: 249095,  description: 'Auxilio de transporte mensual 2026 (aplica IBC ≤ 2×SMMLV)' },
  { key: 'tasa_salud',         value: 0.04,    description: 'Tasa de salud empleado (ej: 0.04 = 4%)' },
  { key: 'tasa_pension',       value: 0.04,    description: 'Tasa de pensión empleado (ej: 0.04 = 4%)' },
  { key: 'tasa_solidaridad',   value: 0.01,    description: 'Tasa fondo solidaridad (aplica si IBC > 4×SMMLV)' },
  { key: 'limite_aux_trans',   value: 2,       description: 'Múltiplo de SMMLV para auxilio de transporte (ej: 2 = hasta 2×SMMLV)' },
  { key: 'limite_solidaridad', value: 4,       description: 'Múltiplo de SMMLV para fondo solidaridad (ej: 4 = IBC > 4×SMMLV)' },
]

;(async () => {
  try {
    for (const s of settings) {
      await pool.query(
        `INSERT INTO payroll_settings (key, value, description, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value,
               description = EXCLUDED.description,
               updated_at = NOW()`,
        [s.key, s.value, s.description]
      )
      console.log(`✓ ${s.key} = ${s.value}`)
    }
    console.log('Seed payroll_settings completado')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
})()

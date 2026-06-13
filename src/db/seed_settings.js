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
  // Factores legales de horas extra y recargos (CST art. 168 + Ley 789/2002)
  { key: 'extra_multiplier',          value: 1.25, description: 'Hora extra diurna (HED). Base legal: 25% adicional.' },
  { key: 'extra_noct_multiplier',     value: 1.75, description: 'Hora extra nocturna (HEN). Base legal: 75% adicional.' },
  { key: 'night_multiplier',          value: 1.35, description: 'Recargo nocturno (RN). Base legal: 35% adicional.' },
  { key: 'surcharge_multiplier',      value: 1.35, description: 'Recargo nocturno general (RN). Base legal: 35% adicional.' },
  { key: 'sunday_holiday_multiplier', value: 1.75, description: 'Recargo dominical/festivo (RDF). Base legal: 75% adicional.' },
  { key: 'extra_diur_dom_multiplier', value: 2.00, description: 'Hora extra diurna en dominical/festivo (HEDDF). Base legal: 100% adicional.' },
  { key: 'extra_noct_dom_multiplier', value: 2.50, description: 'Hora extra nocturna en dominical/festivo (HENDF). Base legal: 150% adicional.' },
  { key: 'rec_dom_noct_multiplier',   value: 2.10, description: 'Recargo nocturno en dominical/festivo (RNDF). Base legal: 110% adicional.' },
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

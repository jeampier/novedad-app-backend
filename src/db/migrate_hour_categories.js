require('dotenv').config()
const { pool } = require('./client')

;(async () => {
  try {
    await pool.query(`
      ALTER TABLE shift_types
        ADD COLUMN IF NOT EXISTS extra_diur_dom_hours   NUMERIC(4,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS extra_noct_hours       NUMERIC(4,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS extra_noct_dom_hours   NUMERIC(4,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS rec_dom_noct_hours     NUMERIC(4,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS extra_diur_dom_multiplier NUMERIC(4,2) DEFAULT 1.75,
        ADD COLUMN IF NOT EXISTS extra_noct_multiplier     NUMERIC(4,2) DEFAULT 1.75,
        ADD COLUMN IF NOT EXISTS extra_noct_dom_multiplier NUMERIC(4,2) DEFAULT 2.10,
        ADD COLUMN IF NOT EXISTS rec_dom_noct_multiplier   NUMERIC(4,2) DEFAULT 2.10
    `)
    console.log('✓ Columnas de horas agregadas a shift_types')
    console.log('  extra_diur_dom, extra_noct, extra_noct_dom, rec_dom_noct (+ sus multipliers)')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
})()

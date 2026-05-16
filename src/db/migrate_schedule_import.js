require('dotenv').config()
const { pool } = require('./client')

const schema = `
ALTER TABLE work_schedule ADD COLUMN IF NOT EXISTS period_id INTEGER REFERENCES payroll_periods(id);
CREATE INDEX IF NOT EXISTS idx_work_schedule_period ON work_schedule(period_id);
`

;(async () => {
  try {
    await pool.query(schema)
    console.log('Migración schedule import completada')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
})()

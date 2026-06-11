require('dotenv').config()
const { pool } = require('./client')

;(async () => {
  try {
    await pool.query(`
      ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS bank_name      VARCHAR(60),
        ADD COLUMN IF NOT EXISTS account_type   VARCHAR(20),
        ADD COLUMN IF NOT EXISTS account_number VARCHAR(30)
    `)
    console.log('Migración employee_bank completada — columnas bank_name, account_type, account_number agregadas a employees')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
})()

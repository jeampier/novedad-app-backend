require('dotenv').config()
const { pool } = require('./client')

;(async () => {
  try {
    await pool.query(`
      ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS smmlv NUMERIC(14,2) DEFAULT 0
    `)
    console.log('Migración smmlv completada — columna smmlv agregada a employees')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
})()

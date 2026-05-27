require('dotenv').config()
const { pool } = require('./client')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll_validation_rules (
        id          SERIAL PRIMARY KEY,
        code        VARCHAR(60) UNIQUE NOT NULL,
        name        VARCHAR(120) NOT NULL,
        description TEXT,
        active      BOOLEAN DEFAULT true,
        created_at  TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('migrate_validation_rules: OK')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(e => { console.error(e.message); process.exit(1) })

const { Pool, types } = require('pg')
// Devolver DATE como string (no como Date JS) para evitar offset de timezone
types.setTypeParser(1082, val => val)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})
async function query(text, params) {
  return pool.query(text, params)
}
module.exports = { query, pool }

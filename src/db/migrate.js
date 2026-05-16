require('dotenv').config()
const { pool } = require('./client')
const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(120) NOT NULL, role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL,
  document VARCHAR(30) UNIQUE NOT NULL, position VARCHAR(80),
  area VARCHAR(80), shift VARCHAR(20), status VARCHAR(20) DEFAULT 'active',
  start_date DATE, end_date DATE, created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS absences (
  id SERIAL PRIMARY KEY, employee_id INTEGER REFERENCES employees(id),
  type VARCHAR(40) NOT NULL, start_date DATE NOT NULL, end_date DATE,
  reason TEXT, status VARCHAR(20) DEFAULT 'pending',
  created_by INTEGER REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS accidents (
  id SERIAL PRIMARY KEY, employee_id INTEGER REFERENCES employees(id),
  date DATE NOT NULL, description TEXT NOT NULL, severity VARCHAR(20),
  location VARCHAR(120), created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY, employee_id INTEGER REFERENCES employees(id),
  new_shift VARCHAR(20) NOT NULL, effective_date DATE NOT NULL, reason TEXT,
  created_by INTEGER REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY, command VARCHAR(60) NOT NULL,
  payload JSONB, user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);`
;(async () => {
  try { await pool.query(schema); console.log('Migracion completada') }
  catch (e) { console.error('Error:', e.message) }
  finally { await pool.end() }
})()

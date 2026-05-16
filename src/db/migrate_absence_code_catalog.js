require('dotenv').config()
const { pool } = require('./client')

const schema = `
CREATE TABLE IF NOT EXISTS absence_code_catalog (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(60) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO absence_code_catalog (code, description) VALUES
  ('incapacidad', 'Incapacidad médica cubierta por EPS'),
  ('ausencia',    'Inasistencia sin justificación válida'),
  ('permiso',     'Permiso autorizado por la empresa'),
  ('vacaciones',  'Período vacacional remunerado')
ON CONFLICT (code) DO NOTHING;
`

;(async () => {
  try {
    await pool.query(schema)
    console.log('Migración absence_code_catalog completada')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
})()

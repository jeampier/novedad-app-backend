require('dotenv').config()
const { pool } = require('./client')

const schema = `
CREATE TABLE IF NOT EXISTS absence_types (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(40) UNIQUE NOT NULL,
  name          VARCHAR(120) NOT NULL,
  description   TEXT,
  deduction_pct DECIMAL(5,4) NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

INSERT INTO absence_types (code, name, description, deduction_pct) VALUES
  ('ausencia',    'Ausencia',               'Inasistencia sin justificación válida. Se descuenta el valor del día.', 1.0),
  ('permiso',     'Permiso',                'Permiso aprobado por la empresa. Sin descuento por defecto.', 0.0),
  ('incapacidad', 'Incapacidad (EPS)',       'Cubierta por EPS desde el día 3. Sin descuento al empleado.', 0.0),
  ('vacaciones',  'Vacaciones',             'Período vacacional remunerado. Se gestiona por separado.', 0.0)
ON CONFLICT (code) DO NOTHING;
`
;(async () => {
  try { await pool.query(schema); console.log('Migración absence_types completada') }
  catch (e) { console.error('Error:', e.message) }
  finally { await pool.end() }
})()

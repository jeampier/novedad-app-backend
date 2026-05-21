require('dotenv').config()
const { pool } = require('./client')

const schema = `
CREATE TABLE IF NOT EXISTS employee_requests (
  id            SERIAL PRIMARY KEY,
  type          VARCHAR(30) NOT NULL CHECK (type IN ('vacaciones','permiso','incapacidad')),
  employee_id   INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  days          INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  reason        TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                  CHECK (status IN ('pendiente','aprobada','rechazada','liquidada')),
  requested_by  INTEGER REFERENCES users(id),
  reviewed_by   INTEGER REFERENCES users(id),
  reviewed_at   TIMESTAMP,
  review_notes  TEXT,
  absence_id    INTEGER REFERENCES absences(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_employee ON employee_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_status   ON employee_requests(status);
`

pool.query(schema)
  .then(() => { console.log('migrate_requests: OK'); process.exit(0) })
  .catch(e => { console.error(e.message); process.exit(1) })

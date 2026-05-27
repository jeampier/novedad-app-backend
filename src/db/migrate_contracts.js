  require('dotenv').config()
  const { pool } = require('./client')

  const schema = `
  CREATE TABLE IF NOT EXISTS contracts (
    id            SERIAL PRIMARY KEY,
    employee_id   INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE,
    position      VARCHAR(100),
    base_salary   NUMERIC(12,2) NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'activo'
                    CHECK (status IN ('activo','terminado','suspendido')),
    notes         TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_contracts_employee ON contracts(employee_id);
  `

  pool.query(schema)
    .then(() => { console.log('migrate_contracts: OK'); process.exit(0) })
    .catch(e => { console.error(e.message); process.exit(1) })
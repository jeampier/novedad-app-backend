require('dotenv').config()
const { pool } = require('./client')

const schema = `
CREATE TABLE IF NOT EXISTS payroll_concepts (
  id          SERIAL PRIMARY KEY,
  company_id  INTEGER,
  code        VARCHAR(30) UNIQUE NOT NULL,
  name        VARCHAR(120) NOT NULL,
  type        VARCHAR(30) NOT NULL CHECK (type IN ('earning','deduction','base','derived')),
  category    VARCHAR(60) NOT NULL,
  description TEXT,
  active      BOOLEAN DEFAULT true,
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_rules (
  id          SERIAL PRIMARY KEY,
  concept_id  INTEGER REFERENCES payroll_concepts(id) ON DELETE CASCADE,
  name        VARCHAR(120),
  formula     TEXT NOT NULL,
  conditions  JSONB DEFAULT '{}',
  priority    INTEGER DEFAULT 0,
  active      BOOLEAN DEFAULT true,
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rule_snapshots (
  id          SERIAL PRIMARY KEY,
  rule_id     INTEGER REFERENCES payroll_rules(id) ON DELETE CASCADE,
  rule_data   JSONB NOT NULL,
  snapshot_at TIMESTAMP DEFAULT NOW(),
  created_by  INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS concept_execution_logs (
  id               SERIAL PRIMARY KEY,
  period_id        INTEGER REFERENCES payroll_periods(id),
  employee_id      INTEGER REFERENCES employees(id),
  concept_id       INTEGER REFERENCES payroll_concepts(id),
  rule_id          INTEGER REFERENCES payroll_rules(id),
  input_variables  JSONB,
  result           NUMERIC(14,2),
  error            TEXT,
  executed_at      TIMESTAMP DEFAULT NOW(),
  executed_by      INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_rules_concept  ON payroll_rules(concept_id);
CREATE INDEX IF NOT EXISTS idx_rule_snapshots_rule    ON rule_snapshots(rule_id);
CREATE INDEX IF NOT EXISTS idx_exec_logs_period       ON concept_execution_logs(period_id);
CREATE INDEX IF NOT EXISTS idx_exec_logs_employee     ON concept_execution_logs(employee_id);
`

;(async () => {
  try {
    await pool.query(schema)
    console.log('Migración conceptos completada')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
})()

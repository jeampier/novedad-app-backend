require('dotenv').config()
const { pool } = require('./client')

const schema = `
CREATE TABLE IF NOT EXISTS payroll_rate_rules (
  id                        SERIAL PRIMARY KEY,
  group_name                VARCHAR(80),
  position                  VARCHAR(80),
  extra_multiplier          NUMERIC(5,3),
  extra_diur_dom_multiplier NUMERIC(5,3),
  extra_noct_multiplier     NUMERIC(5,3),
  extra_noct_dom_multiplier NUMERIC(5,3),
  night_multiplier          NUMERIC(5,3),
  surcharge_multiplier      NUMERIC(5,3),
  sunday_holiday_multiplier NUMERIC(5,3),
  rec_dom_noct_multiplier   NUMERIC(5,3),
  notes                     TEXT,
  created_by                INTEGER REFERENCES users(id),
  created_at                TIMESTAMP DEFAULT NOW(),
  updated_at                TIMESTAMP DEFAULT NOW()
);
`

pool.query(schema)
  .then(() => { console.log('migrate_rate_rules: OK'); process.exit(0) })
  .catch(e => { console.error(e.message); process.exit(1) })

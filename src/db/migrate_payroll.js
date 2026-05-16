require('dotenv').config()
const { pool } = require('./client')

const schema = `
ALTER TABLE employees ADD COLUMN IF NOT EXISTS group_name VARCHAR(80);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS base_salary NUMERIC(12,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS shift_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  start_time TIME,
  end_time TIME,
  total_hours NUMERIC(4,2) DEFAULT 0,
  ordinary_hours NUMERIC(4,2) DEFAULT 0,
  extra_hours NUMERIC(4,2) DEFAULT 0,
  night_hours NUMERIC(4,2) DEFAULT 0,
  surcharge_hours NUMERIC(4,2) DEFAULT 0,
  sunday_holiday_hours NUMERIC(4,2) DEFAULT 0,
  extra_multiplier NUMERIC(4,2) DEFAULT 1.25,
  night_multiplier NUMERIC(4,2) DEFAULT 1.35,
  surcharge_multiplier NUMERIC(4,2) DEFAULT 1.35,
  sunday_holiday_multiplier NUMERIC(4,2) DEFAULT 1.75,
  color VARCHAR(10) DEFAULT '#3B82F6',
  active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_schedule (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  shift_type_id INTEGER REFERENCES shift_types(id),
  is_rest_day BOOLEAN DEFAULT false,
  absence_type VARCHAR(40),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, schedule_date)
);

CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  holiday_date DATE UNIQUE NOT NULL,
  name VARCHAR(120),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_periods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_records (
  id SERIAL PRIMARY KEY,
  period_id INTEGER REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id),
  days_worked INTEGER DEFAULT 0,
  rest_days INTEGER DEFAULT 0,
  absence_days INTEGER DEFAULT 0,
  disability_days INTEGER DEFAULT 0,
  vacation_days INTEGER DEFAULT 0,
  ordinary_hours NUMERIC(8,2) DEFAULT 0,
  extra_hours NUMERIC(8,2) DEFAULT 0,
  night_hours NUMERIC(8,2) DEFAULT 0,
  surcharge_hours NUMERIC(8,2) DEFAULT 0,
  sunday_holiday_hours NUMERIC(8,2) DEFAULT 0,
  gross_pay NUMERIC(14,2) DEFAULT 0,
  deductions NUMERIC(14,2) DEFAULT 0,
  net_pay NUMERIC(14,2) DEFAULT 0,
  calculation_details JSONB,
  calculated_at TIMESTAMP,
  calculated_by INTEGER REFERENCES users(id),
  UNIQUE(period_id, employee_id)
);

CREATE TABLE IF NOT EXISTS payroll_settings (
  key VARCHAR(60) PRIMARY KEY,
  value NUMERIC(18,2) NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_schedule_date ON work_schedule(schedule_date);
CREATE INDEX IF NOT EXISTS idx_work_schedule_employee ON work_schedule(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(period_id);
`

async function seed() {
  await pool.query(`
    INSERT INTO payroll_settings (key, value, description)
    VALUES ('smmlv', 1300000, 'Salario Mínimo Mensual Legal Vigente')
    ON CONFLICT DO NOTHING
  `)

  await pool.query(`
    INSERT INTO permissions (module, action)
    VALUES
      ('payroll', 'read'),
      ('payroll', 'write'),
      ('payroll', 'edit'),
      ('payroll', 'delete')
    ON CONFLICT DO NOTHING
  `)

  await pool.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p
    WHERE r.name = 'admin' AND p.module = 'payroll'
    ON CONFLICT DO NOTHING
  `)

  await pool.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p
    WHERE r.name = 'supervisor' AND p.module = 'payroll' AND p.action IN ('read','write','edit')
    ON CONFLICT DO NOTHING
  `)

  await pool.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p
    WHERE r.name = 'operator' AND p.module = 'payroll' AND p.action = 'read'
    ON CONFLICT DO NOTHING
  `)
}

;(async () => {
  try {
    await pool.query(schema)
    console.log('Migración payroll completada')
    await seed()
    console.log('Permisos de nómina creados')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
})()

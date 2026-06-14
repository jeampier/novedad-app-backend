require('dotenv').config()
const { pool } = require('./client')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS scheduled_tasks (
        id              SERIAL PRIMARY KEY,
        name            VARCHAR(120) NOT NULL,
        task_type       VARCHAR(30) NOT NULL CHECK (task_type IN ('calculate_period','close_period','calculate_and_close')),
        period_id       INTEGER REFERENCES payroll_periods(id),
        hour            SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
        minute          SMALLINT NOT NULL CHECK (minute BETWEEN 0 AND 59),
        days_of_week    SMALLINT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
        enabled         BOOLEAN DEFAULT true,
        last_run_at     TIMESTAMP,
        last_run_status VARCHAR(20),
        created_by      INTEGER REFERENCES users(id),
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS scheduled_task_logs (
        id          SERIAL PRIMARY KEY,
        task_id     INTEGER REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
        run_at      TIMESTAMP DEFAULT NOW(),
        status      VARCHAR(20) NOT NULL CHECK (status IN ('success','error')),
        message     TEXT,
        details     JSONB,
        created_at  TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_enabled ON scheduled_tasks(enabled)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_scheduled_task_logs_task ON scheduled_task_logs(task_id)`)

    console.log('migrate_scheduled_tasks: OK')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(e => { console.error(e.message); process.exit(1) })

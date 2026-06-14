require('dotenv').config()
const { pool } = require('./client')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id            SERIAL PRIMARY KEY,
        recipient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type          VARCHAR(40) NOT NULL,
        title         VARCHAR(160) NOT NULL,
        message       TEXT,
        link          VARCHAR(200),
        read          BOOLEAN DEFAULT false,
        created_at    TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id, read)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC)`)

    console.log('migrate_notifications: OK')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(e => { console.error(e.message); process.exit(1) })

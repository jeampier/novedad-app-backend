require('dotenv').config()
const { pool } = require('./client')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      ALTER TABLE absence_types
        ADD COLUMN IF NOT EXISTS behavior VARCHAR(20) NOT NULL DEFAULT 'normal'
    `)

    // Seed behaviors para los códigos conocidos
    const behaviors = [
      { code: 'incapacidad',         behavior: 'disability'  },
      { code: 'vacaciones',          behavior: 'vacation'    },
      { code: 'licencia_remunerada', behavior: 'paid_leave'  },
      { code: 'ausencia',            behavior: 'normal'      },
      { code: 'permiso',             behavior: 'normal'      },
    ]

    for (const { code, behavior } of behaviors) {
      await client.query(
        `UPDATE absence_types SET behavior = $1 WHERE code = $2`,
        [behavior, code]
      )
    }

    console.log('migrate_absence_behavior: OK')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(e => { console.error(e.message); process.exit(1) })

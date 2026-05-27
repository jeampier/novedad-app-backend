require('dotenv').config()
const { pool } = require('./client')

// Turnos estándar MAQUINOR — basados en corrección migrate_shift_ordinary_hours.js
const SHIFTS = [
  {
    name: 'Turno Mañana',
    code: 'M',
    start_time: '06:00',
    end_time: '14:00',
    total_hours: 8,
    ordinary_hours: 8,
    extra_hours: 0,
    night_hours: 0,
    surcharge_hours: 0,
    sunday_holiday_hours: 0,
    color: '#3B82F6',
  },
  {
    name: 'Turno Tarde',
    code: 'T',
    start_time: '14:00',
    end_time: '22:00',
    total_hours: 8,
    ordinary_hours: 8,
    extra_hours: 0,
    night_hours: 1,   // 21:00-22:00 hora nocturna (art. 171 CST desde 21h)
    surcharge_hours: 0,
    sunday_holiday_hours: 0,
    color: '#F59E0B',
  },
  {
    name: 'Turno Noche',
    code: 'N',
    start_time: '22:00',
    end_time: '06:00',
    total_hours: 8,
    ordinary_hours: 8,
    extra_hours: 0,
    night_hours: 8,
    surcharge_hours: 0,
    sunday_holiday_hours: 0,
    color: '#6366F1',
  },
  {
    name: 'Turno 11 Horas',
    code: '11H',
    start_time: '07:00',
    end_time: '18:00',
    total_hours: 11,
    ordinary_hours: 9,
    extra_hours: 2,
    night_hours: 0,
    surcharge_hours: 0,
    sunday_holiday_hours: 0,
    color: '#10B981',
  },
]

async function seed() {
  for (const s of SHIFTS) {
    const { rows } = await pool.query(`SELECT id FROM shift_types WHERE code = $1`, [s.code])
    if (rows.length > 0) {
      console.log(`  ⚠  ${s.name} (${s.code}) ya existe — omitido`)
      continue
    }
    await pool.query(
      `INSERT INTO shift_types
         (name, code, start_time, end_time, total_hours, ordinary_hours, extra_hours,
          night_hours, surcharge_hours, sunday_holiday_hours, color, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)`,
      [s.name, s.code, s.start_time, s.end_time, s.total_hours, s.ordinary_hours,
       s.extra_hours, s.night_hours, s.surcharge_hours, s.sunday_holiday_hours, s.color]
    )
    console.log(`  ✓ ${s.name} (${s.code})`)
  }
  console.log('\nseed_shift_types completado')
}

seed()
  .then(() => process.exit(0))
  .catch(e => { console.error(e.message); process.exit(1) })

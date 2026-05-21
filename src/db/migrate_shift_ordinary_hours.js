require('dotenv').config()
const { pool } = require('./client')

// Reclasifica horas de recargo como ordinarias para que:
// 1. HORAS_ORD refleje todo el tiempo trabajado (base para SS)
// 2. Los conceptos de recargo paguen solo la prima (factor - 1.0)
// El total de pago bruto no cambia — solo el desglose y la base de SS.
const sql = `
UPDATE shift_types
SET ordinary_hours = ordinary_hours
                   + night_hours
                   + surcharge_hours
                   + sunday_holiday_hours
                   + rec_dom_noct_hours
WHERE (night_hours + surcharge_hours + sunday_holiday_hours + rec_dom_noct_hours) > 0;
`

pool.query(sql)
  .then(r => {
    console.log(`migrate_shift_ordinary_hours: ${r.rowCount} turnos actualizados`)
    process.exit(0)
  })
  .catch(e => { console.error(e.message); process.exit(1) })

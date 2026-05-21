require('dotenv').config()
const { pool } = require('./client')

// Tasas legales base Colombia (CST) — ajustar según PARAMETROS del Excel MAQUINOR
const BASE_RATES = {
  extra_multiplier:          1.25, // Extra diurna          art. 168 CST
  extra_diur_dom_multiplier: 1.75, // Extra diurna dom.     art. 168 + 179 CST
  extra_noct_multiplier:     1.75, // Extra nocturna        art. 168 + 171 CST
  extra_noct_dom_multiplier: 2.10, // Extra nocturna dom.   art. 168 + 171 + 179 CST
  night_multiplier:          1.35, // Rec. nocturno         art. 171 CST
  surcharge_multiplier:      1.35, // Rec. general          art. 171 CST
  sunday_holiday_multiplier: 1.75, // Rec. dom. diurno      art. 179 CST
  rec_dom_noct_multiplier:   2.10, // Rec. dom. nocturno    art. 179 + 171 CST
}

// Grupos reales de MAQUINOR — completar con tasas del Excel PARAMETROS
// Todos parten de las tasas legales base; editar en UI (/payroll/rate-rules)
const RULES = [
  {
    group_name: '1',
    position:   null,
    notes:      'Grupo 1 — tasas base legales (ajustar según PARAMETROS Excel)',
    ...BASE_RATES,
  },
  {
    group_name: '2',
    position:   null,
    notes:      'Grupo 2 — tasas base legales (ajustar según PARAMETROS Excel)',
    ...BASE_RATES,
  },
  {
    group_name: '3',
    position:   null,
    notes:      'Grupo 3 — tasas base legales (ajustar según PARAMETROS Excel)',
    ...BASE_RATES,
  },
  {
    group_name: '4',
    position:   null,
    notes:      'Grupo 4 — tasas base legales (ajustar según PARAMETROS Excel)',
    ...BASE_RATES,
  },
]

async function seed() {
  // Clear existing rules to avoid duplicates on re-run
  await pool.query(`DELETE FROM payroll_rate_rules WHERE group_name IN ('1','2','3','4') AND position IS NULL`)

  for (const r of RULES) {
    await pool.query(
      `INSERT INTO payroll_rate_rules
         (group_name, position,
          extra_multiplier, extra_diur_dom_multiplier,
          extra_noct_multiplier, extra_noct_dom_multiplier,
          night_multiplier, surcharge_multiplier,
          sunday_holiday_multiplier, rec_dom_noct_multiplier,
          notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        r.group_name, r.position,
        r.extra_multiplier, r.extra_diur_dom_multiplier,
        r.extra_noct_multiplier, r.extra_noct_dom_multiplier,
        r.night_multiplier, r.surcharge_multiplier,
        r.sunday_holiday_multiplier, r.rec_dom_noct_multiplier,
        r.notes,
      ]
    )
    console.log(`  ✓ Grupo ${r.group_name}`)
  }

  console.log(`\nseed_rate_rules: ${RULES.length} reglas creadas`)
}

seed()
  .then(() => process.exit(0))
  .catch(e => { console.error(e.message); process.exit(1) })

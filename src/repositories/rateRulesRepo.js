const { query } = require('../db/client')

const rateRulesRepo = {
  async findAll() {
    const { rows } = await query(
      `SELECT * FROM payroll_rate_rules ORDER BY group_name NULLS LAST, position NULLS LAST, id`
    )
    return rows
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM payroll_rate_rules WHERE id=$1`, [id])
    return rows[0] || null
  },

  // Returns rules ordered by specificity (most specific first):
  // both group+position > group only > position only > catch-all
  async findForEmployee(groupName, position) {
    const { rows } = await query(
      `SELECT *,
         CASE
           WHEN group_name IS NOT NULL AND position IS NOT NULL THEN 1
           WHEN group_name IS NOT NULL AND position IS NULL     THEN 2
           WHEN group_name IS NULL     AND position IS NOT NULL THEN 3
           ELSE 4
         END AS priority
       FROM payroll_rate_rules
       WHERE (group_name IS NULL OR group_name = $1)
         AND (position   IS NULL OR position   = $2)
       ORDER BY priority
       LIMIT 1`,
      [groupName || '', position || '']
    )
    return rows[0] || null
  },

  async create(d) {
    const { rows } = await query(
      `INSERT INTO payroll_rate_rules
         (group_name, position,
          extra_multiplier, extra_diur_dom_multiplier,
          extra_noct_multiplier, extra_noct_dom_multiplier,
          night_multiplier, surcharge_multiplier,
          sunday_holiday_multiplier, rec_dom_noct_multiplier,
          notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        d.group_name   || null, d.position   || null,
        d.extra_multiplier          || null,
        d.extra_diur_dom_multiplier || null,
        d.extra_noct_multiplier     || null,
        d.extra_noct_dom_multiplier || null,
        d.night_multiplier          || null,
        d.surcharge_multiplier      || null,
        d.sunday_holiday_multiplier || null,
        d.rec_dom_noct_multiplier   || null,
        d.notes      || null,
        d.created_by || null,
      ]
    )
    return rows[0]
  },

  async update(id, d) {
    const { rows } = await query(
      `UPDATE payroll_rate_rules SET
         group_name                = $2,
         position                  = $3,
         extra_multiplier          = $4,
         extra_diur_dom_multiplier = $5,
         extra_noct_multiplier     = $6,
         extra_noct_dom_multiplier = $7,
         night_multiplier          = $8,
         surcharge_multiplier      = $9,
         sunday_holiday_multiplier = $10,
         rec_dom_noct_multiplier   = $11,
         notes                     = $12,
         updated_at                = NOW()
       WHERE id=$1
       RETURNING *`,
      [
        id,
        d.group_name   || null, d.position   || null,
        d.extra_multiplier          || null,
        d.extra_diur_dom_multiplier || null,
        d.extra_noct_multiplier     || null,
        d.extra_noct_dom_multiplier || null,
        d.night_multiplier          || null,
        d.surcharge_multiplier      || null,
        d.sunday_holiday_multiplier || null,
        d.rec_dom_noct_multiplier   || null,
        d.notes || null,
      ]
    )
    return rows[0] || null
  },

  async delete(id) {
    await query(`DELETE FROM payroll_rate_rules WHERE id=$1`, [id])
  },
}

module.exports = rateRulesRepo

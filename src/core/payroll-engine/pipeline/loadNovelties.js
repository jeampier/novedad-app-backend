const { query } = require('../../../db/client')

async function loadNovelties(ctx) {
  const [conceptsRes, rulesRes, absenceTypesRes] = await Promise.all([
    query(`SELECT * FROM payroll_concepts WHERE active = true ORDER BY type, category, code`),
    query(`SELECT * FROM payroll_rules   WHERE active = true ORDER BY priority ASC`),
    query(`SELECT * FROM absence_types   WHERE active = true`),
  ])

  const rulesByConceptId = {}
  for (const rule of rulesRes.rows) {
    if (!rulesByConceptId[rule.concept_id]) rulesByConceptId[rule.concept_id] = []
    rulesByConceptId[rule.concept_id].push(rule)
  }

  ctx.dynamicConcepts = conceptsRes.rows.map(c => ({
    ...c,
    rules: rulesByConceptId[c.id] || [],
  }))

  // Map code → absence type config for O(1) lookup in applyConcepts
  ctx.absenceTypesMap = Object.fromEntries(
    absenceTypesRes.rows.map(t => [t.code, t])
  )

  // Map behavior → code for motor de cálculo (evita hardcodear códigos en el motor)
  // Ejemplo: { disability: 'incapacidad', vacation: 'vacaciones', paid_leave: 'licencia_remunerada' }
  ctx.absenceBehaviorMap = Object.fromEntries(
    absenceTypesRes.rows
      .filter(t => t.behavior && t.behavior !== 'normal')
      .map(t => [t.behavior, t.code])
  )

  // Inyectar en settings para que los conceptos builtin puedan accederlo
  ctx.settings._absenceBehaviorMap = ctx.absenceBehaviorMap

  ctx.log(
    'loadNovelties',
    `${ctx.dynamicConcepts.length} conceptos dinámicos · ${rulesRes.rows.length} reglas · ${absenceTypesRes.rows.length} tipos de ausencia`,
    { codes: ctx.dynamicConcepts.map(c => c.code) }
  )

  return ctx
}

module.exports = loadNovelties

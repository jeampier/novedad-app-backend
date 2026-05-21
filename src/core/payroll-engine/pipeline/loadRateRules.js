const repo = require('../../../repositories/rateRulesRepo')

async function loadRateRules(ctx) {
  const allRules = await repo.findAll()
  ctx.rateRules  = allRules
  ctx.log('loadRateRules', `${allRules.length} reglas de tasas cargadas`)

  // Resolve the most specific matching rule for each employee and attach it
  for (const emp of ctx.employees) {
    const rule = resolveRule(allRules, emp.group_name, emp.position)
    emp.resolvedRates = rule || null
  }

  const withRule = ctx.employees.filter(e => e.resolvedRates).length
  if (withRule > 0) {
    ctx.log('loadRateRules', `${withRule} empleados con tasa personalizada`)
  }

  return ctx
}

function resolveRule(rules, groupName, position) {
  // Priority: (group+position) > (group only) > (position only) > null
  const candidates = rules.filter(r =>
    (r.group_name === null || r.group_name === groupName) &&
    (r.position   === null || r.position   === position)
  )

  candidates.sort((a, b) => {
    const score = r => (r.group_name !== null ? 2 : 0) + (r.position !== null ? 1 : 0)
    return score(b) - score(a)
  })

  return candidates[0] || null
}

module.exports = loadRateRules

// Deduction rates come from payroll_settings (loaded by loadSettings pipeline step)
// Fallbacks match Colombia legal minimums in case settings are missing
const FALLBACK = { health: 0.04, pension: 0.04, solidarity: 0.01, solidarityThreshold: 4, }

async function calculateTotals(ctx) {
  const s = ctx.settings || {}
  const healthRate      = Number(s.tasa_salud)         || FALLBACK.health
  const pensionRate     = Number(s.tasa_pension)        || FALLBACK.pension
  const solidarityRate  = Number(s.tasa_solidaridad)    || FALLBACK.solidarity
  const solidarityLimit = Number(s.limite_solidaridad)  || FALLBACK.solidarityThreshold

  let totalGross = 0, totalNet = 0

  for (const emp of ctx.employees) {
    const result   = ctx.employeeResults[emp.id]
    const concepts = result.concepts

    // Sum all earnings (builtin + dynamic)
    let grossPay = 0
    for (const c of Object.values(concepts)) {
      if (c.type === 'earning') grossPay += c.value
    }

    // Deduction base = ordinary salary only (IBC pro-rated by days worked)
    // Extras, recargos and aux transporte excluded — same as Excel basicoQ
    const basicoPay = concepts['HORAS_ORD']?.value ?? 0

    // Security social — always calculated from ordinary salary
    const health    = Math.round(basicoPay * healthRate)
    const pension   = Math.round(basicoPay * pensionRate)
    let solidarity  = 0
    const smmlv     = Number(emp.smmlv) || 0
    if (smmlv > 0 && Number(emp.base_salary) > solidarityLimit * smmlv) {
      solidarity = Math.round(basicoPay * solidarityRate)
    }

    // Concept deductions (absence deductions, custom deduction concepts) — additive
    let conceptDeductionTotal  = 0
    const conceptDeductionDetail = []
    for (const [code, c] of Object.entries(concepts)) {
      if (c.type === 'deduction') {
        conceptDeductionTotal += c.value
        conceptDeductionDetail.push({ code, label: c.label, value: c.value, breakdown: c.breakdown || [] })
      }
    }

    const deductions = health + pension + solidarity + conceptDeductionTotal
    const netPay     = grossPay - deductions

    result.grossPay   = Math.round(grossPay)
    result.deductions = deductions
    result.netPay     = Math.round(netPay)

    result.deductionDetail = {
      base:                 basicoPay,
      health,               healthRate,
      pension,              pensionRate,
      solidarity,           solidarityRate,
      conceptDeductionTotal,
      conceptDeductionDetail,
    }

    totalGross += result.grossPay
    totalNet   += result.netPay
  }

  ctx.log(
    'calculateTotals',
    `Nómina total: bruto $${totalGross.toLocaleString('es-CO')} · neto $${totalNet.toLocaleString('es-CO')}`,
    { totalGross, totalNet, employees: ctx.employees.length, rates: { healthRate, pensionRate, solidarityRate } }
  )

  return ctx
}

module.exports = calculateTotals

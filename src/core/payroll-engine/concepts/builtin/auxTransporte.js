// Auxilio de transporte — Colombia
// Aplica si IBC (base_salary) ≤ 2 × SMMLV del empleado
// Valor mensual viene de payroll_settings.aux_trans
// Se prorratea por días liquidados (días trabajados + incapacidad + licencia remunerada)

module.exports = {
  code:     'AUX_TRANS',
  label:    'Auxilio de transporte',
  type:     'earning',
  category: 'Beneficios',
  builtin:  true,

  calculate(employee, days, settings = {}) {
    const baseSalary  = Number(employee.base_salary) || 0
    const smmlv       = Number(employee.smmlv)       || 0
    const auxMensual  = Number(settings.aux_trans)   || 0

    const limite = Number(settings.limite_aux_trans) || 2
    if (!smmlv || !auxMensual || baseSalary > limite * smmlv) {
      return { value: 0, hours: null, breakdown: { applies: false, reason: baseSalary > limite * smmlv ? `IBC supera ${limite}×SMMLV` : 'Sin configuración' } }
    }

    // Días liquidados: trabajados + incapacidad + licencia remunerada
    const behaviorMap    = settings._absenceBehaviorMap || {}
    const disabilityCode = behaviorMap.disability
    const paidLeaveCode  = behaviorMap.paid_leave
    let diasLiq = 0
    for (const day of days) {
      if (!day.is_rest_day && !day.absence_type && day.shift_type_id) diasLiq++
      else if (disabilityCode && day.absence_type === disabilityCode) diasLiq++
      else if (paidLeaveCode  && day.absence_type === paidLeaveCode)  diasLiq++
    }

    if (diasLiq === 0) return { value: 0, hours: null, breakdown: { applies: true, diasLiq: 0 } }

    // Pro-rateo sobre 30 días comerciales
    const value = Math.round(auxMensual * (diasLiq / 30))

    return {
      value,
      hours: null,
      breakdown: { applies: true, auxMensual, diasLiq, smmlv, baseSalary },
    }
  },
}

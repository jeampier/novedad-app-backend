module.exports = {
  code:     'HORAS_EXT_DIUR_DOM',
  label:    'Horas extra diurnas dominicales',
  type:     'earning',
  category: 'Horas',
  builtin:  true,

  calculate(employee, days) {
    const hourlyRate = Number(employee.base_salary) / 240
    let hours = 0, value = 0
    const breakdown = []

    for (const day of days) {
      if (day.is_rest_day || day.absence_type || !day.shift_type_id) continue
      const h   = Number(day.extra_diur_dom_hours || 0)
      const mul = Number(employee.resolvedRates?.extra_diur_dom_multiplier ?? day.extra_diur_dom_multiplier ?? 1.75)
      const pay = h * hourlyRate * mul
      if (h === 0) continue
      hours += h; value += pay
      breakdown.push({ date: day.schedule_date, hours: h, multiplier: mul, pay: Math.round(pay) })
    }

    return { hours, value: Math.round(value), breakdown }
  },
}

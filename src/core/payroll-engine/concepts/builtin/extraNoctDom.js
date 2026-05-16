module.exports = {
  code:     'HORAS_EXT_NOCT_DOM',
  label:    'Horas extra nocturnas dominicales',
  type:     'earning',
  category: 'Horas',
  builtin:  true,

  calculate(employee, days) {
    const hourlyRate = Number(employee.base_salary) / 240
    let hours = 0, value = 0
    const breakdown = []

    for (const day of days) {
      if (day.is_rest_day || day.absence_type || !day.shift_type_id) continue
      const h   = Number(day.extra_noct_dom_hours || 0)
      const mul = Number(day.extra_noct_dom_multiplier || 2.10)
      const pay = h * hourlyRate * mul
      if (h === 0) continue
      hours += h; value += pay
      breakdown.push({ date: day.schedule_date, hours: h, multiplier: mul, pay: Math.round(pay) })
    }

    return { hours, value: Math.round(value), breakdown }
  },
}

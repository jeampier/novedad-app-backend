module.exports = {
  code:     'HORAS_ORD',
  label:    'Horas ordinarias',
  type:     'earning',
  category: 'Horas',
  builtin:  true,

  calculate(employee, days) {
    const hourlyRate = Number(employee.base_salary) / 240
    let hours = 0, value = 0
    const breakdown = []

    for (const day of days) {
      if (day.is_rest_day || day.absence_type || !day.shift_type_id) continue
      const h   = Number(day.ordinary_hours || 0)
      const pay = h * hourlyRate
      if (h === 0) continue
      hours += h
      value += pay
      breakdown.push({ date: day.schedule_date, hours: h, pay: Math.round(pay) })
    }

    return { hours, value: Math.round(value), breakdown }
  },
}

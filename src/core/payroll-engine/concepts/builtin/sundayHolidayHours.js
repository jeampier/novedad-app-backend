module.exports = {
  code:     'HORAS_DOM',
  label:    'Horas domingo/festivo',
  type:     'earning',
  category: 'Horas',
  builtin:  true,

  calculate(employee, days) {
    const hourlyRate = Number(employee.base_salary) / 240
    let hours = 0, value = 0
    const breakdown = []

    for (const day of days) {
      if (day.is_rest_day || day.absence_type || !day.shift_type_id) continue
      const h   = Number(day.sunday_holiday_hours || 0)
      const mul = Number(employee.resolvedRates?.sunday_holiday_multiplier ?? day.sunday_holiday_multiplier ?? 1.75)
      const pay = h * hourlyRate * (mul - 1.0)
      if (h === 0) continue
      hours += h
      value += pay
      breakdown.push({ date: day.schedule_date, hours: h, multiplier: mul, pay: Math.round(pay) })
    }

    return { hours, value: Math.round(value), breakdown }
  },
}

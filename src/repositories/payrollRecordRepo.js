const { query } = require('../db/client')

const payrollRecordRepo = {
  async findByPeriod(periodId) {
    const { rows } = await query(
      `SELECT pr.*,
              e.name AS employee_name, e.document, e.position,
              e.group_name, e.area, e.base_salary
       FROM payroll_records pr
       JOIN employees e ON e.id = pr.employee_id
       WHERE pr.period_id = $1
       ORDER BY e.name`,
      [periodId]
    )
    return rows
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT pr.*,
              e.name AS employee_name, e.document, e.position,
              e.group_name, e.area, e.base_salary
       FROM payroll_records pr
       JOIN employees e ON e.id = pr.employee_id
       WHERE pr.id = $1`,
      [id]
    )
    return rows[0]
  },

  async upsert(d) {
    const { rows } = await query(
      `INSERT INTO payroll_records
         (period_id, employee_id, days_worked, rest_days, absence_days,
          disability_days, vacation_days, ordinary_hours, extra_hours,
          night_hours, surcharge_hours, sunday_holiday_hours,
          gross_pay, deductions, net_pay, calculation_details,
          calculated_at, calculated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),$17)
       ON CONFLICT (period_id, employee_id)
       DO UPDATE SET
         days_worked = EXCLUDED.days_worked,
         rest_days = EXCLUDED.rest_days,
         absence_days = EXCLUDED.absence_days,
         disability_days = EXCLUDED.disability_days,
         vacation_days = EXCLUDED.vacation_days,
         ordinary_hours = EXCLUDED.ordinary_hours,
         extra_hours = EXCLUDED.extra_hours,
         night_hours = EXCLUDED.night_hours,
         surcharge_hours = EXCLUDED.surcharge_hours,
         sunday_holiday_hours = EXCLUDED.sunday_holiday_hours,
         gross_pay = EXCLUDED.gross_pay,
         deductions = EXCLUDED.deductions,
         net_pay = EXCLUDED.net_pay,
         calculation_details = EXCLUDED.calculation_details,
         calculated_at = NOW(),
         calculated_by = EXCLUDED.calculated_by
       RETURNING *`,
      [
        d.periodId, d.employeeId, d.daysWorked, d.restDays, d.absenceDays,
        d.disabilityDays, d.vacationDays, d.ordinaryHours, d.extraHours,
        d.nightHours, d.surchargeHours, d.sundayHolidayHours,
        d.grossPay, d.deductions, d.netPay,
        JSON.stringify(d.calculationDetails), d.calculatedBy
      ]
    )
    return rows[0]
  }
}

module.exports = payrollRecordRepo

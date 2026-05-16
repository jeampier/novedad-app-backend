const payrollRecordRepo = require('../../../repositories/payrollRecordRepo')

async function persistPayroll(ctx) {
  if (ctx.options.dryRun) {
    ctx.log('persistPayroll', 'Modo dryRun — sin escritura en DB')
    ctx.savedRecords = Object.values(ctx.employeeResults).map(r => ({
      employee_id: r.employee.id,
      employee_name: r.employee.name,
      gross_pay: r.grossPay,
      deductions: r.deductions,
      net_pay: r.netPay,
      _dryRun: true,
    }))
    return ctx
  }

  const records = []

  for (const emp of ctx.employees) {
    const r = ctx.employeeResults[emp.id]

    const record = await payrollRecordRepo.upsert({
      periodId:           ctx.periodId,
      employeeId:         emp.id,
      daysWorked:         r.attendance.daysWorked,
      restDays:           r.attendance.restDays,
      absenceDays:        r.attendance.absenceDays,
      disabilityDays:     r.attendance.disabilityDays,
      vacationDays:       r.attendance.vacationDays,
      ordinaryHours:      r.hours.ordinary,
      extraHours:         r.hours.extra,
      nightHours:         r.hours.night,
      surchargeHours:     r.hours.surcharge,
      sundayHolidayHours: r.hours.sundayHoliday,
      grossPay:           r.grossPay,
      deductions:         r.deductions,
      netPay:             r.netPay,
      calculationDetails: {
        engine:          'payroll-engine/v2',
        periodId:        ctx.periodId,
        hourlyRate:      Math.round(r.hourlyRate * 100) / 100,
        deductionDetail: r.deductionDetail,
        hours: {
          ordinary:     r.hours.ordinary,
          extra:        r.hours.extra,
          extraDiurDom: r.hours.extraDiurDom,
          extraNoct:    r.hours.extraNoct,
          extraNoctDom: r.hours.extraNoctDom,
          night:        r.hours.night,
          surcharge:    r.hours.surcharge,
          sundayHoliday:r.hours.sundayHoliday,
          recDomNoct:   r.hours.recDomNoct,
        },
        concepts:  r.concepts,
        breakdown: r.concepts['HORAS_ORD']?.breakdown || [],
      },
      calculatedBy: ctx.userId,
    })

    records.push(record)
  }

  ctx.savedRecords = records

  ctx.log(
    'persistPayroll',
    `${records.length} registros guardados en payroll_records`,
    { periodId: ctx.periodId }
  )

  return ctx
}

module.exports = persistPayroll

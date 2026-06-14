const cron = require('node-cron')
const scheduledTaskRepo = require('../repositories/scheduledTaskRepo')
const payrollPeriodRepo = require('../repositories/payrollPeriodRepo')
const notificationRepo  = require('../repositories/notificationRepo')
const { calculateWithLogs } = require('./payrollCalculator')
const { query } = require('../db/client')

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

function nowInBogota() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short'
  }).formatToParts(new Date())
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return {
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10),
    dayOfWeek: WEEKDAY_INDEX[map.weekday],
  }
}

async function resolvePeriodId(task) {
  if (task.period_id) return task.period_id
  const periods = await payrollPeriodRepo.findAll()
  const open = periods.find(p => p.status === 'open')
  return open ? open.id : null
}

async function executeTask(task) {
  const periodId = await resolvePeriodId(task)
  if (!periodId) throw new Error('No hay período abierto disponible para esta tarea')

  const details = { taskId: task.id, taskType: task.task_type, periodId }

  if (task.task_type === 'calculate_period' || task.task_type === 'calculate_and_close') {
    const ctx = await calculateWithLogs(periodId, null)
    details.recordsCalculated = ctx.savedRecords.length
  }

  if (task.task_type === 'close_period' || task.task_type === 'calculate_and_close') {
    const closed = await payrollPeriodRepo.close(periodId)
    if (!closed) throw new Error(`Período ${periodId} no encontrado al intentar cerrar`)
  }

  return details
}

async function runDueTasks() {
  const { hour, minute, dayOfWeek } = nowInBogota()
  let due = []
  try {
    due = await scheduledTaskRepo.findDue(hour, minute, dayOfWeek)
  } catch (e) {
    console.error('[taskScheduler] Error consultando tareas debidas:', e.message)
    return
  }

  for (const task of due) {
    try {
      const details = await executeTask(task)
      await scheduledTaskRepo.recordRun(task.id, 'success')
      await scheduledTaskRepo.addLog(task.id, 'success', 'Ejecución exitosa', details)
      await query(
        'INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
        ['ScheduledTask:Run', { ...details, name: task.name, status: 'success' }, null]
      )
      await notificationRepo.createForAdmins({
        type: 'scheduled_task_success',
        title: `Tarea "${task.name}" ejecutada`,
        message: `Período #${details.periodId}${details.recordsCalculated != null ? ` · ${details.recordsCalculated} registros calculados` : ''}`,
        link: '/admin/scheduled-tasks',
      })
    } catch (e) {
      console.error(`[taskScheduler] Error ejecutando tarea ${task.id} (${task.name}):`, e.message)
      try {
        await scheduledTaskRepo.recordRun(task.id, 'error')
        await scheduledTaskRepo.addLog(task.id, 'error', e.message, { taskId: task.id })
        await query(
          'INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
          ['ScheduledTask:Run', { taskId: task.id, name: task.name, status: 'error', error: e.message }, null]
        )
        await notificationRepo.createForAdmins({
          type: 'scheduled_task_error',
          title: `Error en tarea "${task.name}"`,
          message: e.message,
          link: '/admin/scheduled-tasks',
        })
      } catch (logErr) {
        console.error('[taskScheduler] Error registrando fallo:', logErr.message)
      }
    }
  }
}

async function checkReminders() {
  try {
    const { rows: periods } = await query(
      `SELECT id, name, end_date FROM payroll_periods
       WHERE status='open' AND end_date - CURRENT_DATE BETWEEN 0 AND 3`
    )
    if (periods.length && !await notificationRepo.existsToday({ type: 'period_closing_soon', link: '/payroll/periods' })) {
      const list = periods.map(p => `"${p.name}" (${p.end_date})`).join(', ')
      await notificationRepo.createForAdmins({
        type: 'period_closing_soon',
        title: 'Período próximo a cerrar',
        message: `Próximos a cerrar: ${list}`,
        link: '/payroll/periods',
      })
    }
  } catch (e) {
    console.error('[taskScheduler] Error verificando períodos próximos a cerrar:', e.message)
  }

  try {
    const { rows: contracts } = await query(
      `SELECT c.id, c.end_date, e.name AS employee_name
       FROM contracts c
       JOIN employees e ON e.id = c.employee_id
       WHERE c.status='activo' AND c.end_date IS NOT NULL AND c.end_date - CURRENT_DATE BETWEEN 0 AND 3`
    )
    if (contracts.length && !await notificationRepo.existsToday({ type: 'contract_expiring_soon', link: '/contracts' })) {
      const list = contracts.map(c => `${c.employee_name} (${c.end_date})`).join(', ')
      await notificationRepo.createForAdmins({
        type: 'contract_expiring_soon',
        title: 'Contrato próximo a vencer',
        message: `Próximos a vencer: ${list}`,
        link: '/contracts',
      })
    }
  } catch (e) {
    console.error('[taskScheduler] Error verificando contratos próximos a vencer:', e.message)
  }
}

function startScheduler() {
  cron.schedule('* * * * *', () => {
    runDueTasks().catch(e => console.error('[taskScheduler] Error inesperado:', e.message))

    const { hour, minute } = nowInBogota()
    if (hour === 6 && minute === 0) {
      checkReminders().catch(e => console.error('[taskScheduler] Error inesperado en recordatorios:', e.message))
    }
  })
  console.log('[taskScheduler] Scheduler iniciado (cada minuto)')
}

module.exports = { startScheduler, runDueTasks, executeTask, checkReminders }

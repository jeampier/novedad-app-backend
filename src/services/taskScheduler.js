const cron = require('node-cron')
const scheduledTaskRepo = require('../repositories/scheduledTaskRepo')
const payrollPeriodRepo = require('../repositories/payrollPeriodRepo')
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
    } catch (e) {
      console.error(`[taskScheduler] Error ejecutando tarea ${task.id} (${task.name}):`, e.message)
      try {
        await scheduledTaskRepo.recordRun(task.id, 'error')
        await scheduledTaskRepo.addLog(task.id, 'error', e.message, { taskId: task.id })
        await query(
          'INSERT INTO audit_log (command, payload, user_id) VALUES ($1,$2,$3)',
          ['ScheduledTask:Run', { taskId: task.id, name: task.name, status: 'error', error: e.message }, null]
        )
      } catch (logErr) {
        console.error('[taskScheduler] Error registrando fallo:', logErr.message)
      }
    }
  }
}

function startScheduler() {
  cron.schedule('* * * * *', () => {
    runDueTasks().catch(e => console.error('[taskScheduler] Error inesperado:', e.message))
  })
  console.log('[taskScheduler] Scheduler iniciado (cada minuto)')
}

module.exports = { startScheduler, runDueTasks, executeTask }

function createContext({ periodId, userId, options = {} }) {
  const ctx = {
    // Input
    periodId,
    userId,
    options: { dryRun: false, ...options },

    // Data loaded by pipeline steps
    settings:            {},
    period:              null,
    employees:           [],
    schedules:           [],
    schedulesByEmployee: {},
    dynamicConcepts:     [],

    // Results keyed by employee id
    employeeResults: {},

    // Persisted records
    savedRecords: [],

    // Advertencias de validación de reglas de negocio
    warnings: [],

    // Structured execution log
    logs: [],

    // Timing
    startedAt: new Date().toISOString(),
  }

  ctx.log = function (step, message, data) {
    this.logs.push({ step, level: 'info', message, data: data ?? null, ts: new Date().toISOString() })
  }
  ctx.warn = function (step, message, data) {
    this.logs.push({ step, level: 'warn', message, data: data ?? null, ts: new Date().toISOString() })
  }
  ctx.error = function (step, message, data) {
    this.logs.push({ step, level: 'error', message, data: data ?? null, ts: new Date().toISOString() })
  }

  return ctx
}

module.exports = { createContext }

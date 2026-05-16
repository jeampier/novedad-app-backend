const { PayrollEngine } = require('../core/payroll-engine/PayrollEngine')

// Public API — unchanged for all existing callers.
// Internally delegates to the modular PayrollEngine.
async function calculate(periodId, userId) {
  const engine = new PayrollEngine()
  const ctx    = await engine.run({ periodId, userId })
  return ctx.savedRecords
}

// Extended API — exposes full context including logs.
async function calculateWithLogs(periodId, userId, options = {}) {
  const engine = new PayrollEngine(options)
  return engine.run({ periodId, userId })
}

module.exports = { calculate, calculateWithLogs }

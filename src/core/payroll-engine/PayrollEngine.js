const { Pipeline }       = require('./Pipeline')
const { createContext }  = require('./context')

const loadSettings   = require('./pipeline/loadSettings')
const loadEmployees  = require('./pipeline/loadEmployees')
const loadSchedules  = require('./pipeline/loadSchedules')
const loadNovelties  = require('./pipeline/loadNovelties')
const loadRateRules       = require('./pipeline/loadRateRules')
const applyConcepts       = require('./pipeline/applyConcepts')
const applyRules          = require('./pipeline/applyRules')
const calculateTotals     = require('./pipeline/calculateTotals')
const persistPayroll      = require('./pipeline/persistPayroll')
const liquidateRequests   = require('./pipeline/liquidateRequests')
const validateEmployees   = require('./pipeline/validateEmployees')

class PayrollEngine {
  constructor(options = {}) {
    this._options = options
  }

  _buildPipeline() {
    return new Pipeline()
      .pipe(loadSettings)
      .pipe(loadEmployees)
      .pipe(loadSchedules)
      .pipe(loadNovelties)
      .pipe(loadRateRules)
      .pipe(validateEmployees)
      .pipe(applyConcepts)
      .pipe(applyRules)
      .pipe(calculateTotals)
      .pipe(persistPayroll)
      .pipe(liquidateRequests)
  }

  async run({ periodId, userId, options = {} }) {
    const ctx = createContext({
      periodId,
      userId,
      options: { ...this._options, ...options },
    })

    ctx.log('PayrollEngine', `Iniciando cálculo — período ${periodId}`, { periodId, userId })

    const pipeline = this._buildPipeline()
    const result   = await pipeline.run(ctx)

    result.log('PayrollEngine',
      `Cálculo completado — ${result.savedRecords.length} empleados`,
      { duration: `${Date.now() - new Date(result.startedAt).getTime()}ms` }
    )

    return result
  }
}

module.exports = { PayrollEngine }

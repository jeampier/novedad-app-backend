const { query } = require('../../../db/client')

async function loadSettings(ctx) {
  const { rows } = await query('SELECT key, value FROM payroll_settings')
  ctx.settings = Object.fromEntries(rows.map(r => [r.key, Number(r.value)]))
  ctx.log('loadSettings', `${rows.length} configuraciones cargadas`, ctx.settings)
  return ctx
}

module.exports = loadSettings

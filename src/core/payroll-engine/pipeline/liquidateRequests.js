const { query } = require('../../../db/client')

async function liquidateRequests(ctx) {
  const { start_date, end_date } = ctx.period

  const { rows } = await query(
    `UPDATE employee_requests
     SET status = 'liquidada', updated_at = NOW()
     WHERE status = 'aprobada'
       AND start_date <= $2
       AND end_date   >= $1
     RETURNING id, employee_id, type`,
    [start_date, end_date]
  )

  if (rows.length > 0) {
    ctx.log('liquidateRequests',
      `${rows.length} solicitudes liquidadas automáticamente`,
      { ids: rows.map(r => r.id) }
    )
  } else {
    ctx.log('liquidateRequests', 'Sin solicitudes aprobadas en este período')
  }

  return ctx
}

module.exports = liquidateRequests

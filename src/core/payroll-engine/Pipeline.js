class Pipeline {
  constructor() {
    this._steps = []
  }

  pipe(stepFn) {
    if (typeof stepFn !== 'function') throw new Error(`Pipeline.pipe: expected function, got ${typeof stepFn}`)
    this._steps.push(stepFn)
    return this
  }

  async run(ctx) {
    for (const stepFn of this._steps) {
      const name = stepFn.name || 'anonymous'
      const t0 = Date.now()
      ctx.log(name, `→ iniciando`)

      try {
        ctx = await stepFn(ctx)
        ctx.log(name, `✓ completado en ${Date.now() - t0}ms`)
      } catch (err) {
        ctx.error(name, `✗ falló: ${err.message}`, { stack: err.stack })
        throw Object.assign(err, { pipelineStep: name, context: ctx })
      }

      if (!ctx || typeof ctx !== 'object') {
        throw new Error(`Pipeline step "${name}" debe retornar el contexto`)
      }
    }
    return ctx
  }
}

module.exports = { Pipeline }

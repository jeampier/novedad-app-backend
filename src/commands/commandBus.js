const handlers = {}

function register(commandName, handler) {
  handlers[commandName] = handler
}

async function dispatch(commandName, payload, context) {
  const handler = handlers[commandName]
  if (!handler) {
    const err = new Error('Comando desconocido: ' + commandName)
    err.status = 400
    throw err
  }
  return handler(payload, context || {})
}

module.exports = { register, dispatch }

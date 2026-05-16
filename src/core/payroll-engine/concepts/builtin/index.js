const { ConceptRegistry } = require('../ConceptRegistry')

const registry = new ConceptRegistry()

registry
  .register(require('./ordinaryHours'))
  .register(require('./extraHours'))
  .register(require('./extraDiurDom'))
  .register(require('./extraNoct'))
  .register(require('./extraNoctDom'))
  .register(require('./nightHours'))
  .register(require('./surchargeHours'))
  .register(require('./sundayHolidayHours'))
  .register(require('./recDomNoct'))
  .register(require('./auxTransporte'))

module.exports = { registry }

class ConceptRegistry {
  constructor() {
    this._map = new Map()
  }

  register(concept) {
    if (!concept.code) throw new Error('Concept must have a code')
    this._map.set(concept.code, concept)
    return this
  }

  get(code) { return this._map.get(code) || null }

  has(code) { return this._map.has(code) }

  getAll()       { return [...this._map.values()] }
  getEarnings()  { return this.getAll().filter(c => c.type === 'earning') }
  getDeductions(){ return this.getAll().filter(c => c.type === 'deduction') }

  codes() { return [...this._map.keys()] }
}

module.exports = { ConceptRegistry }

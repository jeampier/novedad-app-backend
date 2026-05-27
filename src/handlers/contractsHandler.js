const contractsRepo = require('../repositories/contractsRepo')

async function createContract(payload, context) {
  const { employee_id, 
    contract_type, 
    start_date, 
    end_date, 
    position, 
    base_salary, 
    notes } = payload
    
  if (!employee_id || !contract_type || !start_date) 
    { 
        const e = new Error('Faltan campos requeridos'); 
        e.status=400; 
        throw e 
    }

  return contractsRepo.create({ employee_id, contract_type, start_date, end_date, position, base_salary, notes })
}

async function updateContractStatus(payload, context) {
    const { id, status } = payload
    const VALID_STATUS = ['activo', 'terminado', 'suspendido']
    if (!VALID_STATUS.includes(status)) {
        const e = new Error('Status inválido')
        e.status = 400
        throw e
    }
    return contractsRepo.updateStatus(id, status)
}
module.exports = { createContract, updateContractStatus }


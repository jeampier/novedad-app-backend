require('dotenv').config()
const express = require('express')
const cors    = require('cors')
require('./commands')

const authRoutes     = require('./routes/auth')
const commandRoutes  = require('./routes/commands')
const employeeRoutes = require('./routes/employees')
const absenceRoutes  = require('./routes/absences')
const accidentRoutes = require('./routes/accidents')
const shiftRoutes    = require('./routes/shifts')
const adminUsers     = require('./routes/admin/users')
const adminRoles     = require('./routes/admin/roles')
const adminAudit     = require('./routes/admin/audit')
const adminCleanup   = require('./routes/admin/cleanup')

const payrollConcepts   = require('./routes/payroll/concepts')
const payrollShiftTypes = require('./routes/payroll/shiftTypes')
const payrollSchedule   = require('./routes/payroll/schedule')
const payrollHolidays   = require('./routes/payroll/holidays')
const payrollPeriods    = require('./routes/payroll/periods')
const payrollCalculate  = require('./routes/payroll/calculate')
const payrollRecords    = require('./routes/payroll/records')
const payrollExport     = require('./routes/payroll/export')
const payrollSettings      = require('./routes/payroll/settings')
const payrollAbsenceTypes  = require('./routes/payroll/absenceTypes')
const payrollScheduleImport   = require('./routes/payroll/scheduleImport')
const absenceCodeCatalog      = require('./routes/payroll/absenceCodeCatalog')
const payrollRateRules           = require('./routes/payroll/rateRules')
const payrollValidationRules     = require('./routes/payroll/validationRules')
const dashboardRoutes         = require('./routes/dashboard')
const requestRoutes           = require('./routes/requests')
const contractRoutes          = require('./routes/contracts')

const app = express()
// app.use(cors({
//   origin: (origin, cb) => {
//     if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || origin === process.env.FRONTEND_URL)
//       return cb(null, true)
//     cb(new Error('CORS no permitido'))
//   }
// }))

//correcion cors
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || origin === process.env.FRONTEND_URL)
      return cb(null, true)
    cb(new Error('CORS no permitido'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// fin update
app.use(express.json())
app.options('*', cors())

app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.get('/api/version', (_, res) => {
  res.json({
    version: process.env.APP_VERSION || '1.0.0',
    notes: (process.env.APP_RELEASE_NOTES || '').split('|').filter(Boolean),
  })
})
app.use('/api/dashboard', dashboardRoutes)

app.use('/api/auth',           authRoutes)
app.use('/api/commands',       commandRoutes)
app.use('/api/employees',      employeeRoutes)
app.use('/api/absences',       absenceRoutes)
app.use('/api/accidents',      accidentRoutes)
app.use('/api/shifts',         shiftRoutes)
app.use('/api/admin/users',    adminUsers)
app.use('/api/admin/roles',    adminRoles)
app.use('/api/admin/audit',    adminAudit)
app.use('/api/admin/cleanup',  adminCleanup)

app.use('/api/payroll/concepts',    payrollConcepts)
app.use('/api/payroll/shift-types', payrollShiftTypes)
app.use('/api/payroll/schedule',    payrollSchedule)
app.use('/api/payroll/holidays',    payrollHolidays)
app.use('/api/payroll/periods',     payrollPeriods)
app.use('/api/payroll/calculate',   payrollCalculate)
app.use('/api/payroll/records',     payrollRecords)
app.use('/api/payroll/export',      payrollExport)
app.use('/api/payroll/settings',       payrollSettings)
app.use('/api/payroll/absence-types',  payrollAbsenceTypes)
app.use('/api/payroll/periods',              payrollScheduleImport)
app.use('/api/payroll/absence-code-catalog', absenceCodeCatalog)
app.use('/api/contracts', contractRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/payroll/rate-rules',           payrollRateRules)
app.use('/api/payroll/validation-rules',     payrollValidationRules)

app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(err.status || 500).json({ error: err.message || 'Error interno' })
})

// ❌ Antes
//const PORT = process.env.PORT || 3001
//app.listen(PORT, () => console.log('Backend en puerto ' + PORT))

// ✅ Después
const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => console.log('Backend en puerto ' + PORT))

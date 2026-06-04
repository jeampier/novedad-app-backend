const router = require('express').Router()
const multer = require('multer')
const { requireAuth, requireRole } = require('../../middleware/auth')
const {
  importEmployees, importRateRules, importAbsenceTypes,
  importAbsenceCatalog, importConcepts, generateTemplate, TEMPLATES
} = require('../../services/bulkImportService')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const importers = {
  employees:        importEmployees,
  'rate-rules':     importRateRules,
  'absence-types':  importAbsenceTypes,
  'absence-catalog':importAbsenceCatalog,
  concepts:         importConcepts,
}

router.post('/:entity', requireAuth, requireRole('admin'), upload.single('file'), async (req, res, next) => {
  try {
    const fn = importers[req.params.entity]
    if (!fn) return res.status(404).json({ error: `Entidad desconocida: ${req.params.entity}. Válidas: ${Object.keys(importers).join(', ')}` })
    if (!req.file) return res.status(400).json({ error: 'Se requiere un archivo .xlsx (campo: file)' })
    const result = await fn(req.file.buffer, req.user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/template/:entity', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const entity = req.params.entity
    if (!TEMPLATES[entity]) return res.status(404).json({ error: `Plantilla no encontrada: ${entity}` })
    const wb = await generateTemplate(entity)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="plantilla_${entity}.xlsx"`)
    await wb.xlsx.write(res)
    res.end()
  } catch (err) {
    next(err)
  }
})

module.exports = router

// Datos de la empresa empleadora — actualizar con la información legal real de MAQUINOR
const COMPANY = {
  name: 'MAQUINOR S.A.S.',
  nit: '900.000.000-0',
  address: 'Dirección de la empresa, Colombia',
  legalRepresentative: 'Representante Legal',
}

const CONTRACT_TYPE_LABEL = {
  indefinido: 'a Término Indefinido',
  fijo:       'a Término Fijo',
  obra:       'por Obra o Labor Contratada',
  prestacion: 'de Prestación de Servicios',
}

const CONTRACT_TYPE_TITLE = {
  indefinido: 'CONTRATO INDIVIDUAL DE TRABAJO A TÉRMINO INDEFINIDO',
  fijo:       'CONTRATO INDIVIDUAL DE TRABAJO A TÉRMINO FIJO',
  obra:       'CONTRATO INDIVIDUAL DE TRABAJO POR OBRA O LABOR CONTRATADA',
  prestacion: 'CONTRATO DE PRESTACIÓN DE SERVICIOS',
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

function formatDate(d) {
  if (!d) return '—'
  const iso = String(d).slice(0, 10)
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

function durationClause(contract) {
  switch (contract.contract_type) {
    case 'fijo':
      return `El presente contrato tendrá una duración de término fijo, iniciando el ${formatDate(contract.start_date)} ` +
        `y finalizando el ${formatDate(contract.end_date)}, pudiendo renovarse de acuerdo con lo establecido en el ` +
        `artículo 46 del Código Sustantivo del Trabajo.`
    case 'obra':
      return `El presente contrato durará por el tiempo que demande la ejecución de la obra o labor contratada, ` +
        `iniciando el ${formatDate(contract.start_date)}${contract.end_date ? ` y con fecha estimada de finalización el ${formatDate(contract.end_date)}` : ''}.`
    case 'prestacion':
      return `El presente contrato regirá desde el ${formatDate(contract.start_date)} hasta el ${formatDate(contract.end_date)}, ` +
        `o hasta la culminación del objeto contractual, lo que ocurra primero.`
    default:
      return `El presente contrato es a término indefinido, mientras subsistan las causas que le dieron origen, ` +
        `iniciando el ${formatDate(contract.start_date)}.`
  }
}

function buildContractHtml(contract) {
  const employeeName = `${contract.first_name} ${contract.last_name}`.trim()
  const title        = CONTRACT_TYPE_TITLE[contract.contract_type] || 'CONTRATO INDIVIDUAL DE TRABAJO'
  const typeLabel    = CONTRACT_TYPE_LABEL[contract.contract_type] || ''
  const isService    = contract.contract_type === 'prestacion'

  const partyLabels = isService
    ? { employer: 'CONTRATANTE', employee: 'CONTRATISTA' }
    : { employer: 'EMPLEADOR', employee: 'TRABAJADOR' }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 2.5cm 2cm; }
  html { color-scheme: light; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.55; background: #ffffff; }
  h1 { font-size: 14pt; text-align: center; text-transform: uppercase; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 9pt; color: #6b7280; margin-bottom: 24px; }
  h2 { font-size: 11pt; text-transform: uppercase; margin: 18px 0 6px; }
  p { margin: 0 0 10px; text-align: justify; }
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; }
  table.info td { padding: 4px 0; vertical-align: top; }
  table.info td.label { font-weight: 600; width: 180px; color: #374151; }
  .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
  .signatures div { width: 45%; text-align: center; }
  .signatures .line { border-top: 1px solid #1f2937; margin-bottom: 6px; padding-top: 40px; }
  .footer-note { margin-top: 30px; font-size: 8pt; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="subtitle">Regido por el Código Sustantivo del Trabajo de la República de Colombia</p>

  <p>
    Entre los suscritos, de una parte <strong>${COMPANY.name}</strong>, identificada con NIT
    <strong>${COMPANY.nit}</strong>, domicilio en ${COMPANY.address}, representada legalmente por
    <strong>${COMPANY.legalRepresentative}</strong>, quien en adelante se denominará el
    <strong>${partyLabels.employer}</strong>; y de otra parte <strong>${employeeName}</strong>,
    identificado(a) con ${contract.document_type || 'C.C.'} No. <strong>${contract.document || '—'}</strong>,
    quien en adelante se denominará el <strong>${partyLabels.employee}</strong>, hemos acordado celebrar el
    presente contrato ${typeLabel}, el cual se regirá por las siguientes cláusulas:
  </p>

  <h2>Primera. Objeto</h2>
  <p>
    El ${partyLabels.employee} se obliga a prestar sus servicios personales al ${partyLabels.employer}
    en el cargo de <strong>${contract.position || '—'}</strong>${contract.area ? `, dentro del área de ${contract.area}` : ''},
    desempeñando las funciones propias de dicho cargo y las demás labores afines que le sean asignadas por
    el ${partyLabels.employer}.
  </p>

  <h2>Segunda. Duración</h2>
  <p>${durationClause(contract)}</p>

  <h2>Tercera. Lugar de Trabajo</h2>
  <p>
    El ${partyLabels.employee} prestará sus servicios en las instalaciones, sedes o proyectos asignados por
    el ${partyLabels.employer}, dentro del territorio colombiano, de acuerdo con las necesidades del servicio.
  </p>

  <h2>Cuarta. ${isService ? 'Honorarios' : 'Salario'}</h2>
  <p>
    El ${partyLabels.employer} pagará al ${partyLabels.employee}, como contraprestación directa por sus
    servicios, ${isService ? 'unos honorarios mensuales' : 'un salario mensual'} de
    <strong>${formatCurrency(contract.base_salary)}</strong>${isService ? '' : ', más los recargos, prestaciones sociales y demás beneficios legales a que haya lugar'}.
  </p>

  <h2>Quinta. Jornada Laboral</h2>
  <p>
    ${isService
      ? 'El CONTRATISTA ejecutará el objeto del presente contrato de manera independiente y autónoma, sin sujeción a horario fijo ni subordinación.'
      : 'La jornada laboral será la máxima legal vigente establecida en el Código Sustantivo del Trabajo, distribuida según el horario y turnos definidos por el EMPLEADOR de acuerdo con las necesidades del servicio.'}
  </p>

  <h2>Sexta. Obligaciones Generales</h2>
  <p>
    Las partes se obligan a cumplir con lo establecido en el presente contrato, en el Reglamento Interno de
    Trabajo (cuando aplique), y en las disposiciones legales vigentes en materia laboral, de seguridad social
    y de seguridad y salud en el trabajo.
  </p>

  ${contract.notes ? `<h2>Séptima. Observaciones</h2><p>${contract.notes}</p>` : ''}

  <table class="info">
    <tr><td class="label">Documento de identidad:</td><td>${contract.document_type || 'C.C.'} ${contract.document || '—'}</td></tr>
    <tr><td class="label">Correo electrónico:</td><td>${contract.email || '—'}</td></tr>
    <tr><td class="label">Teléfono:</td><td>${contract.phone || '—'}</td></tr>
  </table>

  <p>
    En constancia de aceptación y conformidad con todas y cada una de las cláusulas anteriores, se firma el
    presente documento en dos ejemplares del mismo tenor, en la ciudad correspondiente, a los
    ${formatDate(new Date().toISOString())}.
  </p>

  <div class="signatures">
    <div>
      <div class="line"></div>
      <strong>${COMPANY.name}</strong><br/>
      ${partyLabels.employer}
    </div>
    <div>
      <div class="line"></div>
      <strong>${employeeName}</strong><br/>
      ${partyLabels.employee} — C.C. ${contract.document || '—'}
    </div>
  </div>

  <p class="footer-note">Documento generado automáticamente por Novedad App — Contrato #${contract.id}</p>
</body>
</html>`
}

module.exports = { buildContractHtml }

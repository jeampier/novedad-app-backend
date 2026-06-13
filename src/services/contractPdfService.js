const puppeteer = require('puppeteer')
const { buildContractHtml } = require('../templates/contractTemplate')

async function generateContractPdf(contract) {
  const html = buildContractHtml(contract)
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    return await page.pdf({ format: 'A4', printBackground: true })
  } finally {
    await browser.close()
  }
}

module.exports = { generateContractPdf }

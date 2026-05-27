/**
 * cleanup.js — Borra todos los datos de prueba dejando la DB lista para el cliente.
 * Conserva: configuración (payroll_settings, shift_types, absence_types, conceptos,
 *           payroll_rate_rules, holidays, roles, permisos) y el usuario admin.
 * Elimina: empleados, ausencias, accidentes, contratos, nómina, solicitudes, auditoría.
 *
 * USO: node src/db/cleanup.js
 * Requiere confirmación interactiva para evitar ejecuciones accidentales.
 */

const { pool } = require('./client')
const readline = require('readline')

const ADMIN_EMAIL = 'admin@novedad.com'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function confirm(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim().toLowerCase())))
}

async function run() {
  console.log('\n⚠️  CLEANUP DE BASE DE DATOS')
  console.log('Este script eliminará TODOS los datos operativos.')
  console.log(`Se conservará únicamente el usuario: ${ADMIN_EMAIL}\n`)

  const answer = await confirm('Escribí "limpiar" para confirmar: ')
  if (answer !== 'limpiar') {
    console.log('Cancelado.')
    rl.close()
    await pool.end()
    return
  }

  rl.close()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Datos operativos — CASCADE maneja las FK automáticamente
    await client.query(`
      TRUNCATE TABLE
        concept_execution_logs,
        rule_snapshots,
        payroll_records,
        work_schedule,
        employee_requests,
        contracts,
        absences,
        accidents,
        shifts,
        audit_log,
        login_history,
        payroll_periods,
        employees
      RESTART IDENTITY CASCADE
    `)

    // Usuarios: eliminar todos excepto el admin
    await client.query(`DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email != $1)`, [ADMIN_EMAIL])
    await client.query(`DELETE FROM users WHERE email != $1`, [ADMIN_EMAIL])

    await client.query('COMMIT')

    console.log('\n✅ Limpieza completada. La DB está lista para el cliente.')
    console.log('   Conservado: configuración, catálogos, conceptos, roles y usuario admin.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error — se hizo rollback:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()

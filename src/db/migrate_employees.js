require('dotenv').config()
const { pool } = require('./client')

async function run() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Agregar columnas nuevas (nullable primero para hacer el migration seguro)
    await client.query(`
      ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS first_name    VARCHAR(80),
        ADD COLUMN IF NOT EXISTS last_name     VARCHAR(80)     NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS document_type VARCHAR(10)     NOT NULL DEFAULT 'CC',
        ADD COLUMN IF NOT EXISTS phone         VARCHAR(20),
        ADD COLUMN IF NOT EXISTS email         VARCHAR(120),
        ADD COLUMN IF NOT EXISTS shift_type_id INTEGER REFERENCES shift_types(id)
    `)

    // 2. Migrar datos: primer token → first_name, resto → last_name
    await client.query(`
      UPDATE employees SET
        first_name = split_part(name, ' ', 1),
        last_name  = TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
      WHERE first_name IS NULL
    `)

    // Para registros donde name no tenía espacio (solo primer nombre)
    await client.query(`
      UPDATE employees SET last_name = '' WHERE last_name IS NULL
    `)

    // 3. Convertir first_name a NOT NULL
    await client.query(`
      ALTER TABLE employees ALTER COLUMN first_name SET NOT NULL
    `)

    // 4. Quitar el default temporal de last_name
    await client.query(`
      ALTER TABLE employees ALTER COLUMN last_name DROP DEFAULT
    `)

    // 5. Eliminar la columna name original
    await client.query(`
      ALTER TABLE employees DROP COLUMN IF EXISTS name
    `)

    // 6. Agregar name como columna GENERATED (backward compat para todos los JOINs)
    await client.query(`
      ALTER TABLE employees ADD COLUMN name VARCHAR(200)
        GENERATED ALWAYS AS (
          CASE WHEN last_name IS NOT NULL AND last_name <> ''
               THEN first_name || ' ' || last_name
               ELSE first_name
          END
        ) STORED
    `)

    // 7. Intentar poblar shift_type_id desde el campo shift legacy (si hay matches)
    await client.query(`
      UPDATE employees e
      SET shift_type_id = st.id
      FROM shift_types st
      WHERE e.shift = st.code
        AND e.shift_type_id IS NULL
    `).catch(() => {}) // silencioso si no hay matches

    await client.query('COMMIT')
    console.log('✓ Migración employees completada')
    console.log('  Columnas agregadas: first_name, last_name, document_type, phone, email, shift_type_id')
    console.log('  Columna name: ahora es GENERATED (first_name || last_name)')

    // Verificar
    const { rows } = await client.query(
      `SELECT id, first_name, last_name, name, document_type, document FROM employees LIMIT 5`
    )
    console.log('\nDatos migrados:')
    rows.forEach(r => console.log(`  id=${r.id} | first="${r.first_name}" | last="${r.last_name}" | name="${r.name}" | doc_type=${r.document_type}`))

  } catch (e) {
    await client.query('ROLLBACK')
    console.error('✗ Error en migración:', e.message)
    throw e
  } finally {
    client.release()
    await pool.end()
  }
}

run()

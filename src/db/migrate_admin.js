require('dotenv').config()
const { pool } = require('./client')

const schema = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(120);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  module VARCHAR(60) NOT NULL,
  action VARCHAR(20) NOT NULL,
  UNIQUE(module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  email VARCHAR(120),
  ip_address VARCHAR(60),
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
`

async function seed() {
  await pool.query(`
    INSERT INTO roles (name, description, is_system) VALUES
      ('admin',      'Administrador con acceso total al sistema', true),
      ('supervisor', 'Supervisor con acceso de lectura y registro', true),
      ('operator',   'Operador con acceso de solo lectura', true)
    ON CONFLICT (name) DO NOTHING
  `)

  const modules = ['dashboard', 'employees', 'absences', 'accidents', 'shifts', 'admin']
  const actions = ['read', 'write', 'edit', 'delete']
  for (const module of modules) {
    for (const action of actions) {
      await pool.query(
        'INSERT INTO permissions (module, action) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [module, action]
      )
    }
  }

  // admin → todos los permisos
  await pool.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p
    WHERE r.name = 'admin'
    ON CONFLICT DO NOTHING
  `)

  // supervisor → read + write en todos excepto admin
  await pool.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p
    WHERE r.name = 'supervisor' AND p.action IN ('read','write') AND p.module != 'admin'
    ON CONFLICT DO NOTHING
  `)

  // operator → solo read en módulos de negocio
  await pool.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id FROM roles r, permissions p
    WHERE r.name = 'operator' AND p.action = 'read'
      AND p.module IN ('dashboard','employees','absences','accidents','shifts')
    ON CONFLICT DO NOTHING
  `)

  // Asignar rol admin al usuario id=1
  await pool.query(`
    INSERT INTO user_roles (user_id, role_id)
    SELECT 1, id FROM roles WHERE name = 'admin'
    ON CONFLICT DO NOTHING
  `)

  // Actualizar full_name del primer usuario si está vacío
  await pool.query(`
    UPDATE users SET full_name = 'Administrador' WHERE id = 1 AND full_name IS NULL
  `)
}

;(async () => {
  try {
    await pool.query(schema)
    console.log('Migración admin completada')
    await seed()
    console.log('Seed completado')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
})()

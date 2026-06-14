const { query } = require('../db/client')

const notificationRepo = {
  async adminUserIds() {
    const { rows } = await query(`
      SELECT DISTINCT u.id
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'admin'
    `)
    return rows.map(r => r.id)
  },

  async create({ recipientId, type, title, message, link }) {
    const { rows } = await query(
      `INSERT INTO notifications (recipient_id, type, title, message, link)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [recipientId, type, title, message || null, link || null]
    )
    return rows[0]
  },

  async createForAdmins({ type, title, message, link }) {
    const adminIds = await notificationRepo.adminUserIds()
    for (const recipientId of adminIds) {
      await notificationRepo.create({ recipientId, type, title, message, link })
    }
  },

  async findByUser(userId, { limit = 20 } = {}) {
    const { rows } = await query(
      'SELECT * FROM notifications WHERE recipient_id=$1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    )
    return rows
  },

  async unreadCount(userId) {
    const { rows } = await query(
      'SELECT COUNT(*) FROM notifications WHERE recipient_id=$1 AND read=false',
      [userId]
    )
    return Number(rows[0].count)
  },

  async markRead(id, userId) {
    const { rows } = await query(
      'UPDATE notifications SET read=true WHERE id=$1 AND recipient_id=$2 RETURNING *',
      [id, userId]
    )
    return rows[0]
  },

  async markAllRead(userId) {
    await query('UPDATE notifications SET read=true WHERE recipient_id=$1 AND read=false', [userId])
  },

  async existsToday({ type, link }) {
    const { rows } = await query(
      `SELECT 1 FROM notifications
       WHERE type=$1 AND link=$2
         AND created_at::date = (NOW() AT TIME ZONE 'America/Bogota')::date
       LIMIT 1`,
      [type, link]
    )
    return rows.length > 0
  },
}

module.exports = notificationRepo

const pool = require('../config/db');

class PostgresMessageRepository {
    async findByRoomId(roomId) {
        const { rows } = await pool.query(
            `SELECT m.id, m.content, m.created_at, m.user_id, u.username
       FROM messages m
       JOIN users u ON u.id = m.user_id
       WHERE m.room_id=$1
       ORDER BY m.created_at ASC`,
            [roomId]
        );
        return rows;
    }

    async save({ userId, roomId, content }) {
        const { rows } = await pool.query(
            'INSERT INTO messages(user_id, room_id, content) VALUES($1,$2,$3) RETURNING *',
            [userId, roomId, content]
        );
        return rows[0];
    }
}

module.exports = PostgresMessageRepository;

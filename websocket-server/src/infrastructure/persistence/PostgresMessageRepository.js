const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || "db",
    user: process.env.DB_USER || "chat",
    password: process.env.DB_PASS || "chat123",
    database: process.env.DB_NAME || "chatdb",
});

class PostgresMessageRepository {
    async save({ userId, roomId, content }) {
        await pool.query(
            "INSERT INTO messages(room_id,user_id,content) VALUES($1,$2,$3)",
            [roomId, userId, content]
        );
    }

    async findRoomById(roomId) {
        const { rows } = await pool.query("SELECT * FROM rooms WHERE id=$1", [roomId]);
        if (!rows.length) return null;
        return rows[0];
    }
}

module.exports = PostgresMessageRepository;

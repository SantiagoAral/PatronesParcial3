const RoomRepository = require('../../domain/repositories/RoomRepository');
const Room = require('../../domain/entities/Room');
const pool = require('../config/db');

class PostgresRoomRepository extends RoomRepository {
    async findAll() {
        const { rows } = await pool.query('SELECT id, name, is_private FROM rooms ORDER BY id ASC');
        return rows.map(row => new Room(row));
    }

    async create(room) {
        const { rows } = await pool.query(
            `INSERT INTO rooms(name, is_private, password_hash)
       VALUES($1, $2, $3)
       RETURNING *`,
            [room.name, room.is_private, room.password_hash]
        );
        return new Room(rows[0]);
    }

    async findById(id) {
        const { rows } = await pool.query('SELECT * FROM rooms WHERE id=$1', [id]);
        if (rows.length === 0) return null;
        return new Room(rows[0]);
    }

    async addMember(userId, roomId) {
        await pool.query(
            'INSERT INTO room_members(user_id, room_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
            [userId, roomId]
        );
        return true;
    }
}

module.exports = PostgresRoomRepository;

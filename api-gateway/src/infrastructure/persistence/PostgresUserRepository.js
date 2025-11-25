const UserRepository = require('../../domain/repositories/UserRepository');
const User = require('../../domain/entities/User');
const pool = require('../config/db');

class PostgresUserRepository extends UserRepository {
    async findByUsername(username) {
        const { rows } = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
        if (rows.length === 0) return null;
        return new User(rows[0]);
    }

    async create(user) {
        const { rows } = await pool.query(
            'INSERT INTO users(username, password_hash) VALUES($1, $2) RETURNING *',
            [user.username, user.password_hash]
        );
        return new User(rows[0]);
    }

    async findById(id) {
        const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
        if (rows.length === 0) return null;
        return new User(rows[0]);
    }
}

module.exports = PostgresUserRepository;

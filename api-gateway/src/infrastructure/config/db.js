const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'chat',
    password: process.env.DB_PASS || 'chat123',
    database: process.env.DB_NAME || 'chatdb',
});

module.exports = pool;

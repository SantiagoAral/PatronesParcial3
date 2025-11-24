const express = require('express');
const pool = require('../../../infrastructure/database/db'); // conexión a la DB
const bcrypt = require('bcrypt');
const { authenticate } = require('../../../infrastructure/http/middleware/auth');

const router = express.Router();

// ------------------------
// LIST ROOMS
// GET /rooms/list
// ------------------------
router.get('/list', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM rooms ORDER BY id ASC');
    res.json({ rooms: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// ------------------------
// CREATE ROOM
// POST /rooms
// ------------------------
router.post('/', authenticate, async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'name and password required' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO rooms(name, is_private, password_hash) VALUES($1, $2, $3) RETURNING *',
      [name, true, hash]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// ------------------------
// JOIN ROOM
// POST /rooms/:id/join
// ------------------------
router.post('/:id/join', authenticate, async (req, res) => {
  const roomId = req.params.id;
  const { password } = req.body;

  try {
    const { rows } = await pool.query('SELECT * FROM rooms WHERE id=$1', [roomId]);
    const room = rows[0];

    if (!room) return res.status(404).json({ error: 'room not found' });

    const ok = await bcrypt.compare(password || '', room.password_hash);
    if (!ok) return res.status(403).json({ error: 'wrong password' });

    await pool.query(
      'INSERT INTO room_members(user_id, room_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, roomId]
    );

    res.json({ joined: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// ------------------------
// GET MESSAGES
// GET /rooms/:id/messages
// ------------------------
router.get('/:id/messages', authenticate, async (req, res) => {
  const roomId = req.params.id;
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.content, m.created_at, m.user_id, u.username
       FROM messages m
       JOIN users u ON u.id = m.user_id
       WHERE m.room_id=$1
       ORDER BY m.created_at ASC`,
      [roomId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ------------------------
// POST MESSAGE
// POST /rooms/:id/messages
// ------------------------
router.post('/:id/messages', authenticate, async (req, res) => {
  const roomId = req.params.id;
  const { content } = req.body;

  if (!content || !content.trim()) return res.status(400).json({ error: 'message content required' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO messages(user_id, room_id, content) VALUES($1,$2,$3) RETURNING *',
      [req.user.id, roomId, content]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;






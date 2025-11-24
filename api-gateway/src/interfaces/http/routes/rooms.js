const express = require('express');
const pool = require('../db');
const bcrypt = require('bcrypt');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// LIST ROOMS --------------------------------------------------
// Ahora devolvemos is_private para que el frontend sepa si pedir password
router.get('/list', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, is_private FROM rooms ORDER BY id ASC'
    );
    res.json({ rooms: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});

// CREATE ROOM --------------------------------------------------
router.post('/create', authenticate, async (req, res) => {
  const { name, is_private, password } = req.body;

  if (!name) return res.status(400).json({ message: "name required" });

  const privateRoom = Boolean(is_private);
  let hash = null;

  try {
    if (privateRoom) {
      if (!password) return res.status(400).json({ message: "password required" });
      hash = await bcrypt.hash(password, 10);
    }

    const { rows } = await pool.query(
      `INSERT INTO rooms(name, is_private, password_hash)
       VALUES($1, $2, $3)
       RETURNING *`,
      [name, privateRoom, hash]
    );

    // Devolvemos el objeto completo (incluye id e is_private)
    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create room" });
  }
});

// JOIN ROOM --------------------------------------------------
// Si la sala es pública no pedimos/validamos password.
// Si es privada validamos y devolvemos mensajes consistentes.
router.post('/:id/join', authenticate, async (req, res) => {
  const roomId = req.params.id;
  const { password } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT * FROM rooms WHERE id=$1',
      [roomId]
    );
    const room = rows[0];

    if (!room) return res.status(404).json({ message: 'room not found' });

    // Si la sala es privada, verificar contraseña
    if (room.is_private) {
      if (!password) return res.status(400).json({ message: 'password required' });

      const ok = await bcrypt.compare(password, room.password_hash);
      if (!ok) return res.status(403).json({ message: 'wrong password' });
    }

    // Insertar miembro (no falla si ya existe)
    await pool.query(
      'INSERT INTO room_members(user_id, room_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, roomId]
    );

    res.json({ joined: true, message: 'joined' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to join room' });
  }
});

// GET MESSAGES --------------------------------------------------
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
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// POST MESSAGE --------------------------------------------------
router.post('/:id/messages', authenticate, async (req, res) => {
  const roomId = req.params.id;
  const { content } = req.body;

  if (!content?.trim())
    return res.status(400).json({ message: 'message content required' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO messages(user_id, room_id, content) VALUES($1,$2,$3) RETURNING *',
      [req.user.id, roomId, content]
    );

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

module.exports = router;




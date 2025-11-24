const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const secret = process.env.JWT_SECRET || 'supersecret';
const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query('INSERT INTO users(username, password_hash) VALUES($1,$2) RETURNING id, username', [username, hash]);
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'user exists' });
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid' });
  const token = jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn: '8h' });
  res.json({ token });
});

module.exports = router;

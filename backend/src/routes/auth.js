const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function getDb(){
  return new sqlite3.Database(process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'database.sqlite'));
}

router.post('/login', async (req, res) => {
  const { userid, password } = req.body;
  if(!userid || !password) return res.status(400).json({ error: 'userid and password required' });

  const db = getDb();
  db.get('SELECT * FROM users WHERE userid = ?', [userid], async (err, user) => {
    db.close();
    if(err) return res.status(500).json({ error: 'Server error' });
    if(!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if(!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { sub: user.id, name: user.name, is_admin: !!user.is_admin };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ token, user: { id: user.id, userid: user.userid, name: user.name, is_admin: !!user.is_admin } });
  });
});

// GET /api/auth/me
const { authenticate } = require('../middleware/auth');
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

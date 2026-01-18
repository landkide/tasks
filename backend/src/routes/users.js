const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function getDb(){
  return new sqlite3.Database(process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'database.sqlite'));
}

// GET /api/users
router.get('/', (req, res) => {
  const db = getDb();
  db.all('SELECT id, userid, name, is_admin, created_at FROM users', [], (err, rows) => {
    db.close();
    if(err) return res.status(500).json({ error: 'Server error' });
    res.json({ users: rows });
  });
});

module.exports = router;

const jwt = require('jsonwebtoken');
const db = require('../db');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

async function getUserById(id){
  const database = new sqlite3.Database(process.env.DB_PATH || path.join(__dirname, '..', 'data', 'database.sqlite'));
  return new Promise((resolve, reject)=>{
    database.get('SELECT id, userid, name, is_admin, created_at FROM users WHERE id = ?', [id], (err, row)=>{
      database.close();
      if(err) return reject(err);
      resolve(row);
    });
  });
}

function authenticate(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader || !authHeader.startsWith('Bearer ')){
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);

  try{
    const payload = jwt.verify(token, JWT_SECRET);
    // attach user info
    getUserById(payload.sub).then(user => {
      if(!user) return res.status(401).json({ error: 'User not found' });
      req.user = user;
      next();
    }).catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    });
  }catch(err){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticate };

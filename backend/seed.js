const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'database.sqlite');

async function seed(){
  const dir = path.dirname(DB_PATH);
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new sqlite3.Database(DB_PATH);
  db.serialize(async ()=>{
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`);

    const pw = await bcrypt.hash('password', 10);
    db.run('INSERT OR IGNORE INTO users (userid, name, password_hash, is_admin) VALUES (?, ?, ?, ?)', ['admin', 'Admin User', pw, 1], function(err){
      if(err) console.error(err);
      else console.log('Seeded admin user (userid: admin, password: password)');
      db.close();
    });
  });
}

seed().catch(console.error);

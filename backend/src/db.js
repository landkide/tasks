const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH =
    process.env.DB_PATH ||
    path.join(__dirname, '..', 'data', 'database.sqlite');

let dbInstance = null;

function ensureDir() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function open() {
    if (dbInstance) return dbInstance;
    ensureDir();
    dbInstance = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Failed to open database', err);
            // allow error to propagate where called
        }
    });
    return dbInstance;
}

function run(sql, params = []) {
    const db = open();
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
}

function get(sql, params = []) {
    const db = open();
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function all(sql, params = []) {
    const db = open();
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

async function init() {
    ensureDir();
    // create tables if not exist
    await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`);

    await run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT '未着手',
    priority TEXT DEFAULT '中',
    assignee_id INTEGER,
    category TEXT,
    tags TEXT,
    due_date TEXT,
    start_date TEXT,
    end_date TEXT,
    estimated_hours REAL,
    actual_hours REAL,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
  );`);

    await run(`CREATE TABLE IF NOT EXISTS task_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    depends_on_task_id INTEGER NOT NULL
  );`);
}

function close() {
    if (!dbInstance) return;
    dbInstance.close();
    dbInstance = null;
}

module.exports = {
    open,
    run,
    get,
    all,
    init,
    close,
    DB_PATH,
};

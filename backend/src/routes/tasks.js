const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function getDb(){
  return new sqlite3.Database(process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'database.sqlite'));
}

function tagsToCsv(tags){
  if(!tags) return null;
  if(Array.isArray(tags)) return tags.join(',');
  return String(tags);
}

function csvToTags(csv){
  if(!csv) return [];
  return csv.split(',').map(s=>s.trim()).filter(Boolean);
}

// GET /api/tasks - list (due date ascending)
router.get('/', (req, res) => {
  const db = getDb();
  db.all(`SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id ORDER BY due_date IS NULL, due_date ASC`, [], (err, rows) => {
    db.close();
    if(err) return res.status(500).json({ error: 'Server error' });
    const tasks = rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      assignee: r.assignee_id ? { id: r.assignee_id, name: r.assignee_name } : null,
      category: r.category,
      tags: csvToTags(r.tags),
      due_date: r.due_date,
      start_date: r.start_date,
      end_date: r.end_date,
      estimated_hours: r.estimated_hours,
      actual_hours: r.actual_hours,
      created_by: r.created_by,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
    res.json({ tasks });
  });
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const db = getDb();
  db.get(`SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?`, [id], (err, r) => {
    db.close();
    if(err) return res.status(500).json({ error: 'Server error' });
    if(!r) return res.status(404).json({ error: 'Task not found' });
    const task = {
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      assignee: r.assignee_id ? { id: r.assignee_id, name: r.assignee_name } : null,
      category: r.category,
      tags: csvToTags(r.tags),
      due_date: r.due_date,
      start_date: r.start_date,
      end_date: r.end_date,
      estimated_hours: r.estimated_hours,
      actual_hours: r.actual_hours,
      created_by: r.created_by,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
    res.json({ task });
  });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const p = req.body;
  if(!p.title) return res.status(400).json({ error: 'title required' });

  const tags = tagsToCsv(p.tags);
  const db = getDb();
  const stmt = `INSERT INTO tasks (title, description, status, priority, assignee_id, category, tags, due_date, start_date, end_date, estimated_hours, actual_hours, created_by, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const params = [p.title, p.description||null, p.status||'未着手', p.priority||'中', p.assignee_id||null, p.category||null, tags, p.due_date||null, p.start_date||null, p.end_date||null, p.estimated_hours||null, p.actual_hours||null, req.user.id, null];
  db.run(stmt, params, function(err){
    if(err){ db.close(); return res.status(500).json({ error: 'Server error' }); }
    const id = this.lastID;
    db.get(`SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?`, [id], (err2, r) => {
      db.close();
      if(err2) return res.status(500).json({ error: 'Server error' });
      res.status(201).json({ task: {
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        priority: r.priority,
        assignee: r.assignee_id ? { id: r.assignee_id, name: r.assignee_name } : null,
        category: r.category,
        tags: csvToTags(r.tags),
        due_date: r.due_date,
        start_date: r.start_date,
        end_date: r.end_date,
        estimated_hours: r.estimated_hours,
        actual_hours: r.actual_hours,
        created_by: r.created_by,
        created_at: r.created_at,
        updated_at: r.updated_at,
      } });
    });
  });
});

// PUT /api/tasks/:id (full update)
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const p = req.body;
  if(!p.title) return res.status(400).json({ error: 'title required' });
  const tags = tagsToCsv(p.tags);
  const db = getDb();
  const stmt = `UPDATE tasks SET title=?, description=?, status=?, priority=?, assignee_id=?, category=?, tags=?, due_date=?, start_date=?, end_date=?, estimated_hours=?, actual_hours=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`;
  const params = [p.title, p.description||null, p.status||'未着手', p.priority||'中', p.assignee_id||null, p.category||null, tags, p.due_date||null, p.start_date||null, p.end_date||null, p.estimated_hours||null, p.actual_hours||null, id];
  db.run(stmt, params, function(err){
    if(err){ db.close(); return res.status(500).json({ error: 'Server error' }); }
    db.get(`SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?`, [id], (err2, r) => {
      db.close();
      if(err2) return res.status(500).json({ error: 'Server error' });
      if(!r) return res.status(404).json({ error: 'Task not found' });
      res.json({ task: {
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        priority: r.priority,
        assignee: r.assignee_id ? { id: r.assignee_id, name: r.assignee_name } : null,
        category: r.category,
        tags: csvToTags(r.tags),
        due_date: r.due_date,
        start_date: r.start_date,
        end_date: r.end_date,
        estimated_hours: r.estimated_hours,
        actual_hours: r.actual_hours,
        created_by: r.created_by,
        created_at: r.created_at,
        updated_at: r.updated_at,
      } });
    });
  });
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if(!status) return res.status(400).json({ error: 'status required' });
  const db = getDb();
  db.run('UPDATE tasks SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, id], function(err){
    if(err){ db.close(); return res.status(500).json({ error: 'Server error' }); }
    db.get(`SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?`, [id], (err2, r) => {
      db.close();
      if(err2) return res.status(500).json({ error: 'Server error' });
      if(!r) return res.status(404).json({ error: 'Task not found' });
      res.json({ task: {
        id: r.id,
        status: r.status,
      } });
    });
  });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const db = getDb();
  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err){
    db.close();
    if(err) return res.status(500).json({ error: 'Server error' });
    if(this.changes === 0) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  });
});

module.exports = router;

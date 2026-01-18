const express = require('express');
const router = express.Router();
const db = require('../db');
const { mapTaskRowToTask, tagsToCsv } = require('../utils/taskMapper');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validators/tasks');

// GET /api/tasks
router.get('/', async (req, res, next) => {
    try {
        const rows = await db.all(`
      SELECT t.*, u.name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      ORDER BY due_date IS NULL, due_date ASC
    `);
        res.json({ tasks: rows.map(mapTaskRowToTask) });
    } catch (err) {
        next(err);
    }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
    try {
        const r = await db.get(
            `
      SELECT t.*, u.name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.id = ?
    `,
            [req.params.id]
        );

        if (!r) return res.status(404).json({ error: 'Task not found' });
        res.json({ task: mapTaskRowToTask(r) });
    } catch (err) {
        next(err);
    }
});

// POST /api/tasks
router.post('/', validate(createTaskSchema), async (req, res, next) => {
    try {
        const p = req.body;
        const tags = tagsToCsv(p.tags);

        const stmt = `
      INSERT INTO tasks
      (title, description, status, priority, assignee_id, category, tags,
       due_date, start_date, end_date, estimated_hours, actual_hours,
       created_by, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

        const params = [
            p.title,
            p.description || null,
            p.status || '未着手',
            p.priority || '中',
            p.assignee_id || null,
            p.category || null,
            tags,
            p.due_date || null,
            p.start_date || null,
            p.end_date || null,
            p.estimated_hours || null,
            p.actual_hours || null,
            req.user.id,
            null,
        ];

        const result = await db.run(stmt, params);
        const id = result.lastID;

        const r = await db.get(
            `
      SELECT t.*, u.name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.id = ?
    `,
            [id]
        );

        res.status(201).json({ task: mapTaskRowToTask(r) });
    } catch (err) {
        next(err);
    }
});

// PUT /api/tasks/:id
router.put('/:id', validate(updateTaskSchema), async (req, res, next) => {
    try {
        const p = req.body;
        const tags = tagsToCsv(p.tags);

        const stmt = `
      UPDATE tasks SET
      title=?, description=?, status=?, priority=?, assignee_id=?, category=?, tags=?,
      due_date=?, start_date=?, end_date=?, estimated_hours=?, actual_hours=?,
      updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `;

        const params = [
            p.title,
            p.description || null,
            p.status || '未着手',
            p.priority || '中',
            p.assignee_id || null,
            p.category || null,
            tags,
            p.due_date || null,
            p.start_date || null,
            p.end_date || null,
            p.estimated_hours || null,
            p.actual_hours || null,
            req.params.id,
        ];

        await db.run(stmt, params);

        const r = await db.get(
            `
      SELECT t.*, u.name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.id = ?
    `,
            [req.params.id]
        );

        if (!r) return res.status(404).json({ error: 'Task not found' });
        res.json({ task: mapTaskRowToTask(r) });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'status required' });

        await db.run(
            'UPDATE tasks SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
            [status, req.params.id]
        );

        const r = await db.get('SELECT id, status FROM tasks WHERE id=?', [
            req.params.id,
        ]);

        if (!r) return res.status(404).json({ error: 'Task not found' });
        res.json({ task: r });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const result = await db.run('DELETE FROM tasks WHERE id=?', [
            req.params.id,
        ]);

        if (result.changes === 0)
            return res.status(404).json({ error: 'Task not found' });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;

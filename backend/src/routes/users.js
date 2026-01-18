const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
    try {
        const rows = await db.all(
            'SELECT id, userid, name, is_admin, created_at FROM users'
        );
        res.json({ users: rows });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

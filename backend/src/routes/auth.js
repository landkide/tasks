const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

router.post('/login', async (req, res, next) => {
    const { userid, password } = req.body;
    if (!userid || !password)
        return res.status(400).json({ error: 'userid and password required' });

    try {
        const user = await db.get('SELECT * FROM users WHERE userid = ?', [
            userid,
        ]);
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const payload = {
            sub: user.id,
            name: user.name,
            is_admin: !!user.is_admin,
        };

        const token = jwt.sign(payload, JWT_SECRET || 'dev_secret', {
            expiresIn: JWT_EXPIRES_IN,
        });

        res.json({
            token,
            user: {
                id: user.id,
                userid: user.userid,
                name: user.name,
                is_admin: !!user.is_admin,
            },
        });
    } catch (err) {
        next(err);
    }
});

router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;

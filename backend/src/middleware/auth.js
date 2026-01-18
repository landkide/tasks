const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.warn(
        'JWT_SECRET is not set. Set process.env.JWT_SECRET in production!'
    );
}

async function getUserById(id) {
    const row = await db.get(
        'SELECT id, userid, name, is_admin, created_at FROM users WHERE id = ?',
        [id]
    );
    return row || null;
}

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, JWT_SECRET || 'dev_secret');

        // basic payload validation
        if (!payload || !payload.sub) {
            return res.status(401).json({ error: 'Invalid token payload' });
        }

        getUserById(payload.sub)
            .then((user) => {
                if (!user)
                    return res.status(401).json({ error: 'User not found' });
                req.user = user;
                next();
            })
            .catch((err) => {
                console.error(err);
                next(err);
            });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { authenticate };

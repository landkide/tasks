const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const tasksRoutes = require('./routes/tasks');
const db = require('./db');
const { authenticate } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS origin configurable via env
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: CORS_ORIGIN }));

// Use built-in JSON parser; avoid body-parser unless needed explicitly
app.use(express.json());

// Public auth routes (no auth middleware)
app.use('/api/auth', authRoutes);

// Protected API routes (apply authenticate per-route)
app.use('/api/users', authenticate, usersRoutes);
app.use('/api/tasks', authenticate, tasksRoutes);

// Protected test route
app.get('/api/protected', authenticate, (req, res) => {
    res.json({ ok: true, user: req.user });
});

// Register error handler last
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Initialize DB then start server
db.init()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database', err);
        process.exit(1);
    });

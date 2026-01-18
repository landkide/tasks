const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const tasksRoutes = require('./routes/tasks');
const db = require('./db');
const { authenticate } = require('./middleware/auth');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);

// Protected API routes
app.use('/api/users', authenticate, usersRoutes);
app.use('/api/tasks', authenticate, tasksRoutes);

// Protected test route
app.get('/api/protected', authenticate, (req, res) => {
  res.json({ ok: true, user: req.user });
});

const PORT = process.env.PORT || 4000;

db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database', err);
  process.exit(1);
});

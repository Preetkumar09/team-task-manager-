const router = require('express').Router();
const { auth } = require('../middleware/auth');
const db = require('../db');

// GET /api/users - admin gets all, member gets project members
router.get('/', auth, (req, res) => {
  const users = db.get('users').value().map(u => ({
    id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt
  }));
  res.json(users);
});

module.exports = router;

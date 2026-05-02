require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// Auto-seed demo data if DB is empty
if (db.get('users').value().length === 0) {
  const bcrypt = require('bcryptjs');
  bcrypt.hash('password123', 10).then(hash => {
    db.get('users').push(
      { id: 'admin001', name: 'Alice Admin', email: 'admin@demo.com', password: hash, role: 'admin', createdAt: new Date().toISOString() },
      { id: 'member001', name: 'Bob Member', email: 'member@demo.com', password: hash, role: 'member', createdAt: new Date().toISOString() },
      { id: 'member002', name: 'Charlie Dev', email: 'charlie@demo.com', password: hash, role: 'member', createdAt: new Date().toISOString() }
    ).write();
    db.get('projects').push(
      { id: 'proj001', name: 'Website Redesign', description: 'Revamp the company website', ownerId: 'admin001', status: 'active', createdAt: new Date().toISOString() },
      { id: 'proj002', name: 'Mobile App v2', description: 'Next gen mobile app', ownerId: 'admin001', status: 'active', createdAt: new Date().toISOString() }
    ).write();
    db.get('projectMembers').push(
      { id: 'pm001', projectId: 'proj001', userId: 'member001', addedAt: new Date().toISOString() },
      { id: 'pm002', projectId: 'proj001', userId: 'member002', addedAt: new Date().toISOString() },
      { id: 'pm003', projectId: 'proj002', userId: 'member001', addedAt: new Date().toISOString() }
    ).write();
    const t = new Date();
    const fmt = d => new Date(d).toISOString().split('T')[0];
    db.get('tasks').push(
      { id: 't001', title: 'Design new homepage', description: 'Create mockups for homepage', projectId: 'proj001', assignedTo: 'member001', priority: 'high', status: 'in_progress', dueDate: fmt(t.getTime()+86400000), createdBy: 'admin001', createdAt: t.toISOString(), updatedAt: t.toISOString() },
      { id: 't002', title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions', projectId: 'proj001', assignedTo: 'member002', priority: 'medium', status: 'todo', dueDate: fmt(t.getTime()+7*86400000), createdBy: 'admin001', createdAt: t.toISOString(), updatedAt: t.toISOString() },
      { id: 't003', title: 'Update navigation menu', description: 'Responsive nav', projectId: 'proj001', assignedTo: 'member001', priority: 'low', status: 'done', dueDate: fmt(t.getTime()-86400000), createdBy: 'admin001', createdAt: t.toISOString(), updatedAt: t.toISOString() },
      { id: 't004', title: 'Fix login bug on iOS', description: 'Token not persisting on Safari', projectId: 'proj001', assignedTo: 'member002', priority: 'high', status: 'review', dueDate: fmt(t.getTime()-86400000), createdBy: 'admin001', createdAt: t.toISOString(), updatedAt: t.toISOString() },
      { id: 't005', title: 'Build user profile screen', description: 'User settings page', projectId: 'proj002', assignedTo: 'member001', priority: 'medium', status: 'todo', dueDate: fmt(t.getTime()+7*86400000), createdBy: 'admin001', createdAt: t.toISOString(), updatedAt: t.toISOString() },
      { id: 't006', title: 'Push notification system', description: 'FCM notifications', projectId: 'proj002', assignedTo: null, priority: 'high', status: 'todo', dueDate: fmt(t.getTime()+7*86400000), createdBy: 'admin001', createdAt: t.toISOString(), updatedAt: t.toISOString() }
    ).write();
    console.log('✅ Demo data seeded');
  });
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get(/.*/, (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const db = require('../db');

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// GET /api/projects - list projects user belongs to
router.get('/', auth, (req, res) => {
  let projects;
  if (req.user.role === 'admin') {
    projects = db.get('projects').value();
  } else {
    const memberships = db.get('projectMembers').filter({ userId: req.user.id }).value().map(m => m.projectId);
    const owned = db.get('projects').filter({ ownerId: req.user.id }).value().map(p => p.id);
    const ids = [...new Set([...memberships, ...owned])];
    projects = db.get('projects').filter(p => ids.includes(p.id)).value();
  }

  // Attach member count and task stats
  projects = projects.map(p => {
    const members = db.get('projectMembers').filter({ projectId: p.id }).value();
    const tasks = db.get('tasks').filter({ projectId: p.id }).value();
    const owner = db.get('users').find({ id: p.ownerId }).value();
    return {
      ...p,
      memberCount: members.length + 1,
      taskCount: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      ownerName: owner?.name || 'Unknown'
    };
  });

  res.json(projects);
});

// POST /api/projects - admin only
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('description').optional().trim()
], (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  const project = {
    id: genId(),
    name,
    description: description || '',
    ownerId: req.user.id,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  db.get('projects').push(project).write();
  res.status(201).json(project);
});

// GET /api/projects/:id
router.get('/:id', auth, (req, res) => {
  const project = db.get('projects').find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // Check access
  const isMember = db.get('projectMembers').find({ projectId: project.id, userId: req.user.id }).value();
  if (req.user.role !== 'admin' && project.ownerId !== req.user.id && !isMember) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const members = db.get('projectMembers').filter({ projectId: project.id }).value().map(m => {
    const u = db.get('users').find({ id: m.userId }).value();
    return { ...m, name: u?.name, email: u?.email };
  });
  const owner = db.get('users').find({ id: project.ownerId }).value();
  const tasks = db.get('tasks').filter({ projectId: project.id }).value();

  res.json({ ...project, members, ownerName: owner?.name, tasks });
});

// PUT /api/projects/:id - admin only
router.put('/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const project = db.get('projects').find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: 'Not found' });

  db.get('projects').find({ id: req.params.id }).assign({
    name: req.body.name || project.name,
    description: req.body.description !== undefined ? req.body.description : project.description,
    status: req.body.status || project.status,
    updatedAt: new Date().toISOString()
  }).write();

  res.json(db.get('projects').find({ id: req.params.id }).value());
});

// DELETE /api/projects/:id - admin only
router.delete('/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.get('projects').remove({ id: req.params.id }).write();
  db.get('tasks').remove({ projectId: req.params.id }).write();
  db.get('projectMembers').remove({ projectId: req.params.id }).write();
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members - add member (admin only)
router.post('/:id/members', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const project = db.get('projects').find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { userId } = req.body;
  const user = db.get('users').find({ id: userId }).value();
  if (!user) return res.status(404).json({ error: 'User not found' });

  const exists = db.get('projectMembers').find({ projectId: req.params.id, userId }).value();
  if (exists) return res.status(400).json({ error: 'Already a member' });

  const membership = { id: genId(), projectId: req.params.id, userId, addedAt: new Date().toISOString() };
  db.get('projectMembers').push(membership).write();
  res.status(201).json({ ...membership, name: user.name, email: user.email });
});

// DELETE /api/projects/:id/members/:userId - remove member (admin only)
router.delete('/:id/members/:userId', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.get('projectMembers').remove({ projectId: req.params.id, userId: req.params.userId }).write();
  res.json({ message: 'Member removed' });
});

module.exports = router;

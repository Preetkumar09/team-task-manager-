const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const db = require('../db');

function genId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function canAccessProject(projectId, userId, role) {
  const project = db.get('projects').find({ id: projectId }).value();
  if (!project) return null;
  if (role === 'admin' || project.ownerId === userId) return project;
  const isMember = db.get('projectMembers').find({ projectId, userId }).value();
  return isMember ? project : null;
}

// GET /api/tasks - get tasks (optionally filter by project)
router.get('/', auth, (req, res) => {
  const { projectId, assignedTo, status } = req.query;
  let tasks = db.get('tasks').value();

  if (req.user.role !== 'admin') {
    // Filter to only accessible projects
    const memberships = db.get('projectMembers').filter({ userId: req.user.id }).value().map(m => m.projectId);
    const owned = db.get('projects').filter({ ownerId: req.user.id }).value().map(p => p.id);
    const accessible = [...new Set([...memberships, ...owned])];
    tasks = tasks.filter(t => accessible.includes(t.projectId) || t.assignedTo === req.user.id);
  }

  if (projectId) tasks = tasks.filter(t => t.projectId === projectId);
  if (assignedTo) tasks = tasks.filter(t => t.assignedTo === assignedTo);
  if (status) tasks = tasks.filter(t => t.status === status);

  // Enrich
  tasks = tasks.map(t => {
    const assignee = t.assignedTo ? db.get('users').find({ id: t.assignedTo }).value() : null;
    const project = db.get('projects').find({ id: t.projectId }).value();
    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
    return { ...t, assigneeName: assignee?.name, projectName: project?.name, isOverdue };
  });

  res.json(tasks);
});

// POST /api/tasks
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('projectId').notEmpty().withMessage('Project ID required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done'])
], (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only can create tasks' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;
  const project = db.get('projects').find({ id: projectId }).value();
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (assignedTo) {
    const assignee = db.get('users').find({ id: assignedTo }).value();
    if (!assignee) return res.status(404).json({ error: 'Assignee not found' });
  }

  const task = {
    id: genId(),
    title,
    description: description || '',
    projectId,
    assignedTo: assignedTo || null,
    priority: priority || 'medium',
    status: status || 'todo',
    dueDate: dueDate || null,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.get('tasks').push(task).write();

  const assignee = task.assignedTo ? db.get('users').find({ id: task.assignedTo }).value() : null;
  res.status(201).json({ ...task, assigneeName: assignee?.name, projectName: project.name });
});

// GET /api/tasks/:id
router.get('/:id', auth, (req, res) => {
  const task = db.get('tasks').find({ id: req.params.id }).value();
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const project = canAccessProject(task.projectId, req.user.id, req.user.role);
  if (!project && task.assignedTo !== req.user.id) return res.status(403).json({ error: 'Access denied' });

  const assignee = task.assignedTo ? db.get('users').find({ id: task.assignedTo }).value() : null;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  res.json({ ...task, assigneeName: assignee?.name, projectName: project?.name, isOverdue });
});

// PUT /api/tasks/:id
router.put('/:id', auth, (req, res) => {
  const task = db.get('tasks').find({ id: req.params.id }).value();
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Members can only update status of their own tasks
  if (req.user.role !== 'admin') {
    if (task.assignedTo !== req.user.id) return res.status(403).json({ error: 'Can only update your own tasks' });
    // Members can only change status
    const { status } = req.body;
    if (!status || !['todo', 'in_progress', 'review', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Members can only update task status' });
    }
    db.get('tasks').find({ id: req.params.id }).assign({ status, updatedAt: new Date().toISOString() }).write();
    return res.json(db.get('tasks').find({ id: req.params.id }).value());
  }

  const updates = {};
  if (req.body.title) updates.title = req.body.title;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.status) updates.status = req.body.status;
  if (req.body.priority) updates.priority = req.body.priority;
  if (req.body.assignedTo !== undefined) updates.assignedTo = req.body.assignedTo;
  if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate;
  updates.updatedAt = new Date().toISOString();

  db.get('tasks').find({ id: req.params.id }).assign(updates).write();
  const updated = db.get('tasks').find({ id: req.params.id }).value();
  const assignee = updated.assignedTo ? db.get('users').find({ id: updated.assignedTo }).value() : null;
  const project = db.get('projects').find({ id: updated.projectId }).value();
  res.json({ ...updated, assigneeName: assignee?.name, projectName: project?.name });
});

// DELETE /api/tasks/:id - admin only
router.delete('/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.get('tasks').remove({ id: req.params.id }).write();
  res.json({ message: 'Task deleted' });
});

module.exports = router;

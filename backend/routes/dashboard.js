const router = require('express').Router();
const { auth } = require('../middleware/auth');
const db = require('../db');

// GET /api/dashboard
router.get('/', auth, (req, res) => {
  const now = new Date();
  let tasks, projects;

  if (req.user.role === 'admin') {
    tasks = db.get('tasks').value();
    projects = db.get('projects').value();
  } else {
    const memberships = db.get('projectMembers').filter({ userId: req.user.id }).value().map(m => m.projectId);
    const owned = db.get('projects').filter({ ownerId: req.user.id }).value().map(p => p.id);
    const accessible = [...new Set([...memberships, ...owned])];
    projects = db.get('projects').filter(p => accessible.includes(p.id)).value();
    tasks = db.get('tasks').filter(t => t.assignedTo === req.user.id || accessible.includes(t.projectId)).value();
  }

  const myTasks = tasks.filter(t => t.assignedTo === req.user.id);
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done');

  const stats = {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    myTasks: myTasks.length,
    todoTasks: tasks.filter(t => t.status === 'todo').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    reviewTasks: tasks.filter(t => t.status === 'review').length,
    doneTasks: tasks.filter(t => t.status === 'done').length,
    overdueTasks: overdueTasks.length,
  };

  // Recent tasks (last 10)
  const recentTasks = tasks
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 10)
    .map(t => {
      const assignee = t.assignedTo ? db.get('users').find({ id: t.assignedTo }).value() : null;
      const project = db.get('projects').find({ id: t.projectId }).value();
      const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== 'done';
      return { ...t, assigneeName: assignee?.name, projectName: project?.name, isOverdue };
    });

  res.json({ stats, recentTasks, overdueTasks: overdueTasks.slice(0, 5).map(t => {
    const project = db.get('projects').find({ id: t.projectId }).value();
    return { ...t, projectName: project?.name };
  })});
});

module.exports = router;

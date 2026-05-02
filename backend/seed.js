const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  // Clear existing
  db.set('users', []).write();
  db.set('projects', []).write();
  db.set('tasks', []).write();
  db.set('projectMembers', []).write();

  const hash = await bcrypt.hash('password123', 10);

  const admin = { id: 'admin001', name: 'Alice Admin', email: 'admin@demo.com', password: hash, role: 'admin', createdAt: new Date().toISOString() };
  const member1 = { id: 'member001', name: 'Bob Member', email: 'member@demo.com', password: hash, role: 'member', createdAt: new Date().toISOString() };
  const member2 = { id: 'member002', name: 'Charlie Dev', email: 'charlie@demo.com', password: hash, role: 'member', createdAt: new Date().toISOString() };

  db.get('users').push(admin, member1, member2).write();

  const project1 = { id: 'proj001', name: 'Website Redesign', description: 'Revamp the company website with modern UI/UX', ownerId: 'admin001', status: 'active', createdAt: new Date().toISOString() };
  const project2 = { id: 'proj002', name: 'Mobile App v2', description: 'Next generation mobile application', ownerId: 'admin001', status: 'active', createdAt: new Date().toISOString() };

  db.get('projects').push(project1, project2).write();
  db.get('projectMembers').push({ id: 'pm001', projectId: 'proj001', userId: 'member001', addedAt: new Date().toISOString() }).write();
  db.get('projectMembers').push({ id: 'pm002', projectId: 'proj001', userId: 'member002', addedAt: new Date().toISOString() }).write();
  db.get('projectMembers').push({ id: 'pm003', projectId: 'proj002', userId: 'member001', addedAt: new Date().toISOString() }).write();

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const tasks = [
    { id: 't001', title: 'Design new homepage', description: 'Create mockups for the homepage', projectId: 'proj001', assignedTo: 'member001', priority: 'high', status: 'in_progress', dueDate: tomorrow, createdBy: 'admin001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 't002', title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions', projectId: 'proj001', assignedTo: 'member002', priority: 'medium', status: 'todo', dueDate: nextWeek, createdBy: 'admin001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 't003', title: 'Update navigation menu', description: 'Responsive navigation', projectId: 'proj001', assignedTo: 'member001', priority: 'low', status: 'done', dueDate: yesterday, createdBy: 'admin001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 't004', title: 'Fix login bug on iOS', description: 'Token not persisting on Safari', projectId: 'proj001', assignedTo: 'member002', priority: 'high', status: 'review', dueDate: yesterday, createdBy: 'admin001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 't005', title: 'Build user profile screen', projectId: 'proj002', assignedTo: 'member001', priority: 'medium', status: 'todo', dueDate: nextWeek, description: '', createdBy: 'admin001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 't006', title: 'Push notification system', projectId: 'proj002', assignedTo: null, priority: 'high', status: 'todo', dueDate: nextWeek, description: 'Implement FCM push notifications', createdBy: 'admin001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  db.get('tasks').push(...tasks).write();

  console.log('✅ Seed complete!');
  console.log('  admin@demo.com / password123 (Admin)');
  console.log('  member@demo.com / password123 (Member)');
  console.log('  charlie@demo.com / password123 (Member)');
}

seed().catch(console.error);

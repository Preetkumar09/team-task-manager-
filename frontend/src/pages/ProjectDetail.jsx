import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, UserPlus } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_BADGE = { todo: 'badge-todo', in_progress: 'badge-in_progress', review: 'badge-review', done: 'badge-done' };
const STATUS_LABEL = { todo: 'Todo', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_BADGE = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };

const COLS = ['todo', 'in_progress', 'review', 'done'];
const COL_LABEL = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const COL_COLOR = { todo: 'var(--text3)', in_progress: 'var(--blue)', review: 'var(--yellow)', done: 'var(--green)' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get(`/projects/${id}`).then(r => setProject(r.data)).catch(() => navigate('/projects')).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (user?.role === 'admin') api.get('/users').then(r => setAllUsers(r.data));
  }, [id]);

  const createTask = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/tasks', { ...taskForm, projectId: id, assignedTo: taskForm.assignedTo || undefined });
      toast.success('Task created!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/projects/${id}/members`, { userId });
      toast.success('Member added!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const removeMember = async (userId) => {
    await api.delete(`/projects/${id}/members/${userId}`);
    toast.success('Member removed');
    load();
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot update');
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete task?')) return;
    await api.delete(`/tasks/${taskId}`);
    toast.success('Deleted');
    load();
  };

  if (loading) return <div className="page"><div className="loading">Loading...</div></div>;
  if (!project) return null;

  const tasksByStatus = COLS.reduce((acc, s) => ({ ...acc, [s]: (project.tasks || []).filter(t => t.status === s) }), {});
  const nonMembers = allUsers.filter(u => u.id !== project.ownerId && !project.members?.find(m => m.userId === u.id));

  return (
    <div className="page" style={{ maxWidth: '100%' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="page-title">{project.name}</h1>
            <div className="page-subtitle">{project.description || 'No description'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {user?.role === 'admin' && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>
                <UserPlus size={16} /> Members
              </button>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
                <Plus size={16} /> Add Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Members bar */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[{ name: project.ownerName, id: project.ownerId }, ...(project.members || [])].map(m => (
            <div key={m.id} title={m.name} style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white', border: '2px solid var(--bg2)', marginLeft: -6
            }}>
              {m.name?.[0]?.toUpperCase()}
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {1 + (project.members?.length || 0)} members · {project.tasks?.length || 0} tasks
        </span>
      </div>

      {/* Kanban board */}
      <div className="kanban">
        {COLS.map(col => (
          <div key={col} className="kanban-col">
            <div className="kanban-col-header">
              <span style={{ fontSize: 12, fontWeight: 700, color: COL_COLOR[col], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {COL_LABEL[col]}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg)', padding: '2px 7px', borderRadius: 10 }}>
                {tasksByStatus[col].length}
              </span>
            </div>
            <div className="kanban-tasks">
              {tasksByStatus[col].map(t => {
                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
                return (
                  <div key={t.id} className={`kanban-task ${isOverdue ? 'overdue' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, flex: 1, lineHeight: 1.4 }}>{t.title}</div>
                      {user?.role === 'admin' && (
                        <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 2, marginLeft: 4 }}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    {t.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span className={`badge ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span>
                      {isOverdue && <span className="badge badge-overdue">OVERDUE</span>}
                    </div>
                    {t.assigneeName && (
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>👤 {t.assigneeName}</div>
                    )}
                    {t.dueDate && (
                      <div style={{ fontSize: 11, color: isOverdue ? 'var(--red)' : 'var(--text3)', marginBottom: 8 }}>
                        📅 {new Date(t.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    <select value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value)}
                      style={{
                        width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '4px 8px', color: 'var(--text2)',
                        fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
                      }}
                      onClick={e => e.stopPropagation()}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Task</h3>
              <button onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={createTask}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm(f => ({...f, title: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Optional description"
                  value={taskForm.description} onChange={e => setTaskForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm(f => ({...f, priority: e.target.value}))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={taskForm.status} onChange={e => setTaskForm(f => ({...f, status: e.target.value}))}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" value={taskForm.assignedTo} onChange={e => setTaskForm(f => ({...f, assignedTo: e.target.value}))}>
                  <option value="">Unassigned</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={taskForm.dueDate}
                  onChange={e => setTaskForm(f => ({...f, dueDate: e.target.value}))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Members</h3>
              <button onClick={() => setShowMemberModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <h4 style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Current Members</h4>
            {[{ id: project.ownerId, name: project.ownerName, isOwner: true }, ...(project.members || []).map(m => ({ ...m, name: m.name }))].map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13 }}>{m.name}</span>
                  {m.isOwner && <span className="badge badge-admin" style={{ fontSize: 10 }}>Owner</span>}
                </div>
                {!m.isOwner && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.userId || m.id)}>Remove</button>
                )}
              </div>
            ))}

            {nonMembers.length > 0 && (
              <>
                <h4 style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, marginTop: 20 }}>Add Members</h4>
                {nonMembers.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                        {u.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => addMember(u.id)}>
                      <Plus size={12} /> Add
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

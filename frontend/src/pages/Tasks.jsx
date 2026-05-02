import { useEffect, useState } from 'react';
import { Filter, AlertCircle } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_BADGE = { todo: 'badge-todo', in_progress: 'badge-in_progress', review: 'badge-review', done: 'badge-done' };
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_BADGE = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
  const { user } = useAuth();

  const load = () => {
    const params = {};
    if (filter.status) params.status = filter.status;
    api.get('/tasks', { params }).then(r => setTasks(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter.status]);

  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      load();
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete task?')) return;
    await api.delete(`/tasks/${id}`);
    toast.success('Deleted');
    load();
  };

  const filtered = tasks.filter(t => {
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <div className="page-subtitle">{filtered.length} tasks</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={14} color="var(--text3)" />
          <input className="form-input" placeholder="Search tasks..." style={{ flex: 1, minWidth: 180, padding: '7px 12px', fontSize: 13 }}
            value={filter.search} onChange={e => setFilter(f => ({...f, search: e.target.value}))} />
          <select className="form-select" style={{ width: 140, padding: '7px 12px', fontSize: 13 }}
            value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value}))}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select className="form-select" style={{ width: 140, padding: '7px 12px', fontSize: 13 }}
            value={filter.priority} onChange={e => setFilter(f => ({...f, priority: e.target.value}))}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No tasks found</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  {user?.role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
                  return (
                    <tr key={t.id} style={{ opacity: t.status === 'done' ? 0.7 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isOverdue && <AlertCircle size={14} color="var(--red)" />}
                          <div>
                            <div style={{ fontWeight: 500 }}>{t.title}</div>
                            {t.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.description.slice(0, 50)}{t.description.length > 50 ? '...' : ''}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: 12 }}>{t.projectName || '—'}</td>
                      <td>
                        {t.assigneeName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                              {t.assigneeName[0]}
                            </div>
                            <span style={{ fontSize: 13 }}>{t.assigneeName}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>Unassigned</span>}
                      </td>
                      <td><span className={`badge ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span></td>
                      <td>
                        <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--text)', padding: 0 }}>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td style={{ fontSize: 12, color: isOverdue ? 'var(--red)' : 'var(--text2)' }}>
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                        {isOverdue && ' ⚠'}
                      </td>
                      {user?.role === 'admin' && (
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteTask(t.id)}>Delete</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

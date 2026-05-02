import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Users, CheckSquare } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = () => api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <div className="page-subtitle">{projects.length} projects</div>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No projects yet</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            {user?.role === 'admin' ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {projects.map(p => {
            const pct = p.taskCount ? Math.round((p.completedTasks / p.taskCount) * 100) : 0;
            return (
              <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>by {p.ownerName}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                    {user?.role === 'admin' && (
                      <button className="btn btn-sm" onClick={e => deleteProject(p.id, e)}
                        style={{ padding: '4px 6px', background: 'transparent', color: 'var(--text3)', border: 'none', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {p.description && (
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.description}
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>
                    <span>Progress</span>
                    <span>{p.completedTasks}/{p.taskCount} tasks · {pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} />{p.memberCount} members</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckSquare size={12} />{p.taskCount} tasks</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Project</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input className="form-input" placeholder="e.g. Website Redesign" value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="What's this project about?"
                  value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

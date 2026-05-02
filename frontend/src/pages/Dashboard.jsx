import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, Clock, CheckCircle, PlayCircle, Eye, Circle } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = { todo: 'badge-todo', in_progress: 'badge-in_progress', review: 'badge-review', done: 'badge-done' };
const STATUS_LABEL = { todo: 'Todo', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_BADGE = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="loading">Loading dashboard...</div></div>;
  if (!data) return null;

  const { stats, recentTasks, overdueTasks } = data;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">Welcome back, {user?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <div className="stats-grid mb-24">
        <div className="stat-card purple">
          <div className="stat-label">Projects</div>
          <div className="stat-num">{stats.totalProjects}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-num">{stats.totalTasks}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">My Tasks</div>
          <div className="stat-num">{stats.myTasks}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Done</div>
          <div className="stat-num">{stats.doneTasks}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">In Progress</div>
          <div className="stat-num">{stats.inProgressTasks}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Overdue</div>
          <div className="stat-num">{stats.overdueTasks}</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15 }}>Recent Tasks</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tasks')}>View all</button>
            </div>
            {recentTasks.length === 0 ? (
              <div className="empty"><div>No tasks yet</div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentTasks.map(t => (
                  <div key={t.id} onClick={() => navigate('/tasks')} style={{
                    padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--radius)',
                    border: `1px solid ${t.isOverdue ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'border-color 0.15s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <span className={`badge ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.projectName}</span>
                      {t.assigneeName && <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {t.assigneeName}</span>}
                      {t.isOverdue && <span className="badge badge-overdue" style={{ fontSize: 10 }}>OVERDUE</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Task Status</h3>
            {[
              { label: 'Todo', key: 'todoTasks', color: 'var(--text3)' },
              { label: 'In Progress', key: 'inProgressTasks', color: 'var(--blue)' },
              { label: 'Review', key: 'reviewTasks', color: 'var(--yellow)' },
              { label: 'Done', key: 'doneTasks', color: 'var(--green)' },
            ].map(({ label, key, color }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{stats[key]}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: stats.totalTasks ? `${(stats[key] / stats.totalTasks) * 100}%` : '0%',
                    background: color
                  }} />
                </div>
              </div>
            ))}
          </div>

          {overdueTasks.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(248,113,113,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertCircle size={16} color="var(--red)" />
                <h3 style={{ fontSize: 15, color: 'var(--red)' }}>Overdue Tasks</h3>
              </div>
              {overdueTasks.map(t => (
                <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {t.projectName} · Due {new Date(t.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

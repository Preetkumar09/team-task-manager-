import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password, form.role);
      }
      navigate('/dashboard');
      toast.success('Welcome!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⬡</div>
          <div className="auth-title">TASKFLOW</div>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>Team Task Manager</div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg3)', borderRadius: 10, padding: 4 }}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: tab === t ? 'var(--bg2)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--text2)',
                fontWeight: tab === t ? 600 : 400, fontSize: 13,
                fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s'
              }}>
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handle}>
          {tab === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="John Doe" value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 6 characters" value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
          </div>
          {tab === 'signup' && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: 12, background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
          <strong style={{ color: 'var(--text)' }}>Demo:</strong> admin@demo.com / password123 (Admin) · member@demo.com / password123 (Member)
        </div>
      </div>
    </div>
  );
}

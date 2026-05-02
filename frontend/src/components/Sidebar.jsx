import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    ...(user?.role === 'admin' ? [{ path: '/users', label: 'Users', icon: Users }] : []),
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">⬡ TASKFLOW</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Team Task Manager</div>
      </div>

      <nav className="sidebar-nav">
        {links.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname.startsWith(path) ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <span className={`badge badge-${user?.role}`} style={{ fontSize: 10 }}>{user?.role}</span>
          </div>
        </div>
        <button className="nav-item" onClick={logout}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/org-chart', icon: '🏢', label: 'Sơ đồ tổ chức' },
  { path: '/leave', icon: '📅', label: 'Nghỉ phép' },
  { path: '/recruitment', icon: '🎯', label: 'Tuyển dụng' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <h1>☁ HR Cloud</h1>
        <span>Polyglot Persistence Platform</span>
      </div>
      <div className="sidebar-nav">
        <div className="nav-section-label">Menu chính</div>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            id={`nav-${item.path.replace('/', '')}`}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <div className="nav-section-label" style={{ marginTop: 16 }}>Hệ thống</div>
        <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
          <div>🔐 Identity: :8081</div>
          <div>🏢 Org: :8082</div>
          <div>📅 Leave: :8083</div>
          <div>🎯 Recruit: :8084</div>
        </div>
      </div>
      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.fullName?.[0] || user?.username?.[0] || 'A'}
        </div>
        <div className="user-info" style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.fullName || user?.username}
          </p>
          <span>{user?.role}</span>
        </div>
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}
        >
          ⏻
        </button>
      </div>
    </nav>
  );
}

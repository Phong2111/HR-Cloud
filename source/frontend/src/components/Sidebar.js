import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Tổng quan' },
  { path: '/org-chart', icon: '🏢', label: 'Sơ đồ tổ chức' },
  { path: '/leave', icon: '📅', label: 'Nghỉ phép' },
  { path: '/recruitment', icon: '🎯', label: 'Tuyển dụng' },
];

export default function Sidebar({ theme, onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <h1>HR Cloud</h1>
        <span>Nền tảng quản trị nhân sự đa dịch vụ</span>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section-label">Điều hướng</div>
        {navItems.map((item) => (
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

        <div className="nav-section-label" style={{ marginTop: 16 }}>Giao diện</div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <div className="nav-section-label" style={{ marginTop: 16 }}>Dịch vụ hệ thống</div>
        <div className="sidebar-system">
          <div>🔐 Identity Service: `8081`</div>
          <div>🏢 Organization Service: `8082`</div>
          <div>📅 Leave Service: `8083`</div>
          <div>🎯 Recruitment Service: `8084`</div>
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
          <span>{user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role}</span>
        </div>
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="icon-button"
        >
          ⏻
        </button>
      </div>
    </nav>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage({ theme, onToggleTheme }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg" />
      <div className="login-card">
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <span className="theme-pill">Hệ thống nhân sự số</span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>

        <div className="login-logo">
          <h1>HR Cloud</h1>
          <p>Nền tảng quản trị nhân sự hiện đại cho doanh nghiệp nhiều phòng ban.</p>
        </div>

        {error && <div className="login-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              className="form-input"
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              id="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              className="form-input"
              type="password"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              id="password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            id="btn-login"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '16px', background: 'var(--surface-muted)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>TÀI KHOẢN MẶC ĐỊNH</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tên đăng nhập: <strong>admin</strong></p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Mật khẩu: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
}

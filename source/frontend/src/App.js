import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrgChartPage from './pages/OrgChartPage';
import LeavePage from './pages/LeavePage';
import RecruitmentPage from './pages/RecruitmentPage';
import './index.css';

const THEME_STORAGE_KEY = 'hrcloud-theme';

function ProtectedLayout({ children, theme, onToggleTheme }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar theme={theme} onToggleTheme={onToggleTheme} />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes({ theme, onToggleTheme }) {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage theme={theme} onToggleTheme={onToggleTheme} />}
      />
      <Route
        path="/dashboard"
        element={<ProtectedLayout theme={theme} onToggleTheme={onToggleTheme}><DashboardPage theme={theme} onToggleTheme={onToggleTheme} /></ProtectedLayout>}
      />
      <Route
        path="/org-chart"
        element={<ProtectedLayout theme={theme} onToggleTheme={onToggleTheme}><OrgChartPage theme={theme} onToggleTheme={onToggleTheme} /></ProtectedLayout>}
      />
      <Route
        path="/leave"
        element={<ProtectedLayout theme={theme} onToggleTheme={onToggleTheme}><LeavePage theme={theme} onToggleTheme={onToggleTheme} /></ProtectedLayout>}
      />
      <Route
        path="/recruitment"
        element={<ProtectedLayout theme={theme} onToggleTheme={onToggleTheme}><RecruitmentPage theme={theme} onToggleTheme={onToggleTheme} /></ProtectedLayout>}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes theme={theme} onToggleTheme={handleToggleTheme} />
      </AuthProvider>
    </BrowserRouter>
  );
}

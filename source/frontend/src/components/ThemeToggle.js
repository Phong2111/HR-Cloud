import React from 'react';

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="btn btn-outline theme-toggle"
      onClick={onToggle}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
    >
      <span>{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Chế độ tối' : 'Chế độ sáng'}</span>
    </button>
  );
}

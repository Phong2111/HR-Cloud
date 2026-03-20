import React, { useState, useEffect } from 'react';
import { orgService, leaveService, recruitService } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orgService.getDashboardStats().catch(() => null),
      leaveService.getAllLeaves().catch(() => ({ data: [] })),
      recruitService.getCandidates().catch(() => ({ data: [] })),
    ]).then(([statsRes, leavesRes, candidatesRes]) => {
      setStats(statsRes?.data);
      setLeaves(leavesRes?.data || []);
      setCandidates(candidatesRes?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải...</div>;

  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
  const pendingCandidates = candidates.filter(c => c.status === 'PENDING').length;

  return (
    <div>
      <div className="page-header">
        <h2>📊 Dashboard Tổng quan</h2>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>HR Cloud Platform v1.0</span>
      </div>
      <div className="page-body">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">👥</div>
            <div>
              <div className="stat-value">{stats?.totalEmployees ?? '-'}</div>
              <div className="stat-label">Tổng nhân viên</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div>
              <div className="stat-value">{approvedLeaves}</div>
              <div className="stat-label">Nghỉ phép đã duyệt</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">📋</div>
            <div>
              <div className="stat-value">{pendingCandidates}</div>
              <div className="stat-label">Ứng viên đang chờ</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">💰</div>
            <div>
              <div className="stat-value">
                {stats?.totalPayroll ? `${(stats.totalPayroll / 1000000).toFixed(1)}M` : '-'}
              </div>
              <div className="stat-label">Tổng lương/tháng</div>
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Recent Leaves */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📅 Nghỉ phép gần đây</h3>
            </div>
            {leaves.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Staff ID</th>
                      <th>Ngày</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.slice(0, 5).map(l => (
                      <tr key={l.id}>
                        <td>#{l.staffId}</td>
                        <td>{l.days} ngày</td>
                        <td>
                          <span className={`badge ${l.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="icon">📅</div>
                <p>Chưa có đơn nghỉ phép</p>
              </div>
            )}
          </div>

          {/* Candidates */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🎯 Ứng viên mới nhất</h3>
            </div>
            {candidates.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Ứng viên</th>
                      <th>Vị trí</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.slice(0, 5).map(c => (
                      <tr key={c.id}>
                        <td>{c.fullName}</td>
                        <td>{c.position}</td>
                        <td>
                          <span className={`badge ${
                            c.status === 'HIRED' ? 'badge-success' :
                            c.status === 'REJECTED' ? 'badge-danger' :
                            c.status === 'INTERVIEWING' ? 'badge-warning' :
                            'badge-info'
                          }`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="icon">🎯</div>
                <p>Chưa có ứng viên</p>
              </div>
            )}
          </div>
        </div>

        {/* Architecture Info Card */}
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">🏗 Kiến trúc hệ thống</h3>
          </div>
          <div className="grid-3" style={{ marginTop: 8 }}>
            {[
              { icon: '🔐', name: 'Identity Service', port: '8081', tech: 'Spring Boot + JWT + SQL Server', desc: 'Xác thực & phân quyền RBAC' },
              { icon: '🏢', name: 'Organization Service', port: '8082', tech: 'Spring Boot + Recursive CTE', desc: 'Nhân viên & Sơ đồ tổ chức' },
              { icon: '📅', name: 'Leave Service', port: '8083', tech: 'Spring Boot + Stored Procedure', desc: 'Nghỉ phép ACID atomic' },
              { icon: '🎯', name: 'Recruitment Service', port: '8084', tech: 'Spring Boot + MongoDB', desc: 'Aggregation Pipeline ứng viên' },
            ].map(s => (
              <div key={s.port} style={{ padding: '16px', background: 'rgba(99,102,241,0.05)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.15)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                <div style={{ color: 'var(--primary)', fontSize: 12, marginBottom: 4 }}>Port {s.port}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0' }}>{s.tech}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

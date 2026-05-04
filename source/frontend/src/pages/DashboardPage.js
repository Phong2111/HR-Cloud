import React, { useEffect, useState } from 'react';
import { orgService, leaveService, recruitService } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

export default function DashboardPage({ theme, onToggleTheme }) {
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

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải dữ liệu...</div>;

  const approvedLeaves = leaves.filter((leave) => leave.status === 'Approved').length;
  const pendingCandidates = candidates.filter((candidate) => candidate.status === 'PENDING').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📊 Tổng quan hệ thống</h2>
          <div className="page-note">Theo dõi nhanh nhân sự, nghỉ phép và tuyển dụng trên một màn hình.</div>
        </div>
        <div className="page-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <span className="theme-pill">Phiên bản 1.0</span>
        </div>
      </div>

      <div className="page-body">
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
              <div className="stat-label">Đơn nghỉ phép đã duyệt</div>
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
              <div className="stat-label">Tổng lương mỗi tháng</div>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📅 Nghỉ phép gần đây</h3>
            </div>
            {leaves.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Mã nhân viên</th>
                      <th>Số ngày</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.slice(0, 5).map((leave) => (
                      <tr key={leave.id}>
                        <td>#{leave.staffId}</td>
                        <td>{leave.days} ngày</td>
                        <td>
                          <span className={`badge ${leave.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>
                            {leave.status === 'Approved' ? 'Đã duyệt' : leave.status}
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
                <p>Chưa có đơn nghỉ phép nào.</p>
              </div>
            )}
          </div>

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
                    {candidates.slice(0, 5).map((candidate) => (
                      <tr key={candidate.id}>
                        <td>{candidate.fullName}</td>
                        <td>{candidate.position}</td>
                        <td>
                          <span className={`badge ${
                            candidate.status === 'HIRED' ? 'badge-success'
                              : candidate.status === 'REJECTED' ? 'badge-danger'
                                : candidate.status === 'INTERVIEWING' ? 'badge-warning'
                                  : 'badge-info'
                          }`}
                          >
                            {candidate.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="icon">🎯</div>
                <p>Chưa có ứng viên trong hệ thống.</p>
              </div>
            )}
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">🏗 Kiến trúc hệ thống</h3>
            <span className="section-caption">Mỗi dịch vụ phụ trách một nghiệp vụ riêng và giao tiếp qua API.</span>
          </div>
          <div className="grid-3" style={{ marginTop: 8 }}>
            {[
              { icon: '🔐', name: 'Identity Service', port: '8081', tech: 'Spring Boot + JWT + SQL Server', desc: 'Xác thực người dùng và phân quyền truy cập.' },
              { icon: '🏢', name: 'Organization Service', port: '8082', tech: 'Spring Boot + Recursive CTE', desc: 'Quản lý nhân viên, phòng ban và sơ đồ tổ chức.' },
              { icon: '📅', name: 'Leave Service', port: '8083', tech: 'Spring Boot + Stored Procedure', desc: 'Xử lý nghỉ phép theo cơ chế ACID an toàn.' },
              { icon: '🎯', name: 'Recruitment Service', port: '8084', tech: 'Spring Boot + MongoDB', desc: 'Quản lý ứng viên, CV và tìm kiếm tổng hợp.' },
            ].map((service) => (
              <div key={service.port} style={{ padding: '18px', background: 'var(--surface-muted)', borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{service.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{service.name}</div>
                <div style={{ color: 'var(--primary)', fontSize: 12, marginBottom: 6 }}>Cổng {service.port}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0' }}>{service.tech}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{service.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

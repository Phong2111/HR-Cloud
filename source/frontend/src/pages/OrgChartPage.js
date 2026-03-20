import React, { useState, useEffect } from 'react';
import { orgService } from '../services/api';

function OrgNode({ node, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const levelColors = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--secondary)'];
  const color = levelColors[level % levelColors.length];

  return (
    <div className={`org-node org-level-${level}`} style={{ marginTop: level === 0 ? 0 : 8 }}>
      <div
        className="org-node-content"
        onClick={() => node.children?.length > 0 && setExpanded(!expanded)}
        style={{ borderColor: color, borderLeftWidth: 3 }}
      >
        <span style={{ fontSize: 18 }}>
          {node.children?.length > 0 ? (expanded ? '▼' : '▶') : '○'}
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{node.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            ID: {node.id} · Lương: {node.salary?.toLocaleString()} · Nghỉ phép: {node.leaveBalance} ngày
          </div>
        </div>
        <span className="badge" style={{ marginLeft: 'auto', background: `${color}20`, color }}>
          Cấp {node.level}
        </span>
      </div>
      {expanded && node.children?.length > 0 && (
        <div className="org-node-children">
          {node.children.map(child => (
            <OrgNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const [orgChart, setOrgChart] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', managerId: '', salary: '', leaveBalance: 15 });
  const [message, setMessage] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chartRes, staffRes] = await Promise.all([
        orgService.getOrgChart(),
        orgService.getStaff(),
      ]);
      setOrgChart(chartRes.data);
      setStaff(staffRes.data);
    } catch (e) {
      setMessage({ type: 'error', text: 'Không thể tải dữ liệu tổ chức' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await orgService.createStaff({
        id: parseInt(form.id),
        name: form.name,
        managerId: form.managerId ? parseInt(form.managerId) : null,
        salary: parseInt(form.salary),
        leaveBalance: parseInt(form.leaveBalance),
      });
      setMessage({ type: 'success', text: 'Thêm nhân viên thành công!' });
      setShowModal(false);
      setForm({ id: '', name: '', managerId: '', salary: '', leaveBalance: 15 });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Lỗi khi thêm nhân viên' });
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>🏢 Sơ đồ tổ chức (Org Chart)</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-staff">
          + Thêm nhân viên
        </button>
      </div>
      <div className="page-body">
        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.text}
          </div>
        )}

        <div className="grid-2">
          {/* Org Tree */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
              <h3 className="card-title">📊 Sơ đồ phân cấp (Recursive CTE)</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Kết quả từ WITH OrgChart AS (Recursive CTE)
              </span>
            </div>
            <div className="org-tree" style={{ padding: '8px 0' }}>
              {orgChart.length > 0 ? (
                orgChart.map(node => <OrgNode key={node.id} node={node} level={0} />)
              ) : (
                <div className="empty-state">
                  <div className="icon">🏢</div>
                  <h3>Chưa có dữ liệu tổ chức</h3>
                  <p>Thêm nhân viên để xây dựng sơ đồ</p>
                </div>
              )}
            </div>
          </div>

          {/* Staff Table */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
              <h3 className="card-title">👥 Danh sách nhân viên ({staff.length})</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Quản lý</th>
                    <th>Lương</th>
                    <th>Ngày phép còn</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(s => {
                    const manager = staff.find(m => m.id === s.managerId);
                    return (
                      <tr key={s.id}>
                        <td><span className="badge badge-purple">#{s.id}</span></td>
                        <td><strong>{s.name}</strong></td>
                        <td>{manager ? manager.name : <span className="badge badge-info">CEO</span>}</td>
                        <td>{s.salary?.toLocaleString()} VNĐ</td>
                        <td>
                          <span className={`badge ${s.leaveBalance > 10 ? 'badge-success' : s.leaveBalance > 5 ? 'badge-warning' : 'badge-danger'}`}>
                            {s.leaveBalance} ngày
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={async () => {
                              if (window.confirm(`Xóa nhân viên ${s.name}?`)) {
                                await orgService.deleteStaff(s.id);
                                fetchData();
                              }
                            }}
                          >
                            🗑 Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Thêm nhân viên mới</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">ID nhân viên *</label>
                  <input className="form-input" type="number" value={form.id}
                    onChange={e => setForm({...form, id: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên nhân viên *</label>
                  <input className="form-input" type="text" value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Quản lý (ID)</label>
                  <select className="form-input" value={form.managerId}
                    onChange={e => setForm({...form, managerId: e.target.value})}>
                    <option value="">-- Cấp cao nhất (CEO) --</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name} (#{s.id})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Lương (VNĐ) *</label>
                  <input className="form-input" type="number" value={form.salary}
                    onChange={e => setForm({...form, salary: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày phép</label>
                  <input className="form-input" type="number" value={form.leaveBalance}
                    onChange={e => setForm({...form, leaveBalance: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary">✓ Lưu nhân viên</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

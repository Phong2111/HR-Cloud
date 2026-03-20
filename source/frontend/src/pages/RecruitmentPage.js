import React, { useState, useEffect } from 'react';
import { recruitService } from '../services/api';

const STATUS_COLORS = {
  PENDING: 'badge-info',
  INTERVIEWING: 'badge-warning',
  HIRED: 'badge-success',
  REJECTED: 'badge-danger',
};

const POSITIONS = [
  'Backend Developer',
  'Frontend Developer',
  'Fullstack Developer',
  'DevOps Engineer',
  'Data Engineer',
  'Data Analyst',
  'QA Engineer',
  'Product Manager',
  'HR Manager',
  'Business Analyst',
  'UI/UX Designer',
  'Mobile Developer',
];

const SKILLS_OPTIONS = [
  'Java', 'Spring Boot', 'Spring Security', 'Hibernate',
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular',
  'Node.js', 'Python', 'Django', 'FastAPI',
  'SQL Server', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
  'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Azure',
  'REST API', 'GraphQL', 'Microservices',
  'Git', 'Linux', 'Agile/Scrum',
];

function SkillsMultiSelect({ selected, onChange }) {
  const [open, setOpen] = useState(false);

  const toggle = (skill) => {
    if (selected.includes(skill)) {
      onChange(selected.filter(s => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="form-input"
        style={{
          minHeight: 42, cursor: 'pointer', display: 'flex', flexWrap: 'wrap',
          gap: 4, alignItems: 'center', userSelect: 'none',
        }}
        onClick={() => setOpen(o => !o)}
      >
        {selected.length === 0
          ? <span style={{ color: 'var(--text-muted)' }}>Chọn kỹ năng...</span>
          : selected.map(s => (
            <span key={s} className="tag" style={{ fontSize: 11, padding: '2px 8px' }}>
              {s}
              <span
                style={{ marginLeft: 4, fontWeight: 700, cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); toggle(s); }}
              >×</span>
            </span>
          ))
        }
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1001,
          background: 'var(--dark-card)', border: '1px solid var(--primary)',
          borderRadius: 12, padding: '12px', maxHeight: 250, overflowY: 'auto',
          boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
          marginTop: 8,
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SKILLS_OPTIONS.map(skill => {
              const checked = selected.includes(skill);
              return (
                <label key={skill} style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '6px 14px', borderRadius: 20, fontSize: 13,
                  background: checked ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${checked ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                  color: checked ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                  fontWeight: checked ? '600' : '400',
                }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(skill)}
                    style={{ display: 'none' }}
                  />
                  {checked ? '✓ ' : ''}{skill}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecruitmentPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [message, setMessage] = useState(null);
  const [searchParams, setSearchParams] = useState({ skills: [], minExp: '', position: '' });

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', position: '',
    yearsExperience: '', skills: [], cvUrl: '',
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await recruitService.getCandidates();
      setCandidates(res.data);
    } catch (e) {
      setMessage({ type: 'error', text: 'Không thể tải danh sách ứng viên' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchParams.skills.length > 0) params.skills = searchParams.skills.join(',');
      if (searchParams.minExp) params.minExp = parseInt(searchParams.minExp);
      if (searchParams.position) params.position = searchParams.position;
      const res = await recruitService.searchCandidates(params);
      setCandidates(res.data);
    } catch (e) {
      setMessage({ type: 'error', text: 'Lỗi tìm kiếm' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await recruitService.createCandidate({
        ...form,
        yearsExperience: parseInt(form.yearsExperience) || 0,
      });
      setMessage({ type: 'success', text: 'Thêm ứng viên thành công!' });
      setShowModal(false);
      setForm({ fullName: '', email: '', phone: '', position: '', yearsExperience: '', skills: [], cvUrl: '' });
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi khi thêm ứng viên' });
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await recruitService.updateStatus(id, status);
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi cập nhật trạng thái' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa ứng viên này?')) return;
    try {
      await recruitService.deleteCandidate(id);
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi xóa ứng viên' });
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>🎯 Tuyển dụng - Hồ sơ ứng viên</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-candidate">
          + Thêm ứng viên
        </button>
      </div>
      <div className="page-body">
        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.text}
          </div>
        )}

        {/* Search - MongoDB Aggregation Pipeline */}
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title">🔍 Tìm kiếm (MongoDB Aggregation Pipeline)</h3>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, minWidth: 220, marginBottom: 0 }}>
              <label className="form-label">Kỹ năng</label>
              <SkillsMultiSelect
                selected={searchParams.skills}
                onChange={v => setSearchParams({ ...searchParams, skills: v })}
              />
            </div>
            <div className="form-group" style={{ width: 150, marginBottom: 0 }}>
              <label className="form-label">Kinh nghiệm tối thiểu</label>
              <input className="form-input" type="number" placeholder="1"
                value={searchParams.minExp}
                onChange={e => setSearchParams({ ...searchParams, minExp: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
              <label className="form-label">Vị trí</label>
              <select className="form-input" value={searchParams.position}
                onChange={e => setSearchParams({ ...searchParams, position: e.target.value })}>
                <option value="">-- Tất cả --</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSearch} id="btn-search">🔍 Tìm</button>
              <button className="btn btn-outline" onClick={() => { setSearchParams({ skills: [], minExp: '', position: '' }); fetchAll(); }}>↺ Reset</button>
            </div>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Ứng viên ({candidates.length})</h3>
          </div>
          {candidates.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ứng viên</th>
                    <th>Email</th>
                    <th>Vị trí</th>
                    <th>Kinh nghiệm</th>
                    <th>Kỹ năng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id}>
                      <td>
                        <strong
                          style={{ cursor: 'pointer', color: 'var(--primary)' }}
                          onClick={() => setSelectedCandidate(c)}
                        >{c.fullName}</strong>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{c.email}</td>
                      <td><span className="tag" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}>{c.position}</span></td>
                      <td>{c.yearsExperience} năm</td>
                      <td>
                        <div className="tags">
                          {(c.skills || []).slice(0, 3).map(s => <span key={s} className="tag">{s}</span>)}
                          {(c.skills || []).length > 3 && <span className="tag">+{c.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td>
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                          value={c.status}
                          onChange={e => handleStatusChange(c.id, e.target.value)}
                        >
                          {['PENDING', 'INTERVIEWING', 'HIRED', 'REJECTED'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">🎯</div>
              <h3>Không tìm thấy ứng viên</h3>
              <p>Thay đổi bộ lọc hoặc thêm ứng viên mới</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Thêm ứng viên mới</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Họ tên *</label>
                  <input className="form-input" value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Điện thoại</label>
                  <input className="form-input" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vị trí ứng tuyển *</label>
                  <select className="form-input" value={form.position}
                    onChange={e => setForm({ ...form, position: e.target.value })} required>
                    <option value="">-- Chọn vị trí --</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Số năm kinh nghiệm</label>
                  <input className="form-input" type="number" min="0" max="30" value={form.yearsExperience}
                    onChange={e => setForm({ ...form, yearsExperience: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Kỹ năng</label>
                  <SkillsMultiSelect
                    selected={form.skills}
                    onChange={v => setForm({ ...form, skills: v })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary">✓ Lưu ứng viên</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="modal-backdrop" onClick={() => setSelectedCandidate(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">👤 {selectedCandidate.fullName}</h3>
              <button className="modal-close" onClick={() => setSelectedCandidate(null)}>✕</button>
            </div>
            <div>
              <p><strong>Email:</strong> {selectedCandidate.email}</p>
              <p><strong>Điện thoại:</strong> {selectedCandidate.phone}</p>
              <p><strong>Vị trí:</strong> <span className="tag" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)' }}>{selectedCandidate.position}</span></p>
              <p><strong>Kinh nghiệm:</strong> {selectedCandidate.yearsExperience} năm</p>
              <div className="mt-4">
                <strong>Kỹ năng:</strong>
                <div className="tags mt-4">
                  {(selectedCandidate.skills || []).map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <span className={`badge ${STATUS_COLORS[selectedCandidate.status]}`} style={{ fontSize: 13, padding: '6px 14px' }}>
                  {selectedCandidate.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

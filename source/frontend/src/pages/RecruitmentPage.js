import React, { useState, useEffect } from 'react';
import { recruitService } from '../services/api';

const STATUS_COLORS = {
  PENDING: 'badge-info',
  INTERVIEWING: 'badge-warning',
  HIRED: 'badge-success',
  REJECTED: 'badge-danger',
};

export default function RecruitmentPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [message, setMessage] = useState(null);
  const [searchParams, setSearchParams] = useState({ skills: '', minExp: '', position: '' });

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', position: '',
    yearsExperience: '', skills: '', certifications: '', cvUrl: '',
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
      if (searchParams.skills) params.skills = searchParams.skills.split(',').map(s => s.trim());
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
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        certifications: form.certifications.split(',').map(s => s.trim()).filter(Boolean),
      });
      setMessage({ type: 'success', text: 'Thêm ứng viên thành công!' });
      setShowModal(false);
      setForm({ fullName: '', email: '', phone: '', position: '', yearsExperience: '', skills: '', certifications: '', cvUrl: '' });
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
            <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
              <label className="form-label">Kỹ năng (cách nhau dấu phẩy)</label>
              <input className="form-input" placeholder="Java, Spring Boot, SQL"
                value={searchParams.skills}
                onChange={e => setSearchParams({ ...searchParams, skills: e.target.value })} />
            </div>
            <div className="form-group" style={{ width: 140, marginBottom: 0 }}>
              <label className="form-label">Kinh nghiệm tối thiểu</label>
              <input className="form-input" type="number" placeholder="1"
                value={searchParams.minExp}
                onChange={e => setSearchParams({ ...searchParams, minExp: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
              <label className="form-label">Vị trí</label>
              <input className="form-input" placeholder="Backend, Frontend..."
                value={searchParams.position}
                onChange={e => setSearchParams({ ...searchParams, position: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSearch} id="btn-search">🔍 Tìm</button>
              <button className="btn btn-outline" onClick={fetchAll}>↺ Reset</button>
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
                      <td>{c.position}</td>
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Thêm ứng viên mới</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Họ tên *</label>
                  <input className="form-input" value={form.fullName}
                    onChange={e => setForm({...form, fullName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Điện thoại</label>
                  <input className="form-input" value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vị trí ứng tuyển</label>
                  <input className="form-input" value={form.position}
                    onChange={e => setForm({...form, position: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Số năm kinh nghiệm</label>
                  <input className="form-input" type="number" value={form.yearsExperience}
                    onChange={e => setForm({...form, yearsExperience: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kỹ năng (cách nhau dấu phẩy)</label>
                  <input className="form-input" value={form.skills} placeholder="Java, Spring Boot, SQL"
                    onChange={e => setForm({...form, skills: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Chứng chỉ</label>
                  <input className="form-input" value={form.certifications} placeholder="AWS, Oracle, ..."
                    onChange={e => setForm({...form, certifications: e.target.value})} />
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
              <p><strong>Vị trí:</strong> {selectedCandidate.position}</p>
              <p><strong>Kinh nghiệm:</strong> {selectedCandidate.yearsExperience} năm</p>
              <div className="mt-4">
                <strong>Kỹ năng:</strong>
                <div className="tags mt-4">
                  {(selectedCandidate.skills || []).map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              </div>
              {selectedCandidate.certifications?.length > 0 && (
                <div className="mt-4">
                  <strong>Chứng chỉ:</strong>
                  <div className="tags mt-4">
                    {selectedCandidate.certifications.map(c => <span key={c} className="tag" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{c}</span>)}
                  </div>
                </div>
              )}
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

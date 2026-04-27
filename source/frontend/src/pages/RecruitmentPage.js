import React, { useState, useEffect, useRef } from 'react';
import { orgService, recruitService } from '../services/api';

const STATUS_COLORS = {
  PENDING: 'badge-info',
  INTERVIEWING: 'badge-warning',
  HIRED: 'badge-success',
  REJECTED: 'badge-danger',
};

const STATUSES = ['PENDING', 'INTERVIEWING', 'HIRED', 'REJECTED'];

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Retail',
  'Logistics',
  'Hospitality',
];

const POSITIONS_BY_INDUSTRY = {
  Technology: [
    'Backend Developer',
    'Frontend Developer',
    'Fullstack Developer',
    'DevOps Engineer',
    'Data Engineer',
    'QA Engineer',
    'Product Manager',
  ],
  Finance: [
    'Financial Analyst',
    'Credit Risk Specialist',
    'Internal Auditor',
    'Investment Associate',
    'Compliance Officer',
  ],
  Healthcare: [
    'Healthcare Operations Specialist',
    'Medical Sales Executive',
    'Clinical Data Coordinator',
    'Patient Service Manager',
  ],
  Education: [
    'Training Specialist',
    'Academic Advisor',
    'Program Coordinator',
    'Education Consultant',
  ],
  Manufacturing: [
    'Production Supervisor',
    'Supply Chain Planner',
    'Quality Control Engineer',
    'Maintenance Manager',
  ],
  Retail: [
    'Store Manager',
    'Category Executive',
    'Merchandising Specialist',
    'E-commerce Operations Specialist',
  ],
  Logistics: [
    'Logistics Coordinator',
    'Warehouse Supervisor',
    'Procurement Specialist',
    'Transportation Planner',
  ],
  Hospitality: [
    'Guest Relations Manager',
    'Food and Beverage Supervisor',
    'Event Coordinator',
    'Hotel Operations Executive',
  ],
};

const ALL_POSITIONS = Array.from(
  new Set(Object.values(POSITIONS_BY_INDUSTRY).flat()),
).sort();

const SKILLS_BY_INDUSTRY = {
  Technology: [
    'Java', 'Spring Boot', 'JavaScript', 'TypeScript', 'React', 'Node.js',
    'SQL Server', 'MongoDB', 'Docker', 'Kubernetes', 'REST API', 'Microservices',
  ],
  Finance: [
    'Financial Reporting', 'Risk Analysis', 'Compliance', 'Data Analysis', 'Excel',
    'SQL', 'Communication', 'Problem Solving',
  ],
  Healthcare: [
    'Healthcare Operations', 'Patient Service', 'Compliance', 'Clinical Data',
    'Medical Terminology', 'Communication',
  ],
  Education: [
    'Curriculum Design', 'Training Delivery', 'Assessment', 'Presentation',
    'Classroom Management', 'Communication',
  ],
  Manufacturing: [
    'Quality Control', 'Lean Manufacturing', 'Supply Chain', 'Inventory Management',
    'Root Cause Analysis', 'Safety Compliance',
  ],
  Retail: [
    'Customer Service', 'Merchandising', 'Sales Planning', 'Inventory Management',
    'E-commerce Operations', 'Communication',
  ],
  Logistics: [
    'Supply Chain', 'Procurement', 'Warehouse Management', 'Transportation Planning',
    'Inventory Management', 'Data Analysis',
  ],
  Hospitality: [
    'Guest Service', 'Event Coordination', 'Operations Management',
    'Food and Beverage', 'Communication', 'Problem Solving',
  ],
};

const ALL_SKILLS_OPTIONS = Array.from(
  new Set(Object.values(SKILLS_BY_INDUSTRY).flat()),
).sort();

const getPositionOptions = (industry) => {
  if (!industry) return ALL_POSITIONS;
  return POSITIONS_BY_INDUSTRY[industry] || ALL_POSITIONS;
};

const getSkillOptions = (industry) => {
  if (!industry) return ALL_SKILLS_OPTIONS;
  return SKILLS_BY_INDUSTRY[industry] || ALL_SKILLS_OPTIONS;
};

const getErrorText = (error, fallback) => (
  error?.response?.data?.error
  || error?.response?.data?.message
  || fallback
);

function SkillsMultiSelect({ selected, onChange, options }) {
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
            {options.map(skill => {
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
  const [orgStaff, setOrgStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingCandidateId, setEditingCandidateId] = useState(null);
  const [hiringCandidate, setHiringCandidate] = useState(null);
  const [hiringLoading, setHiringLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pendingStatuses, setPendingStatuses] = useState({});
  const [searchParams, setSearchParams] = useState({
    skills: [],
    minExp: '',
    position: '',
    status: '',
    industry: '',
  });
  const [hireForm, setHireForm] = useState({
    assignedDepartment: '',
    assignedRole: '',
    managerId: '',
    salary: '5000',
    leaveBalance: '15',
  });
  
  // AI Progress states
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, filename: '' });
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', industry: '', position: '',
    yearsExperience: '', skills: [], cvUrl: '',
  });

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setForm({ fullName: '', email: '', phone: '', industry: '', position: '', yearsExperience: '', skills: [], cvUrl: '' });
  };

  const fetchOrganizationStaff = async () => {
    const res = await orgService.getStaff();
    const members = res.data || [];
    setOrgStaff(members);
    return members;
  };

  const openCreateModal = () => {
    resetForm();
    setFormMode('create');
    setEditingCandidateId(null);
    setShowModal(true);
  };

  const openCandidateDetail = async (id) => {
    setDetailLoading(true);
    setMessage(null);
    try {
      const res = await recruitService.getCandidateById(id);
      setSelectedCandidate(res.data);
    } catch (e) {
      setMessage({ type: 'error', text: 'Không thể tải chi tiết ứng viên' });
    } finally {
      setDetailLoading(false);
    }
  };

  const openEditModal = async (id) => {
    setMessage(null);
    try {
      const res = await recruitService.getCandidateById(id);
      const candidate = res.data;
      setForm({
        fullName: candidate.fullName || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        industry: candidate.industry || '',
        position: candidate.position || '',
        yearsExperience: candidate.yearsExperience?.toString() || '',
        skills: candidate.skills || [],
        cvUrl: candidate.cvUrl || '',
      });
      setFormMode('edit');
      setEditingCandidateId(candidate.id);
      setShowModal(true);
    } catch (e) {
      setMessage({ type: 'error', text: 'Không thể tải hồ sơ để chỉnh sửa' });
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await recruitService.getCandidates();
      const rows = res.data || [];
      setCandidates(rows);
      setPendingStatuses(Object.fromEntries(rows.map((row) => [row.id, row.status])));
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
      if (searchParams.status) params.status = searchParams.status;
      if (searchParams.industry) params.industry = searchParams.industry;
      const res = await recruitService.searchCandidates(params);
      const rows = res.data || [];
      setCandidates(rows);
      setPendingStatuses(Object.fromEntries(rows.map((row) => [row.id, row.status])));
    } catch (e) {
      setMessage({ type: 'error', text: 'Lỗi tìm kiếm' });
    } finally {
      setLoading(false);
    }
  };

  const handlePendingStatusChange = (candidateId, nextStatus) => {
    setPendingStatuses({ ...pendingStatuses, [candidateId]: nextStatus });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingFiles(true);
    setUploadProgress({ current: 0, total: files.length, filename: '' });
    
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length, filename: file.name });
      try {
        const formData = new FormData();
        formData.append('file', file);
        await recruitService.uploadCv(formData);
        successCount++;
      } catch (err) {
        console.error('Lỗi upload file: ', file.name, err);
      }
    }
    
    setUploadingFiles(false);
    setMessage({ type: 'success', text: `Đã import và phân tích thành công ${successCount}/${files.length} hồ sơ` });
    fetchAll();
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        yearsExperience: parseInt(form.yearsExperience) || 0,
      };

      if (formMode === 'edit' && editingCandidateId) {
        await recruitService.updateCandidate(editingCandidateId, payload);
        setMessage({ type: 'success', text: 'Cập nhật ứng viên thành công!' });
      } else {
        await recruitService.createCandidate(payload);
        setMessage({ type: 'success', text: 'Thêm ứng viên thành công!' });
      }

      setShowModal(false);
      resetForm();
      setFormMode('create');
      setEditingCandidateId(null);
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorText(err, 'Lỗi khi lưu ứng viên') });
    }
  };

  const handleStatusChange = async (candidate, status) => {
    if (candidate.status === status) return;

    if (status === 'HIRED') {
      setMessage(null);
      setHiringCandidate(candidate);
      setHireForm({
        assignedDepartment: candidate.assignedDepartment || 'General',
        assignedRole: candidate.assignedRole || candidate.position || '',
        managerId: candidate.assignedManagerId?.toString() || '',
        salary: '5000',
        leaveBalance: '15',
      });
      setShowHireModal(true);
      try {
        await fetchOrganizationStaff();
      } catch (error) {
        setMessage({ type: 'error', text: getErrorText(error, 'Không thể tải dữ liệu nhân sự để gán cấp quản lý') });
      }
      return;
    }

    try {
      await recruitService.updateStatus(candidate.id, status);
      setMessage({ type: 'success', text: `Đã cập nhật trạng thái ${status}` });
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorText(err, 'Lỗi cập nhật trạng thái') });
    }
  };

  const handleConfirmHire = async (e) => {
    e.preventDefault();
    if (!hiringCandidate) return;

    if (!hireForm.assignedDepartment || !hireForm.assignedRole) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đủ phòng ban và vai trò trước khi chuyển trạng thái HIRED' });
      return;
    }

    setHiringLoading(true);
    let createdStaffId = null;

    try {
      const staffList = orgStaff.length > 0 ? orgStaff : await fetchOrganizationStaff();
      const nextId = staffList.length > 0
        ? Math.max(...staffList.map((member) => Number(member.id) || 0)) + 1
        : 1;

      const managerId = hireForm.managerId ? parseInt(hireForm.managerId, 10) : null;
      const salary = parseInt(hireForm.salary, 10) || 5000;
      const leaveBalance = parseInt(hireForm.leaveBalance, 10) || 15;

      await orgService.createStaff({
        id: nextId,
        name: hiringCandidate.fullName,
        managerId,
        salary,
        leaveBalance,
        department: hireForm.assignedDepartment,
        roleTitle: hireForm.assignedRole,
      });

      createdStaffId = nextId;

      await recruitService.updateStatus(hiringCandidate.id, 'HIRED', {
        assignedRole: hireForm.assignedRole,
        assignedDepartment: hireForm.assignedDepartment,
        assignedManagerId: managerId,
      });

      setShowHireModal(false);
      setHiringCandidate(null);
      setMessage({ type: 'success', text: 'Đã chuyển HIRED và thêm ứng viên vào sơ đồ tổ chức' });
      fetchAll();
      fetchOrganizationStaff();
    } catch (err) {
      if (createdStaffId !== null) {
        try {
          await orgService.deleteStaff(createdStaffId);
        } catch (_) {
          // Keep original error and avoid masking it with rollback error.
        }
      }
      setMessage({ type: 'error', text: getErrorText(err, 'Lỗi khi tuyển dụng và thêm vào sơ đồ tổ chức') });
    } finally {
      setHiringLoading(false);
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
        <button className="btn btn-primary" onClick={openCreateModal} id="btn-add-candidate">
          + Thêm ứng viên
        </button>
      </div>
      <div className="page-body">
        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.text}
          </div>
        )}

        {/* AI Learning Progress Box */}
        {uploadingFiles && (
          <div className="card mb-4" style={{ border: '2px solid var(--primary)', background: 'rgba(99,102,241,0.05)' }}>
            <div className="card-body" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div className="spinner" style={{ width: 30, height: 30, borderWidth: 3 }}></div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)' }}>🤖 AI đang học CV: {uploadProgress.current}/{uploadProgress.total} file...</h4>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Đang phân tích: <strong>{uploadProgress.filename}</strong></div>
                <div style={{ background: 'var(--border)', height: 6, borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ 
                    background: 'var(--primary)', 
                    height: '100%', 
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search - MongoDB Aggregation Pipeline */}
        <div className="card mb-4">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">🔍 Tìm kiếm (MongoDB Aggregation Pipeline)</h3>
            
            {/* Import PDF Button */}
            <div>
              <input 
                type="file" 
                multiple 
                accept=".pdf" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                style={{ display: 'none' }} 
              />
              <button 
                className="btn btn-outline" 
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                Import Hồ sơ PDF
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, minWidth: 220, marginBottom: 0 }}>
              <label className="form-label">Kỹ năng</label>
              <SkillsMultiSelect
                selected={searchParams.skills}
                options={getSkillOptions(searchParams.industry)}
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
                {getPositionOptions(searchParams.industry).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ width: 160, marginBottom: 0 }}>
              <label className="form-label">Trạng thái</label>
              <select className="form-input" value={searchParams.status}
                onChange={e => setSearchParams({ ...searchParams, status: e.target.value })}>
                <option value="">-- Tất cả --</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ width: 180, marginBottom: 0 }}>
              <label className="form-label">Ngành tuyển</label>
              <select className="form-input" value={searchParams.industry}
                onChange={e => {
                  const nextIndustry = e.target.value;
                  const validPositions = getPositionOptions(nextIndustry);
                  const validSkills = getSkillOptions(nextIndustry);
                  setSearchParams({
                    ...searchParams,
                    industry: nextIndustry,
                    position: validPositions.includes(searchParams.position) ? searchParams.position : '',
                    skills: searchParams.skills.filter((skill) => validSkills.includes(skill)),
                  });
                }}>
                <option value="">-- Tất cả --</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSearch} id="btn-search">🔍 Tìm</button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSearchParams({
                    skills: [],
                    minExp: '',
                    position: '',
                    status: '',
                    industry: '',
                  });
                  fetchAll();
                }}
              >
                ↺ Reset
              </button>
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
                    <th>Ngành</th>
                    <th>Vị trí</th>
                    <th>Kinh nghiệm</th>
                    <th>Kỹ năng</th>
                    <th>Phân công</th>
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
                          onClick={() => openCandidateDetail(c.id)}
                        >{c.fullName}</strong>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{c.email}</td>
                      <td>{c.industry || <span style={{ color: 'var(--text-muted)' }}>Chưa xác định</span>}</td>
                      <td><span className="tag" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}>{c.position}</span></td>
                      <td>{c.yearsExperience} năm</td>
                      <td>
                        <div className="tags">
                          {(c.skills || []).slice(0, 3).map(s => <span key={s} className="tag">{s}</span>)}
                          {(c.skills || []).length > 3 && <span className="tag">+{c.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {c.assignedDepartment || c.assignedRole
                          ? `${c.assignedDepartment || 'General'} / ${c.assignedRole || 'Staff'}`
                          : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td>
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                          value={pendingStatuses[c.id] || c.status}
                          onChange={e => handlePendingStatusChange(c.id, e.target.value)}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusChange(c, pendingStatuses[c.id] || c.status)}
                          style={{ marginRight: 8 }}
                        >
                          Cập nhật
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => openEditModal(c.id)} style={{ marginRight: 8 }}>
                          Sửa
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Xóa</button>
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
              <h3 className="modal-title">{formMode === 'edit' ? '✏ Chỉnh sửa ứng viên' : '➕ Thêm ứng viên mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
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
                  <label className="form-label">Ngành *</label>
                  <select
                    className="form-input"
                    value={form.industry}
                    onChange={e => {
                      const nextIndustry = e.target.value;
                      const validPositions = getPositionOptions(nextIndustry);
                      const validSkills = getSkillOptions(nextIndustry);
                      setForm({
                        ...form,
                        industry: nextIndustry,
                        position: validPositions.includes(form.position) ? form.position : '',
                        skills: form.skills.filter((skill) => validSkills.includes(skill)),
                      });
                    }}
                    required
                  >
                    <option value="">-- Chọn ngành --</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vị trí ứng tuyển *</label>
                  <select className="form-input" value={form.position}
                    onChange={e => setForm({ ...form, position: e.target.value })} required>
                    <option value="">-- Chọn vị trí --</option>
                    {getPositionOptions(form.industry).map(p => <option key={p} value={p}>{p}</option>)}
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
                    options={getSkillOptions(form.industry)}
                    onChange={v => setForm({ ...form, skills: v })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Hồ sơ đính kèm</label>
                  {form.cvUrl ? (
                    <div>
                      <a href={form.cvUrl} target="_blank" rel="noreferrer" className="badge badge-success" style={{ padding: '8px 12px', fontSize: 13, textDecoration: 'none' }}>
                        Đã có CV (Nhấn để xem)
                      </a>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>
                      <em>Chưa có CV. Vui lòng dùng nút "Import Hồ sơ PDF" ở ngoài màn hình chính để AI tự động trích xuất.</em>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary">✓ {formMode === 'edit' ? 'Cập nhật ứng viên' : 'Lưu ứng viên'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hire Assignment Modal */}
      {showHireModal && hiringCandidate && (
        <div className="modal-backdrop" onClick={() => !hiringLoading && setShowHireModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">🧩 Gán vai trò khi HIRED</h3>
              <button className="modal-close" onClick={() => !hiringLoading && setShowHireModal(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmHire}>
              <p style={{ marginBottom: 12 }}>
                Ứng viên: <strong>{hiringCandidate.fullName}</strong> ({hiringCandidate.position})
              </p>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phòng ban *</label>
                  <input
                    className="form-input"
                    value={hireForm.assignedDepartment}
                    onChange={e => setHireForm({ ...hireForm, assignedDepartment: e.target.value, managerId: '' })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vai trò *</label>
                  <input
                    className="form-input"
                    value={hireForm.assignedRole}
                    onChange={e => setHireForm({ ...hireForm, assignedRole: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quản lý trực tiếp</label>
                  <select
                    className="form-input"
                    value={hireForm.managerId}
                    onChange={e => setHireForm({ ...hireForm, managerId: e.target.value })}
                  >
                    <option value="">-- Cấp cao nhất (CEO) --</option>
                    {orgStaff
                      .filter(member => !hireForm.assignedDepartment || member.department === hireForm.assignedDepartment)
                      .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} (#{member.id})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Lương khởi điểm (VNĐ)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={hireForm.salary}
                    onChange={e => setHireForm({ ...hireForm, salary: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày phép ban đầu</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={hireForm.leaveBalance}
                    onChange={e => setHireForm({ ...hireForm, leaveBalance: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={hiringLoading}>
                  {hiringLoading ? 'Đang xử lý...' : '✓ Xác nhận HIRED'}
                </button>
                <button type="button" className="btn btn-outline" disabled={hiringLoading} onClick={() => setShowHireModal(false)}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {(selectedCandidate || detailLoading) && (
        <div className="modal-backdrop" onClick={() => setSelectedCandidate(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">👤 {detailLoading ? 'Đang tải...' : selectedCandidate.fullName}</h3>
              <button className="modal-close" onClick={() => setSelectedCandidate(null)}>✕</button>
            </div>
            {detailLoading ? (
              <div className="loading"><div className="spinner" /> Đang tải...</div>
            ) : (
              <div>
                <p><strong>Email:</strong> {selectedCandidate.email}</p>
                <p><strong>Điện thoại:</strong> {selectedCandidate.phone}</p>
                <p><strong>Ngành:</strong> {selectedCandidate.industry || 'Chưa xác định'}</p>
                <p><strong>Vị trí:</strong> <span className="tag" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)' }}>{selectedCandidate.position}</span></p>
                <p><strong>Kinh nghiệm:</strong> {selectedCandidate.yearsExperience} năm</p>
                {(selectedCandidate.assignedDepartment || selectedCandidate.assignedRole) && (
                  <p><strong>Phân công khi tuyển:</strong> {selectedCandidate.assignedDepartment || 'General'} / {selectedCandidate.assignedRole || 'Staff'}</p>
                )}
                {selectedCandidate.cvUrl && (
                  <p><strong>CV:</strong> <a href={selectedCandidate.cvUrl} target="_blank" rel="noreferrer">Xem hồ sơ</a></p>
                )}
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
                <div className="flex gap-2 mt-4">
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      const currentId = selectedCandidate.id;
                      setSelectedCandidate(null);
                      await openEditModal(currentId);
                    }}
                  >
                    ✏ Chỉnh sửa
                  </button>
                  <button className="btn btn-outline" onClick={() => setSelectedCandidate(null)}>Đóng</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { orgService } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

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
            ID: {node.id} · {node.department || 'General'} · {node.roleTitle || 'Staff'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Lương: {node.salary?.toLocaleString()} · Nghỉ phép: {node.leaveBalance} ngày
          </div>
        </div>
        <span className="badge" style={{ marginLeft: 'auto', background: `${color}20`, color }}>
          Cấp {node.level}
        </span>
      </div>
      {expanded && node.children?.length > 0 && (
        <div className="org-node-children">
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

const getErrorText = (error, fallback) => (
  error?.response?.data?.error
  || error?.response?.data?.message
  || fallback
);

export default function OrgChartPage({ theme, onToggleTheme }) {
  const [orgChart, setOrgChart] = useState([]);
  const [flatChart, setFlatChart] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hierarchyDraft, setHierarchyDraft] = useState({});
  const [savingHierarchyId, setSavingHierarchyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [message, setMessage] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [rootFilter, setRootFilter] = useState('');
  const [staffForm, setStaffForm] = useState({
    id: '',
    name: '',
    managerId: '',
    salary: '',
    leaveBalance: 15,
    department: '',
    roleTitle: '',
  });
  const [departmentForm, setDepartmentForm] = useState({
    id: '',
    name: '',
    description: '',
  });
  const [departmentFormMode, setDepartmentFormMode] = useState('create');
  const [savingDepartment, setSavingDepartment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [departmentFilter, rootFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (departmentFilter) params.department = departmentFilter;
      if (rootFilter) params.rootId = parseInt(rootFilter, 10);

      const [allStaffRes, chartRes, flatRes, staffRes, departmentRes] = await Promise.all([
        orgService.getStaff(),
        orgService.getOrgChart(params),
        orgService.getOrgChartFlat(params),
        orgService.getStaff(departmentFilter ? { department: departmentFilter } : undefined),
        orgService.getDepartments(),
      ]);

      const subtreeIds = new Set((flatRes.data || []).map((node) => node.id));
      const visibleStaff = rootFilter
        ? (staffRes.data || []).filter((member) => subtreeIds.has(member.id))
        : (staffRes.data || []);

      setAllStaff(allStaffRes.data || []);
      setOrgChart(chartRes.data || []);
      setFlatChart(flatRes.data || []);
      setStaff(visibleStaff);
      setDepartments(departmentRes.data || []);
      setHierarchyDraft(Object.fromEntries(
        (flatRes.data || []).map((node) => [node.id, node.managerId == null ? '' : String(node.managerId)]),
      ));
    } catch (error) {
      setMessage({ type: 'error', text: getErrorText(error, 'Không thể tải dữ liệu tổ chức.') });
    } finally {
      setLoading(false);
    }
  };

  const resetStaffForm = () => {
    setStaffForm({
      id: '',
      name: '',
      managerId: '',
      salary: '',
      leaveBalance: 15,
      department: departmentFilter || departments[0]?.name || '',
      roleTitle: '',
    });
  };

  const resetDepartmentForm = () => {
    setDepartmentForm({
      id: '',
      name: '',
      description: '',
    });
    setDepartmentFormMode('create');
  };

  const openCreateModal = () => {
    resetStaffForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = async (id) => {
    setMessage(null);
    try {
      const res = await orgService.getStaffById(id);
      const staffData = res.data;
      setStaffForm({
        id: staffData.id,
        name: staffData.name || '',
        managerId: staffData.managerId ?? '',
        salary: staffData.salary ?? '',
        leaveBalance: staffData.leaveBalance ?? 15,
        department: staffData.department || '',
        roleTitle: staffData.roleTitle || '',
      });
      setModalMode('edit');
      setShowModal(true);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorText(error, 'Không thể tải thông tin nhân viên.') });
    }
  };

  const openStaffDetail = async (id) => {
    setMessage(null);
    try {
      const res = await orgService.getStaffById(id);
      setSelectedStaff(res.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorText(error, 'Không thể tải chi tiết nhân viên.') });
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: parseInt(staffForm.id, 10),
        name: staffForm.name,
        managerId: staffForm.managerId ? parseInt(staffForm.managerId, 10) : null,
        salary: parseInt(staffForm.salary, 10),
        leaveBalance: parseInt(staffForm.leaveBalance, 10),
        department: staffForm.department,
        roleTitle: staffForm.roleTitle || 'Staff',
      };

      if (modalMode === 'edit') {
        await orgService.updateStaff(parseInt(staffForm.id, 10), payload);
        setMessage({ type: 'success', text: 'Cập nhật nhân viên thành công.' });
      } else {
        await orgService.createStaff(payload);
        setMessage({ type: 'success', text: 'Thêm nhân viên thành công.' });
      }

      setShowModal(false);
      resetStaffForm();
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorText(error, 'Lỗi khi lưu nhân viên.') });
    }
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    setSavingDepartment(true);
    try {
      const payload = {
        name: departmentForm.name,
        description: departmentForm.description,
      };

      if (departmentFormMode === 'edit' && departmentForm.id) {
        await orgService.updateDepartment(departmentForm.id, payload);
        setMessage({ type: 'success', text: 'Cập nhật phòng ban thành công.' });
      } else {
        await orgService.createDepartment(payload);
        setMessage({ type: 'success', text: 'Thêm phòng ban thành công.' });
      }

      resetDepartmentForm();
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorText(error, 'Không thể lưu phòng ban.') });
    } finally {
      setSavingDepartment(false);
    }
  };

  const editDepartment = (department) => {
    setDepartmentForm({
      id: department.id,
      name: department.name || '',
      description: department.description || '',
    });
    setDepartmentFormMode('edit');
  };

  const deleteDepartment = async (department) => {
    if (!window.confirm(`Xóa phòng ban ${department.name}?`)) return;
    try {
      await orgService.deleteDepartment(department.id);
      if (departmentFilter === department.name) {
        setDepartmentFilter('');
        setRootFilter('');
      }
      if (staffForm.department === department.name) {
        setStaffForm((current) => ({ ...current, department: '' }));
      }
      if (departmentForm.id === department.id) {
        resetDepartmentForm();
      }
      setMessage({ type: 'success', text: 'Đã xóa phòng ban thành công.' });
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorText(error, 'Không thể xóa phòng ban.') });
    }
  };

  const departmentOptions = departments.map((department) => department.name);
  const branchRoots = allStaff.filter((member) => !departmentFilter || member.department === departmentFilter);
  const managerOptions = allStaff.filter((member) => {
    const notSelf = String(member.id) !== String(staffForm.id);
    const sameDepartment = !staffForm.department || member.department === staffForm.department;
    return notSelf && sameDepartment;
  });

  const saveHierarchy = async (node) => {
    const draftValue = hierarchyDraft[node.id];
    const newManagerId = draftValue === '' || draftValue == null ? null : parseInt(draftValue, 10);
    const oldManagerId = node.managerId == null ? null : node.managerId;

    if (newManagerId === node.id) {
      setMessage({ type: 'error', text: 'Nhân viên không thể tự quản lý chính mình.' });
      return;
    }

    if (newManagerId === oldManagerId) {
      setMessage({ type: 'success', text: 'Không có thay đổi phân cấp để lưu.' });
      return;
    }

    setSavingHierarchyId(node.id);
    try {
      const payload = {
        id: node.id,
        name: node.name,
        managerId: newManagerId,
        salary: node.salary,
        leaveBalance: node.leaveBalance,
        department: node.department || departmentOptions[0] || 'General',
        roleTitle: node.roleTitle || 'Staff',
        documentFolder: node.documentFolder || null,
      };
      await orgService.updateStaff(node.id, payload);
      setMessage({ type: 'success', text: `Đã cập nhật phân cấp cho ${node.name}.` });
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorText(error, 'Không thể cập nhật phân cấp.') });
    } finally {
      setSavingHierarchyId(null);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🏢 Sơ đồ tổ chức</h2>
          <div className="page-note">Quản lý nhân viên, phòng ban và mối quan hệ quản lý trực tiếp.</div>
        </div>
        <div className="page-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            id="btn-add-staff"
            disabled={departmentOptions.length === 0}
          >
            + Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="page-body">
        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.text}
          </div>
        )}

        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quản lý phòng ban</h3>
            </div>
            <form onSubmit={handleDepartmentSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tên phòng ban</label>
                  <input
                    className="form-input"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <input
                    className="form-input"
                    value={departmentForm.description}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={savingDepartment}>
                  {savingDepartment
                    ? 'Đang lưu...'
                    : departmentFormMode === 'edit'
                      ? 'Cập nhật phòng ban'
                      : 'Thêm phòng ban'}
                </button>
                <button type="button" className="btn btn-outline" onClick={resetDepartmentForm}>
                  Làm mới
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Danh sách phòng ban ({departments.length})</h3>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {departments.length > 0 ? departments.map((department) => (
                <div
                  key={department.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'var(--surface-muted)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{department.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {department.description || 'Chưa có mô tả'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => editDepartment(department)}>
                      Sửa
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteDepartment(department)}>
                      Xóa
                    </button>
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <div className="icon">🏷️</div>
                  <h3>Chưa có phòng ban</h3>
                  <p>Hãy thêm phòng ban trước khi tạo nhân viên hoặc tuyển dụng ứng viên.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h3 className="card-title">Bộ lọc sơ đồ theo phòng ban và nhánh</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <div className="form-group" style={{ minWidth: 220, marginBottom: 0 }}>
              <label className="form-label">Phòng ban</label>
              <select
                className="form-input"
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setRootFilter('');
                }}
              >
                <option value="">-- Toàn công ty --</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: 260, marginBottom: 0 }}>
              <label className="form-label">Nhánh nhỏ (gốc quản lý)</label>
              <select
                className="form-input"
                value={rootFilter}
                onChange={(e) => setRootFilter(e.target.value)}
              >
                <option value="">-- Toàn bộ trong bộ lọc hiện tại --</option>
                {branchRoots.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} (#{member.id})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setDepartmentFilter('');
                  setRootFilter('');
                }}
              >
                Xóa lọc
              </button>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Sơ đồ phân cấp (Recursive CTE)</h3>
                <span className="section-caption">Kết quả dựng cây phân cấp nhân sự từ dữ liệu tổ chức.</span>
              </div>
            </div>
            <div className="org-tree" style={{ padding: '8px 0' }}>
              {orgChart.length > 0 ? (
                orgChart.map((node) => <OrgNode key={node.id} node={node} level={0} />)
              ) : (
                <div className="empty-state">
                  <div className="icon">🏢</div>
                  <h3>Chưa có dữ liệu tổ chức</h3>
                  <p>Thêm nhân viên để xây dựng sơ đồ tổ chức.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Sơ đồ phẳng (Recursive CTE)</h3>
                <span className="section-caption">Danh sách nhân sự theo thứ bậc dùng để chỉnh nhanh quản lý trực tiếp.</span>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Quản lý</th>
                    <th>Phòng ban</th>
                    <th>Vai trò</th>
                    <th>Sửa phân cấp</th>
                    <th>Lương</th>
                    <th>Ngày phép còn</th>
                    <th>Cấp</th>
                  </tr>
                </thead>
                <tbody>
                  {flatChart.map((node) => (
                    <tr key={node.id}>
                      <td>#{node.id}</td>
                      <td>{node.name}</td>
                      <td>{node.managerId ?? 'CEO'}</td>
                      <td>{node.department || 'General'}</td>
                      <td>{node.roleTitle || 'Staff'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            className="form-input"
                            style={{ minWidth: 170, padding: '4px 8px' }}
                            value={hierarchyDraft[node.id] ?? ''}
                            onChange={(e) => setHierarchyDraft({ ...hierarchyDraft, [node.id]: e.target.value })}
                          >
                            <option value="">CEO</option>
                            {allStaff
                              .filter((member) => member.id !== node.id)
                              .map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name} (#{member.id})
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={savingHierarchyId === node.id}
                            onClick={() => saveHierarchy(node)}
                          >
                            {savingHierarchyId === node.id ? 'Đang lưu...' : 'Lưu'}
                          </button>
                        </div>
                      </td>
                      <td>{node.salary?.toLocaleString()} VNĐ</td>
                      <td>{node.leaveBalance} ngày</td>
                      <td>{node.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
              <h3 className="card-title">Danh sách nhân viên ({staff.length})</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Quản lý</th>
                    <th>Phòng ban</th>
                    <th>Vai trò</th>
                    <th>Lương</th>
                    <th>Ngày phép còn</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => {
                    const manager = allStaff.find((staffItem) => staffItem.id === member.managerId);
                    return (
                      <tr key={member.id}>
                        <td><span className="badge badge-purple">#{member.id}</span></td>
                        <td>
                          <strong
                            style={{ cursor: 'pointer', color: 'var(--primary)' }}
                            onClick={() => openStaffDetail(member.id)}
                          >
                            {member.name}
                          </strong>
                        </td>
                        <td>{manager ? manager.name : <span className="badge badge-info">CEO</span>}</td>
                        <td>{member.department || 'General'}</td>
                        <td>{member.roleTitle || 'Staff'}</td>
                        <td>{member.salary?.toLocaleString()} VNĐ</td>
                        <td>
                          <span className={`badge ${member.leaveBalance > 10 ? 'badge-success' : member.leaveBalance > 5 ? 'badge-warning' : 'badge-danger'}`}>
                            {member.leaveBalance} ngày
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ marginRight: 8 }}
                            onClick={() => openEditModal(member.id)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={async () => {
                              if (window.confirm(`Xóa nhân viên ${member.name}?`)) {
                                try {
                                  await orgService.deleteStaff(member.id);
                                  fetchData();
                                } catch (error) {
                                  setMessage({
                                    type: 'error',
                                    text: getErrorText(error, 'Không thể xóa nhân viên.'),
                                  });
                                }
                              }
                            }}
                          >
                            Xóa
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

      {selectedStaff && (
        <div className="modal-backdrop" onClick={() => setSelectedStaff(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">Chi tiết nhân viên</h3>
              <button className="modal-close" onClick={() => setSelectedStaff(null)}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <p><strong>ID:</strong> #{selectedStaff.id}</p>
              <p><strong>Tên:</strong> {selectedStaff.name}</p>
              <p><strong>Quản lý:</strong> {allStaff.find((member) => member.id === selectedStaff.managerId)?.name || 'CEO'}</p>
              <p><strong>Phòng ban:</strong> {selectedStaff.department || 'General'}</p>
              <p><strong>Vai trò:</strong> {selectedStaff.roleTitle || 'Staff'}</p>
              <p><strong>Lương:</strong> {selectedStaff.salary?.toLocaleString()} VNĐ</p>
              <p><strong>Ngày phép còn:</strong> {selectedStaff.leaveBalance} ngày</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="btn btn-primary"
                onClick={() => {
                  const currentId = selectedStaff.id;
                  setSelectedStaff(null);
                  openEditModal(currentId);
                }}
              >
                Chỉnh sửa
              </button>
              <button className="btn btn-outline" onClick={() => setSelectedStaff(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'edit' ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleStaffSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">ID nhân viên</label>
                  <input
                    className="form-input"
                    type="number"
                    value={staffForm.id}
                    onChange={(e) => setStaffForm({ ...staffForm, id: e.target.value })}
                    required
                    readOnly={modalMode === 'edit'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên nhân viên</label>
                  <input
                    className="form-input"
                    type="text"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quản lý</label>
                  <select
                    className="form-input"
                    value={staffForm.managerId}
                    onChange={(e) => setStaffForm({ ...staffForm, managerId: e.target.value })}
                  >
                    <option value="">-- Cấp cao nhất (CEO) --</option>
                    {managerOptions.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} (#{member.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Lương (VNĐ)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={staffForm.salary}
                    onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày phép</label>
                  <input
                    className="form-input"
                    type="number"
                    value={staffForm.leaveBalance}
                    onChange={(e) => setStaffForm({ ...staffForm, leaveBalance: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phòng ban</label>
                  <select
                    className="form-input"
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value, managerId: '' })}
                    required
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.name}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vai trò</label>
                  <input
                    className="form-input"
                    type="text"
                    value={staffForm.roleTitle}
                    onChange={(e) => setStaffForm({ ...staffForm, roleTitle: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={departmentOptions.length === 0}>
                  {modalMode === 'edit' ? 'Cập nhật nhân viên' : 'Lưu nhân viên'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

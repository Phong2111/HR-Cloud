import React, { useEffect, useState } from 'react';
import { leaveService, orgService } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

export default function LeavePage({ theme, onToggleTheme }) {
  const [leaves, setLeaves] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ staffId: '', days: '' });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [balanceLookupId, setBalanceLookupId] = useState('');
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [historyStaffId, setHistoryStaffId] = useState('');
  const [staffHistory, setStaffHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [daysLog, setDaysLog] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, staffRes] = await Promise.all([
        leaveService.getAllLeaves(),
        orgService.getStaff(),
      ]);
      setLeaves(leavesRes.data);
      setStaff(staffRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const validateRequestedDays = (staffIdValue, daysValue) => {
    if (!daysValue) return null;
    const parsed = parseInt(daysValue, 10);

    if (Number.isNaN(parsed)) {
      return { type: 'error', text: 'Số ngày nghỉ không hợp lệ.' };
    }
    if (parsed <= 0) {
      return { type: 'error', text: 'Số ngày nghỉ phải lớn hơn 0.' };
    }
    if (parsed > 30) {
      return { type: 'error', text: 'Một yêu cầu không thể vượt quá 30 ngày.' };
    }

    if (staffIdValue) {
      const selectedStaff = staff.find((member) => String(member.id) === String(staffIdValue));
      if (selectedStaff && parsed > selectedStaff.leaveBalance) {
        return {
          type: 'error',
          text: `Bạn đang nhập ${parsed} ngày, vượt quá số ngày phép còn lại (${selectedStaff.leaveBalance} ngày).`,
        };
      }
      if (selectedStaff && parsed > 10) {
        return {
          type: 'warn',
          text: `Yêu cầu ${parsed} ngày là khá dài, vui lòng kiểm tra lại trước khi gửi.`,
        };
      }
    }

    return { type: 'ok', text: `Số ngày nghỉ hợp lệ: ${parsed} ngày.` };
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    const validation = validateRequestedDays(form.staffId, form.days);
    setDaysLog(validation);
    if (!validation || validation.type === 'error') {
      setResult({ status: 'Error', message: validation?.text || 'Vui lòng nhập số ngày nghỉ hợp lệ.' });
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const res = await leaveService.requestLeave(parseInt(form.staffId, 10), parseInt(form.days, 10));
      setResult(res.data);
      if (res.data.status === 'Approved') {
        fetchData();
      }
    } catch (err) {
      setResult({ status: 'Error', message: err.response?.data?.error || 'Không thể kết nối đến máy chủ.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupBalance = async () => {
    if (!balanceLookupId) {
      setBalanceInfo(null);
      return;
    }

    setBalanceLoading(true);
    setBalanceInfo(null);
    try {
      const res = await leaveService.getLeaveBalance(parseInt(balanceLookupId, 10));
      setBalanceInfo(res.data);
    } catch (err) {
      setBalanceInfo({ error: err.response?.data?.error || 'Không thể tra cứu ngày phép.' });
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    if (!historyStaffId) {
      setStaffHistory([]);
      return;
    }

    setHistoryLoading(true);
    try {
      const res = await leaveService.getLeavesByStaff(parseInt(historyStaffId, 10));
      setStaffHistory(res.data);
    } catch (err) {
      setStaffHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📅 Quản lý nghỉ phép</h2>
          <div className="page-note">Theo dõi ngày phép còn lại và gửi yêu cầu nghỉ ngay trên hệ thống.</div>
        </div>
        <div className="page-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      <div className="page-body">
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📝 Gửi yêu cầu nghỉ phép</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Hệ thống gọi stored procedure <code>ApproveLeave(@staff_id, @days)</code> để đảm bảo xử lý atomic.
            </p>
            <form onSubmit={handleRequest}>
              <div className="form-group">
                <label className="form-label">Nhân viên</label>
                <select
                  className="form-input"
                  value={form.staffId}
                  onChange={(e) => {
                    const nextStaffId = e.target.value;
                    setForm({ ...form, staffId: nextStaffId });
                    setDaysLog(validateRequestedDays(nextStaffId, form.days));
                  }}
                  required
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} (#{member.id}) - Còn {member.leaveBalance} ngày
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Số ngày nghỉ</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="30"
                  value={form.days}
                  onChange={(e) => {
                    const nextDays = e.target.value;
                    setForm({ ...form, days: nextDays });
                    setDaysLog(validateRequestedDays(form.staffId, nextDays));
                  }}
                  required
                  placeholder="Ví dụ: 5"
                />
              </div>
              {daysLog && (
                <div className={`alert mb-4 ${daysLog.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {daysLog.text}
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={submitting} id="btn-request-leave">
                {submitting ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </button>
            </form>

            {result && (
              <div className={`alert mt-4 alert-${result.status === 'Approved' ? 'success' : 'error'}`}>
                <div style={{ fontWeight: 700 }}>
                  {result.status === 'Approved'
                    ? 'Yêu cầu đã được duyệt'
                    : result.status === 'Rejected'
                      ? 'Yêu cầu bị từ chối'
                      : 'Có lỗi xảy ra'}
                </div>
                <div style={{ marginTop: 6, fontSize: 13 }}>{result.message}</div>
                {result.remainingBalance !== undefined && (
                  <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
                    Ngày phép còn lại: <strong>{result.remainingBalance}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">💊 Số ngày phép hiện tại</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {staff.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--surface-muted)',
                    borderRadius: 14,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{member.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID #{member.id}</div>
                  </div>
                  <span className={`badge ${member.leaveBalance > 10 ? 'badge-success' : member.leaveBalance > 5 ? 'badge-warning' : 'badge-danger'}`}>
                    {member.leaveBalance} ngày
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid-2 mt-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🔎 Tra cứu ngày phép từ backend</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Chọn nhân viên</label>
              <select className="form-input" value={balanceLookupId} onChange={(e) => setBalanceLookupId(e.target.value)}>
                <option value="">-- Chọn nhân viên --</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>{member.name} (#{member.id})</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleLookupBalance} disabled={balanceLoading}>
              {balanceLoading ? 'Đang tra cứu...' : 'Tra cứu balance'}
            </button>
            {balanceInfo && (
              <div className={`alert mt-4 ${balanceInfo.error ? 'alert-error' : 'alert-success'}`}>
                {balanceInfo.error ? (
                  balanceInfo.error
                ) : (
                  <div>
                    <div><strong>{balanceInfo.staffName}</strong> (#{balanceInfo.staffId})</div>
                    <div>Còn lại: <strong>{balanceInfo.leaveBalance}</strong> ngày</div>
                    <div>Yêu cầu đã duyệt: <strong>{balanceInfo.approvedRequestsCount}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📚 Lịch sử theo nhân viên</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Nhân viên</label>
              <select className="form-input" value={historyStaffId} onChange={(e) => setHistoryStaffId(e.target.value)}>
                <option value="">-- Chọn nhân viên --</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>{member.name} (#{member.id})</option>
                ))}
              </select>
            </div>
            <button className="btn btn-outline" onClick={handleLoadHistory} disabled={historyLoading}>
              {historyLoading ? 'Đang tải...' : 'Xem lịch sử'}
            </button>
            {staffHistory.length > 0 ? (
              <div className="table-container mt-4">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Số ngày</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffHistory.map((item) => (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td>{item.days} ngày</td>
                        <td>
                          <span className={`badge ${item.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>
                            {item.status === 'Approved' ? 'Đã duyệt' : item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              historyStaffId && !historyLoading && (
                <div className="empty-state" style={{ marginTop: 16 }}>
                  <div className="icon">📚</div>
                  <p>Chưa có lịch sử nghỉ phép cho nhân viên này.</p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">📋 Lịch sử nghỉ phép ({leaves.length} bản ghi)</h3>
          </div>
          {leaves.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nhân viên</th>
                    <th>Số ngày</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>#{leave.id}</td>
                      <td>{staff.find((member) => member.id === leave.staffId)?.name || `#${leave.staffId}`}</td>
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
              <h3>Chưa có lịch sử nghỉ phép</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

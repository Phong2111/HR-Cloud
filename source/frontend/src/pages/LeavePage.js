import React, { useState, useEffect } from 'react';
import { leaveService, orgService } from '../services/api';

export default function LeavePage() {
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
      return { type: 'error', text: 'Số ngày nghỉ không hợp lệ' };
    }
    if (parsed <= 0) {
      return { type: 'error', text: 'Số ngày nghỉ phải lớn hơn 0' };
    }
    if (parsed > 30) {
      return { type: 'error', text: 'Một yêu cầu không thể vượt quá 30 ngày' };
    }

    if (staffIdValue) {
      const selectedStaff = staff.find((s) => String(s.id) === String(staffIdValue));
      if (selectedStaff && parsed > selectedStaff.leaveBalance) {
        return {
          type: 'error',
          text: `Nhập ${parsed} ngày vượt quá ngày phép còn lại (${selectedStaff.leaveBalance} ngày)`,
        };
      }
      if (selectedStaff && parsed > 10) {
        return {
          type: 'warn',
          text: `Yêu cầu ${parsed} ngày là khá dài, vui lòng kiểm tra lại trước khi gửi`,
        };
      }
    }

    return { type: 'ok', text: `Số ngày nghỉ hợp lệ: ${parsed} ngày` };
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    const validation = validateRequestedDays(form.staffId, form.days);
    setDaysLog(validation);
    if (!validation || validation.type === 'error') {
      setResult({ status: 'Error', message: validation?.text || 'Vui lòng nhập số ngày nghỉ hợp lệ' });
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const res = await leaveService.requestLeave(parseInt(form.staffId), parseInt(form.days));
      setResult(res.data);
      if (res.data.status === 'Approved') {
        fetchData();
      }
    } catch (err) {
      setResult({ status: 'Error', message: err.response?.data?.error || 'Lỗi kết nối server' });
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
      const res = await leaveService.getLeaveBalance(parseInt(balanceLookupId));
      setBalanceInfo(res.data);
    } catch (err) {
      setBalanceInfo({ error: err.response?.data?.error || 'Không thể tra cứu ngày phép' });
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
      const res = await leaveService.getLeavesByStaff(parseInt(historyStaffId));
      setStaffHistory(res.data);
    } catch (err) {
      setStaffHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>📅 Quản lý nghỉ phép</h2>
      </div>
      <div className="page-body">
        <div className="grid-2">
          {/* Request Form */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📝 Gửi yêu cầu nghỉ phép</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Hệ thống sẽ gọi Stored Procedure <code style={{ color: 'var(--primary)' }}>ApproveLeave(@staff_id, @days)</code> đảm bảo xử lý ATOMIC.
            </p>
            <form onSubmit={handleRequest}>
              <div className="form-group">
                <label className="form-label">Nhân viên *</label>
                <select className="form-input" value={form.staffId}
                  onChange={e => {
                    const nextStaffId = e.target.value;
                    setForm({ ...form, staffId: nextStaffId });
                    setDaysLog(validateRequestedDays(nextStaffId, form.days));
                  }} required>
                  <option value="">-- Chọn nhân viên --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (#{s.id}) - Còn {s.leaveBalance} ngày
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Số ngày nghỉ *</label>
                <input className="form-input" type="number" min="1" max="30"
                  value={form.days}
                  onChange={e => {
                    const nextDays = e.target.value;
                    setForm({ ...form, days: nextDays });
                    setDaysLog(validateRequestedDays(form.staffId, nextDays));
                  }}
                  required placeholder="VD: 5" />
              </div>
              {daysLog && (
                <div className={`alert mb-4 ${daysLog.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {daysLog.text}
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={submitting} id="btn-request-leave">
                {submitting ? '⏳ Đang xử lý...' : '📨 Gửi yêu cầu'}
              </button>
            </form>

            {result && (
              <div className={`alert mt-4 alert-${result.status === 'Approved' ? 'success' : 'error'}`}>
                <div style={{ fontWeight: 700 }}>
                  {result.status === 'Approved' ? '✅ Phê duyệt thành công' :
                   result.status === 'Rejected' ? '❌ Từ chối - Không đủ ngày phép' : '⚠ Lỗi'}
                </div>
                <div style={{ marginTop: 6, fontSize: 13 }}>{result.message}</div>
                {result.remainingBalance !== undefined && (
                  <div style={{ marginTop: 4, fontSize: 12, color: 'inherit', opacity: 0.8 }}>
                    Số ngày còn lại: <strong>{result.remainingBalance}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Balance Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">💊 Ngày phép hiện tại</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {staff.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8, border: '1px solid var(--dark-border)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID #{s.id}</div>
                  </div>
                  <span className={`badge ${s.leaveBalance > 10 ? 'badge-success' : s.leaveBalance > 5 ? 'badge-warning' : 'badge-danger'}`}>
                    {s.leaveBalance} ngày
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
              <select className="form-input" value={balanceLookupId} onChange={e => setBalanceLookupId(e.target.value)}>
                <option value="">-- Chọn nhân viên --</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (#{s.id})</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleLookupBalance} disabled={balanceLoading}>
              {balanceLoading ? '⏳ Đang tra cứu...' : 'Tra cứu balance'}
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
              <select className="form-input" value={historyStaffId} onChange={e => setHistoryStaffId(e.target.value)}>
                <option value="">-- Chọn nhân viên --</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (#{s.id})</option>
                ))}
              </select>
            </div>
            <button className="btn btn-outline" onClick={handleLoadHistory} disabled={historyLoading}>
              {historyLoading ? '⏳ Đang tải...' : 'Xem lịch sử'}
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
                    {staffHistory.map(item => (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td>{item.days} ngày</td>
                        <td>
                          <span className={`badge ${item.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>
                            {item.status}
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
                  <p>Chưa có dữ liệu lịch sử cho nhân viên này</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Leave History */}
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
                    <th>Staff ID</th>
                    <th>Số ngày</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id}>
                      <td>#{l.id}</td>
                      <td>
                        {staff.find(s => s.id === l.staffId)?.name || `#${l.staffId}`}
                      </td>
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
              <h3>Chưa có lịch sử nghỉ phép</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

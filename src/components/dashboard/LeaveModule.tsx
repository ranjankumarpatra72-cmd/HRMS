import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import {
  CalendarCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileText,
  Upload,
  UserCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { LeaveTypeBalance, LeaveRequest } from '../../types/index';

export const LeaveModule: React.FC = () => {
  const { employee, user, addToast, showProcessing, hideProcessing } = useAuth();
  const [balances, setBalances] = useState<LeaveTypeBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_leave' | 'officer_approvals'>('my_leave');

  // Form states
  const [leaveType, setLeaveType] = useState<LeaveTypeBalance['leaveType']>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState('');
  const [address, setAddress] = useState('');
  const [docFile, setDocFile] = useState<string | null>(null);

  // Approval Modal states
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [officerRemarks, setOfficerRemarks] = useState('');

  const fetchLeaveData = async () => {
    if (!employee) return;
    try {
      const [balRes, reqRes] = await Promise.all([
        apiFetch(`/api/leave/balances/${employee.employeeId}`),
        apiFetch(`/api/leave/requests`)
      ]);
      const balData = await balRes.json();
      const reqData = await reqRes.json();

      if (balData.success) setBalances(balData.balances);
      if (reqData.success) setRequests(reqData.requests);
    } catch (e) {
      addToast('error', 'Error', 'Failed to load leave records.');
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [employee]);

  // Calculate days difference
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(diffDays > 0 ? diffDays : 1);
    }
  }, [startDate, endDate]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      addToast('error', 'Incomplete Form', 'Please enter dates and reason.');
      return;
    }

    showProcessing('Submitting Leave Application to Server...');
    try {
      const res = await apiFetch('/api/leave/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          totalDays,
          reason,
          addressDuringLeave: address
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Leave Submitted', data.message);
        setShowApplyModal(false);
        setReason('');
        setAddress('');
        fetchLeaveData();
      } else {
        addToast('error', 'Application Error', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to communicate with server.');
    }
  };

  const handleOfficerDecision = async (status: 'APPROVED' | 'REJECTED' | 'RETURNED') => {
    if (!selectedRequest) return;
    showProcessing(`Updating Leave Status to ${status}...`);

    try {
      const res = await apiFetch('/api/leave/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status,
          remarks: officerRemarks
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Status Updated', data.message);
        setSelectedRequest(null);
        setOfficerRemarks('');
        fetchLeaveData();
      } else {
        addToast('error', 'Decision Error', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to update leave.');
    }
  };

  const isOfficer = ['REPORTING_OFFICER', 'ESTABLISHMENT_OFFICER', 'SUPER_ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-800">
              Leave Account & Application Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time balance computation and multi-tier approval workflow.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Role Tabs if Officer */}
      {isOfficer && (
        <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('my_leave')}
            className={`pb-2.5 px-1 border-b-2 transition-colors ${
              activeTab === 'my_leave'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Leave Applications
          </button>
          <button
            onClick={() => setActiveTab('officer_approvals')}
            className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'officer_approvals'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-sky-500" />
            <span>Reporting Officer Approvals Queue</span>
            {requests.filter((r) => r.status === 'PENDING').length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                {requests.filter((r) => r.status === 'PENDING').length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {balances.map((b) => (
          <div
            key={b.leaveType}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {b.leaveType}
            </span>
            <div className="my-2">
              <span className="text-2xl font-extrabold text-slate-800">
                {b.available}
              </span>
              <span className="text-xs text-slate-400 font-medium"> Days Left</span>
            </div>
            <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between">
              <span>Used: {b.used}</span>
              <span>Pending: {b.pending}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {activeTab === 'my_leave' ? 'Leave Application Records' : 'Pending Approvals for Reporting Officer'}
          </h3>
          <span className="text-xs text-slate-500">
            {requests.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">Application No</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No leave requests found in database.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-sky-600">
                      {r.requestNumber}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{r.employeeName}</div>
                      <div className="text-[10px] text-slate-400">{r.designation}</div>
                    </td>
                    <td className="p-3 font-semibold">{r.leaveType}</td>
                    <td className="p-3">
                      <div className="font-mono text-slate-800">
                        {r.startDate} to {r.endDate}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold">({r.totalDays} Days)</div>
                    </td>
                    <td className="p-3 max-w-xs truncate text-slate-600">
                      {r.reason}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded text-[11px] ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : r.status === 'RETURNED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {r.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                        {r.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {r.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {isOfficer && r.status === 'PENDING' ? (
                        <button
                          onClick={() => setSelectedRequest(r)}
                          className="px-2.5 py-1 bg-sky-600 text-white font-bold rounded hover:bg-sky-700 text-[11px]"
                        >
                          Review & Sanction
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">View Details</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                Apply for Official Leave
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Leave Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="EARNED">Earned Leave (EL)</option>
                  <option value="MEDICAL">Medical Leave (ML)</option>
                  <option value="PATERNITY">Paternity Leave</option>
                  <option value="SPECIAL">Special Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    From Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    To Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200 font-bold text-sky-800 flex justify-between">
                <span>Calculated Duration:</span>
                <span className="font-mono">{totalDays} Day(s)</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detail official or personal cause..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Address & Contact During Leave
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address and active telephone number"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Sanction Modal for Officer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-200">
              <UserCheck className="w-5 h-5 text-sky-600" />
              Sanction Leave Application: {selectedRequest.requestNumber}
            </h3>

            <div className="my-4 bg-slate-50 p-3 rounded-lg text-xs space-y-1.5 border border-slate-200">
              <div><span className="text-slate-400 font-semibold">Applicant:</span> <span className="font-bold text-slate-800">{selectedRequest.employeeName} ({selectedRequest.designation})</span></div>
              <div><span className="text-slate-400 font-semibold">Type & Duration:</span> <span className="font-bold text-sky-600">{selectedRequest.leaveType} ({selectedRequest.totalDays} Days)</span></div>
              <div><span className="text-slate-400 font-semibold">Dates:</span> <span className="font-mono">{selectedRequest.startDate} to {selectedRequest.endDate}</span></div>
              <div><span className="text-slate-400 font-semibold">Reason:</span> <span className="text-slate-700">{selectedRequest.reason}</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sanctioning Officer Remarks
              </label>
              <textarea
                rows={2}
                value={officerRemarks}
                onChange={(e) => setOfficerRemarks(e.target.value)}
                placeholder="Enter sanction or rejection remarks..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-3 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Close
              </button>
              <button
                onClick={() => handleOfficerDecision('RETURNED')}
                className="px-3 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 text-xs"
              >
                Return
              </button>
              <button
                onClick={() => handleOfficerDecision('REJECTED')}
                className="px-3 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 text-xs"
              >
                Reject
              </button>
              <button
                onClick={() => handleOfficerDecision('APPROVED')}
                className="px-3.5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-xs shadow-xs"
              >
                Approve & Sanction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

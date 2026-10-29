import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { FileText, PlusCircle, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { LPCRecord } from '../../types/index';
import jsPDF from 'jspdf';

export const LpcModule: React.FC = () => {
  const { employee, user, addToast, showProcessing, hideProcessing } = useAuth();
  const [lpcList, setLpcList] = useState<LPCRecord[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [targetEmpId, setTargetEmpId] = useState(employee?.employeeId || '');
  const [newOffice, setNewOffice] = useState('District Education Office, Puri');
  const [relievingDate, setRelievingDate] = useState('2026-08-15');
  const [lastSalaryMonth, setLastSalaryMonth] = useState('July 2026');
  const [remarks, setRemarks] = useState('All government dues and library clearances verified.');

  const fetchLpcs = async () => {
    try {
      const res = await apiFetch('/api/lpc/list');
      const data = await res.json();
      if (data.success) setLpcList(data.records);
    } catch (e) {
      addToast('error', 'Error', 'Failed to load LPC records.');
    }
  };

  useEffect(() => {
    fetchLpcs();
  }, []);

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showProcessing('Generating Last Pay Certificate (LPC)...');

    try {
      const res = await apiFetch('/api/lpc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: targetEmpId,
          newOffice,
          relievingDate,
          lastSalaryMonth,
          remarks
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'LPC Generated', data.message);
        setShowGenerateModal(false);
        fetchLpcs();
      } else {
        addToast('error', 'Generation Failed', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to generate LPC.');
    }
  };

  const handleApproveLpc = async (lpcId: string) => {
    showProcessing('DDO Approving Last Pay Certificate...');
    try {
      const res = await apiFetch('/api/lpc/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lpcId })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'LPC Sanctioned', data.message);
        fetchLpcs();
      } else {
        addToast('error', 'Approval Error', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to approve LPC.');
    }
  };

  const downloadLpcPDF = (lpc: LPCRecord) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('HRMS ODISHA - LAST PAY CERTIFICATE (LPC)', 14, 20);
    doc.setFontSize(10);
    doc.text(`LPC Certificate No: ${lpc.lpcNumber}`, 14, 28);
    doc.text(`Employee Name: ${lpc.employeeName} (${lpc.employeeId})`, 14, 34);
    doc.text(`Relieved From: ${lpc.previousOffice}`, 14, 40);
    doc.text(`Transferred To: ${lpc.newOffice}`, 14, 46);
    doc.text(`Relieving Date: ${lpc.relievingDate} | Last Salary Month: ${lpc.lastSalaryMonth}`, 14, 52);

    doc.setFontSize(12);
    doc.text('PAY & ALLOWANCE DETAILS AT RELIEF', 14, 64);
    doc.setFontSize(9);
    doc.text(`Basic Pay: Rs ${lpc.basicPay}`, 14, 72);
    doc.text(`Allowances: Rs ${lpc.allowances}`, 14, 78);
    doc.text(`Deductions: Rs ${lpc.deductions}`, 14, 84);
    doc.text(`Pending Govt Dues: Rs ${lpc.pendingDues}`, 14, 90);
    doc.text(`Status: ${lpc.status} (Approved by DDO)`, 14, 96);

    doc.save(`LPC_${lpc.lpcNumber}.pdf`);
    addToast('success', 'LPC Downloaded', `Saved LPC_${lpc.lpcNumber}.pdf`);
  };

  const isDDOOrOfficer = ['DDO', 'ESTABLISHMENT_OFFICER', 'SUPER_ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-rose-600" />
            <h2 className="text-xl font-bold text-slate-800">
              Last Pay Certificate (LPC) Module
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official LPC generation for transferred officers and DDO clearance workflow.
          </p>
        </div>

        {isDDOOrOfficer && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Generate New LPC
          </button>
        )}
      </div>

      {/* LPC List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Issued Last Pay Certificates
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">LPC Number</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Relieved From / To</th>
                <th className="p-3">Relieving Date</th>
                <th className="p-3">Last Salary</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lpcList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No Last Pay Certificates found.
                  </td>
                </tr>
              ) : (
                lpcList.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-rose-600">{l.lpcNumber}</td>
                    <td className="p-3 font-bold text-slate-800">{l.employeeName} ({l.employeeId})</td>
                    <td className="p-3">
                      <div><span className="text-slate-400">From:</span> {l.previousOffice}</div>
                      <div><span className="text-slate-400">To:</span> {l.newOffice}</div>
                    </td>
                    <td className="p-3 font-mono">{l.relievingDate}</td>
                    <td className="p-3 font-semibold">{l.lastSalaryMonth}</td>
                    <td className="p-3">
                      <span className={`font-bold px-2.5 py-0.5 rounded text-[10px] ${
                        l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {isDDOOrOfficer && l.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApproveLpc(l.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 text-[10px]"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => downloadLpcPDF(l)}
                        className="px-2.5 py-1 bg-sky-600 text-white font-bold rounded hover:bg-sky-700 text-[10px]"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-600" />
              Generate Last Pay Certificate (LPC)
            </h3>

            <form onSubmit={handleGenerateSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Employee HRMS ID
                </label>
                <input
                  type="text"
                  value={targetEmpId}
                  onChange={(e) => setTargetEmpId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Transferred New Office
                </label>
                <input
                  type="text"
                  value={newOffice}
                  onChange={(e) => setNewOffice(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Relieving Date
                  </label>
                  <input
                    type="date"
                    value={relievingDate}
                    onChange={(e) => setRelievingDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Last Drawn Salary Month
                  </label>
                  <input
                    type="text"
                    value={lastSalaryMonth}
                    onChange={(e) => setLastSalaryMonth(e.target.value)}
                    placeholder="e.g. July 2026"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Clearance Remarks & Dues Statement
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Issue LPC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { HelpCircle, PlusCircle, CheckCircle2, Clock } from 'lucide-react';
import { Grievance } from '../../types/index';

export const GrievanceModule: React.FC = () => {
  const { employee, addToast, showProcessing, hideProcessing } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [category, setCategory] = useState<'PAY_FIXATION' | 'LEAVE' | 'SERVICE_BOOK' | 'TRANSFER' | 'OTHER'>('PAY_FIXATION');
  const [subject, setSubject] = useState('Discrepancy in DA percentage calculation for June 2026');
  const [description, setDescription] = useState('Requesting verification of DA arrear credited in recent salary disbursement.');

  const fetchGrievances = async () => {
    try {
      const res = await apiFetch('/api/grievances/list');
      const data = await res.json();
      if (data.success) setGrievances(data.records);
    } catch (e) {
      addToast('error', 'Error', 'Failed to load grievance records.');
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showProcessing('Logging Grievance and Generating REQ Tracking Code...');

    try {
      const res = await apiFetch('/api/grievances/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, description })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Grievance Registered', data.message);
        setShowModal(false);
        fetchGrievances();
      } else {
        addToast('error', 'Registration Failed', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to register grievance.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-slate-800">
              Service Requests & Helpdesk Grievance Redressal
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track HRMS ticket resolutions with unique REQ tracking identifiers.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Log New Service Request
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Grievance Tickets & Status
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">REQ Reference No</th>
                <th className="p-3">Category</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Submission Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Official Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {grievances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No grievance requests recorded.
                  </td>
                </tr>
              ) : (
                grievances.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-purple-600">{g.requestNumber}</td>
                    <td className="p-3 font-semibold">{g.category}</td>
                    <td className="p-3 font-bold text-slate-800 max-w-xs truncate">{g.subject}</td>
                    <td className="p-3 font-mono">{g.createdAt.split('T')[0]}</td>
                    <td className="p-3">
                      <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                        {g.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 italic text-[11px]">{g.officialRemarks || 'Under investigation by Establishment Section.'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-200">
              Log Service Request / Grievance Ticket
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
                >
                  <option value="PAY_FIXATION">Pay Fixation & DA Arrears</option>
                  <option value="LEAVE">Leave Account Discrepancy</option>
                  <option value="SERVICE_BOOK">Service Book Correction</option>
                  <option value="TRANSFER">Transfer Order Clarification</option>
                  <option value="OTHER">General HRMS Portal Issue</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Subject Title
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Grievance Particulars & References
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg"
                >
                  Register Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

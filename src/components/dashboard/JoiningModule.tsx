import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { UserPlus, PlusCircle, CheckCircle2 } from 'lucide-react';
import { JoiningReport } from '../../types/index';

export const JoiningModule: React.FC = () => {
  const { employee, user, addToast, showProcessing, hideProcessing } = useAuth();
  const [reports, setReports] = useState<JoiningReport[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [postingOrderNumber, setPostingOrderNumber] = useState('PRDW-BBSR/2026/9901');
  const [postingOrderDate, setPostingOrderDate] = useState('2026-07-20');
  const [placeOfPosting, setPlaceOfPosting] = useState('Panchayati Raj & Drinking Water Department, Bhubaneswar');
  const [joiningDate, setJoiningDate] = useState('2026-08-01');
  const [joiningTime, setJoiningTime] = useState<'FORENOON' | 'AFTERNOON'>('FORENOON');
  const [remarks, setRemarks] = useState('Reported for duty in forenoon.');

  const fetchReports = async () => {
    try {
      const res = await apiFetch('/api/joining/list');
      const data = await res.json();
      if (data.success) setReports(data.reports);
    } catch (e) {
      addToast('error', 'Error', 'Failed to load joining reports.');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showProcessing('Submitting Joining Report...');

    try {
      const res = await apiFetch('/api/joining/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postingOrderNumber,
          postingOrderDate,
          placeOfPosting,
          joiningDate,
          joiningTime,
          remarks
        })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Report Submitted', data.message);
        setShowSubmitModal(false);
        fetchReports();
      } else {
        addToast('error', 'Error', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to submit report.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-cyan-600" />
            <h2 className="text-xl font-bold text-slate-800">
              Joining Report & Acceptance Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Formal assumption of charge upon appointment or transfer.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Submit Joining Report
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Submitted Joining Reports
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">Report Number</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Posting Order & Date</th>
                <th className="p-3">Place of Posting</th>
                <th className="p-3">Joining Date & Time</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No joining reports recorded.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-cyan-600">{r.reportNumber}</td>
                    <td className="p-3 font-bold text-slate-800">{r.employeeName}</td>
                    <td className="p-3">
                      <div className="font-mono">{r.postingOrderNumber}</div>
                      <div className="text-[10px] text-slate-400">{r.postingOrderDate}</div>
                    </td>
                    <td className="p-3 font-semibold">{r.placeOfPosting}</td>
                    <td className="p-3">
                      <div className="font-mono">{r.joiningDate}</div>
                      <div className="text-[10px] font-bold text-emerald-600">{r.joiningTime}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-200">
              Submit Official Joining Report
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Posting Order Number
                  </label>
                  <input
                    type="text"
                    value={postingOrderNumber}
                    onChange={(e) => setPostingOrderNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={postingOrderDate}
                    onChange={(e) => setPostingOrderDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Place of Posting / Office
                </label>
                <input
                  type="text"
                  value={placeOfPosting}
                  onChange={(e) => setPlaceOfPosting(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Joining Session Time
                  </label>
                  <select
                    value={joiningTime}
                    onChange={(e) => setJoiningTime(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
                  >
                    <option value="FORENOON">Forenoon (FN)</option>
                    <option value="AFTERNOON">Afternoon (AN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Remarks
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
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { FileCheck2, PlusCircle, CheckCircle2, Clock } from 'lucide-react';
import { EParReport } from '../../types/index';

export const EParModule: React.FC = () => {
  const { employee, addToast, showProcessing, hideProcessing } = useAuth();
  const [epars, setEpars] = useState<EParReport[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [selfAppraisal, setSelfAppraisal] = useState(
    'Achieved 100% processing of monthly salary bills and e-governance file digitization.'
  );

  const fetchEpars = async () => {
    try {
      const res = await apiFetch('/api/epar/list');
      const data = await res.json();
      if (data.success) setEpars(data.records);
    } catch (e) {
      addToast('error', 'Error', 'Failed to load e-PAR records.');
    }
  };

  useEffect(() => {
    fetchEpars();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showProcessing('Submitting Self-Appraisal e-PAR...');

    try {
      const res = await apiFetch('/api/epar/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialYear, selfAppraisal })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'e-PAR Submitted', data.message);
        setShowModal(false);
        fetchEpars();
      } else {
        addToast('error', 'Error', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to submit e-PAR.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-fuchsia-600" />
            <h2 className="text-xl font-bold text-slate-800">
              e-PAR (Electronic Performance Appraisal Report)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Annual performance assessment, reporting officer grading, and appraisal archives.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Submit e-PAR Self Appraisal
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Performance Appraisal History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">Financial Year</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Self Appraisal Brief</th>
                <th className="p-3">Grading Score</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {epars.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No e-PAR records found.
                  </td>
                </tr>
              ) : (
                epars.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-fuchsia-600">{e.financialYear}</td>
                    <td className="p-3 font-bold text-slate-800">{e.employeeName}</td>
                    <td className="p-3 max-w-xs truncate text-slate-600">{e.selfAppraisal}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600">{e.gradingScore || 'Under Review'}</td>
                    <td className="p-3">
                      <span className="bg-fuchsia-100 text-fuchsia-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                        {e.status}
                      </span>
                    </td>
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
              Submit Annual Self Appraisal (e-PAR)
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Financial Year
                </label>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Self Appraisal Summary & Major Achievements
                </label>
                <textarea
                  rows={4}
                  value={selfAppraisal}
                  onChange={(e) => setSelfAppraisal(e.target.value)}
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
                  className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Submit e-PAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { Building, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Loan } from '../../types/index';

export const LoanModule: React.FC = () => {
  const { employee, addToast, showProcessing, hideProcessing } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [loanType, setLoanType] = useState<Loan['loanType']>('HOUSE_BUILDING');
  const [amount, setAmount] = useState(200000);
  const [installment, setInstallment] = useState(2500);

  const fetchLoans = async () => {
    if (!employee) return;
    try {
      const res = await apiFetch(`/api/loans/${employee.employeeId}`);
      const data = await res.json();
      if (data.success) setLoans(data.loans);
    } catch (e) {
      addToast('error', 'Error', 'Failed to load loan records.');
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [employee]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showProcessing('Submitting Loan Application to DDO...');

    try {
      const res = await apiFetch('/api/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanType, amount, installment })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Loan Application Submitted', data.message);
        setShowApplyModal(false);
        fetchLoans();
      } else {
        addToast('error', 'Error', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to apply for loan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-slate-800">
              Government Loan & Advance Account
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            House Building Advance (HBA), Computer Advance, and Festival Loan recovery ledgers.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for Loan / Advance
        </button>
      </div>

      {/* Active Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Active Loans & Sanctioned Recovery Schedules
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">Sanction No</th>
                <th className="p-3">Loan Type</th>
                <th className="p-3">Original Amount</th>
                <th className="p-3">Monthly Installment</th>
                <th className="p-3">Recovered Amount</th>
                <th className="p-3">Outstanding Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No loan recovery records found in database.
                  </td>
                </tr>
              ) : (
                loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-sky-600">{l.sanctionNo}</td>
                    <td className="p-3 font-semibold">{l.loanType}</td>
                    <td className="p-3 font-mono font-bold">₹{l.originalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-mono text-emerald-600 font-bold">₹{l.monthlyInstallment.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-mono text-slate-600">₹{l.recoveredAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-mono text-rose-600 font-bold">₹{l.outstandingAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-200">
              Apply for Government Advance / Loan
            </h3>

            <form onSubmit={handleApplySubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Loan Category
                </label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="HOUSE_BUILDING">House Building Advance (HBA)</option>
                  <option value="COMPUTER">Computer / Laptop Advance</option>
                  <option value="FESTIVAL">Festival Advance</option>
                  <option value="PERSONAL">Personal Emergency Advance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Requested Sanction Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Proposed Monthly Recovery Installment (₹)
                </label>
                <input
                  type="number"
                  value={installment}
                  onChange={(e) => setInstallment(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

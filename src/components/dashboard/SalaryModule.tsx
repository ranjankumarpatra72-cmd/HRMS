import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import {
  CreditCard,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  FileText,
  DollarSign,
  Play,
  Building,
  ShieldCheck
} from 'lucide-react';
import { SalaryRecord } from '../../types/index';
import jsPDF from 'jspdf';

export const SalaryModule: React.FC = () => {
  const { employee, user, addToast, showProcessing, hideProcessing } = useAuth();
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'payslips' | 'ddo_engine'>('payslips');

  // Month & Year Filter
  const [selectedMonth, setSelectedMonth] = useState<number>(6);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // DDO Processing state
  const [processMonth, setProcessMonth] = useState<number>(7);
  const [processYear, setProcessYear] = useState<number>(2026);

  const fetchSalaries = async () => {
    if (!employee) return;
    try {
      const res = await apiFetch(`/api/salary/list/${employee.employeeId}`);
      const data = await res.json();
      if (data.success && data.records.length > 0) {
        setSalaryRecords(data.records);
        setSelectedRecord(data.records[0]);
      }
    } catch (e) {
      addToast('error', 'Error', 'Failed to load salary records.');
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [employee]);

  const handleProcessSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    showProcessing(`Processing Batch Payroll Calculation for ${processMonth}/${processYear}...`);

    try {
      const res = await apiFetch('/api/salary/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: processMonth, year: processYear })
      });

      const data = await res.json();
      hideProcessing();

      if (data.success) {
        addToast('success', 'Payroll Generated', data.message);
        fetchSalaries();
        setActiveTab('payslips');
      } else {
        addToast('error', 'Processing Failed', data.message);
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to run payroll batch.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!selectedRecord || !employee) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('HRMS ODISHA - OFFICIAL SALARY PAYSLIP', 14, 20);
    doc.setFontSize(10);
    doc.text(`Month & Year: ${selectedRecord.month}/${selectedRecord.year}`, 14, 28);
    doc.text(`Employee ID: ${employee.employeeId} | Name: ${employee.name}`, 14, 34);
    doc.text(`Designation: ${employee.designation} | Pay Level: ${selectedRecord.payLevel}`, 14, 40);

    doc.setFontSize(12);
    doc.text('EARNINGS & ALLOWANCES', 14, 52);
    doc.setFontSize(9);
    doc.text(`Basic Pay: Rs ${selectedRecord.basicPay}`, 14, 60);
    doc.text(`Dearness Allowance (DA): Rs ${selectedRecord.da}`, 14, 66);
    doc.text(`House Rent Allowance (HRA): Rs ${selectedRecord.hra}`, 14, 72);
    doc.text(`Gross Salary: Rs ${selectedRecord.grossSalary}`, 14, 78);

    doc.setFontSize(12);
    doc.text('DEDUCTIONS & RECOVERIES', 110, 52);
    doc.setFontSize(9);
    doc.text(`NPS Contribution: Rs ${selectedRecord.npsContribution}`, 110, 60);
    doc.text(`Professional Tax: Rs ${selectedRecord.professionalTax}`, 110, 66);
    doc.text(`Income Tax (TDS): Rs ${selectedRecord.incomeTax}`, 110, 72);
    doc.text(`Loan Recoveries: Rs ${selectedRecord.loanRecovery}`, 110, 78);
    doc.text(`Total Deductions: Rs ${selectedRecord.totalDeductions}`, 110, 84);

    doc.setFontSize(14);
    doc.text(`NET SALARY PAYABLE: Rs ${selectedRecord.netPay}`, 14, 100);

    doc.save(`Payslip_${employee.employeeId}_${selectedRecord.month}_${selectedRecord.year}.pdf`);
    addToast('success', 'Payslip PDF Saved', 'PDF file downloaded successfully.');
  };

  const isDDO = ['DDO', 'SUPER_ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-violet-600" />
            <h2 className="text-xl font-bold text-slate-800">
              Salary Account & Monthly Payslips
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Certified pay level breakdown, allowances, GPF/NPS deductions, and net credit advice.
          </p>
        </div>

        {isDDO && (
          <button
            onClick={() => setActiveTab(activeTab === 'payslips' ? 'ddo_engine' : 'payslips')}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <Play className="w-4 h-4" />
            {activeTab === 'payslips' ? 'DDO Batch Payroll Engine' : 'View Payslips'}
          </button>
        )}
      </div>

      {activeTab === 'payslips' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Month Selectors */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md space-y-3 print:hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
              Monthly Salary Statements
            </h3>

            <div className="space-y-2">
              {salaryRecords.map((rec) => {
                const isSelected = selectedRecord?.id === rec.id;
                return (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-violet-900/80 border-violet-500 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">
                        Month {rec.month} / {rec.year}
                      </div>
                      <div className="text-[10px] opacity-80">Paid on {rec.paymentDate}</div>
                    </div>
                    <div className="text-right font-mono font-extrabold text-emerald-400">
                      ₹{rec.netPay.toLocaleString('en-IN')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Payslip View */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
            {selectedRecord && employee ? (
              <div className="space-y-6">
                {/* Payslip Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      PAYSLIP FOR MONTH: {selectedRecord.month}/{selectedRecord.year}
                    </h3>
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Disbursed on {selectedRecord.paymentDate} (Status: {selectedRecord.paymentStatus})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700"
                    >
                      <Printer className="w-3.5 h-3.5 inline mr-1" /> Print
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="px-3 py-1.5 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700"
                    >
                      <Download className="w-3.5 h-3.5 inline mr-1" /> PDF
                    </button>
                  </div>
                </div>

                {/* Employee Info Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs border border-slate-200">
                  <div><span className="text-slate-400 font-semibold">Employee Name:</span> <div className="font-bold text-slate-800">{employee.name}</div></div>
                  <div><span className="text-slate-400 font-semibold">HRMS ID:</span> <div className="font-mono font-bold text-sky-600">{employee.employeeId}</div></div>
                  <div><span className="text-slate-400 font-semibold">Designation:</span> <div className="font-bold text-slate-800">{employee.designation}</div></div>
                  <div><span className="text-slate-400 font-semibold">Pay Level:</span> <div className="font-bold">{selectedRecord.payLevel}</div></div>
                  <div><span className="text-slate-400 font-semibold">PAN Number:</span> <div className="font-mono">{employee.panNumber}</div></div>
                  <div><span className="text-slate-400 font-semibold">GPF/NPS No:</span> <div className="font-mono">{employee.gpfNpsNo}</div></div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Earnings Column */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-emerald-50 p-2.5 font-bold text-emerald-900 border-b border-emerald-200 uppercase tracking-wider">
                      Gross Earnings & Allowances
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between"><span>Basic Pay</span> <span className="font-mono font-bold">₹{selectedRecord.basicPay.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Dearness Allowance (DA 50%)</span> <span className="font-mono font-bold">₹{selectedRecord.da.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>House Rent Allowance (HRA)</span> <span className="font-mono font-bold">₹{selectedRecord.hra.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Medical Allowance</span> <span className="font-mono font-bold">₹{selectedRecord.medicalAllowance.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Special Allowance</span> <span className="font-mono font-bold">₹{selectedRecord.specialAllowance.toLocaleString('en-IN')}</span></div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-emerald-600 text-sm">
                        <span>Total Gross Pay:</span>
                        <span className="font-mono">₹{selectedRecord.grossSalary.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Column */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-rose-50 p-2.5 font-bold text-rose-900 border-b border-rose-200 uppercase tracking-wider">
                      Deductions & Recoveries
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between"><span>NPS Employee Share</span> <span className="font-mono font-bold">₹{selectedRecord.npsContribution.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Professional Tax (PT)</span> <span className="font-mono font-bold">₹{selectedRecord.professionalTax.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Income Tax (TDS)</span> <span className="font-mono font-bold">₹{selectedRecord.incomeTax.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>HBA / Loan Recovery</span> <span className="font-mono font-bold">₹{selectedRecord.loanRecovery.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Group Insurance (GIS)</span> <span className="font-mono font-bold">₹{selectedRecord.gis.toLocaleString('en-IN')}</span></div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-rose-600 text-sm">
                        <span>Total Deductions:</span>
                        <span className="font-mono">₹{selectedRecord.totalDeductions.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Payable Highlight Banner */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between border border-slate-700">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">NET SALARY PAYABLE</span>
                    <span className="text-[11px] text-emerald-400">Credited to Salary Account via Treasury e-Disbursement</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    ₹{selectedRecord.netPay.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs text-center py-10">Select a month to view payslip breakdown.</p>
            )}
          </div>
        </div>
      ) : (
        /* DDO Payroll Batch Processing View */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <ShieldCheck className="w-5 h-5 text-violet-600" />
            <h3 className="text-base font-bold text-slate-800">
              DDO Automated Payroll Engine
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Authorized DDO / Accounts Officers can trigger batch salary calculation for all active employees across the department. The backend engine automatically computes DA, HRA, NPS, Professional Tax, and Loan recoveries.
          </p>

          <form onSubmit={handleProcessSalary} className="max-w-md space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Process Month
                </label>
                <select
                  value={processMonth}
                  onChange={(e) => setProcessMonth(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>Month {m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Process Year
                </label>
                <input
                  type="number"
                  value={processYear}
                  onChange={(e) => setProcessYear(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Execute Batch Payroll Computation</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Award, TrendingUp, CheckCircle2 } from 'lucide-react';

export const PromotionIncrementModule: React.FC = () => {
  const { employee } = useAuth();

  if (!employee) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-slate-800">
            Promotion & Annual Increment Ledger
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Historical progression of pay matrix, grade upgrades, and annual increment sanction orders.
        </p>
      </div>

      {/* Current Pay Level Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Current Pay Level</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{employee.payLevel}</div>
          <p className="text-xs text-sky-600 font-semibold mt-1">Level 10 (ORM Matrix)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Basic Pay</span>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">₹{employee.basicPay.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-500 mt-1">Effective from 2026-07-01</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Next Increment Due</span>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">2027-07-01</div>
          <p className="text-xs text-slate-500 mt-1">3% Annual Band Step</p>
        </div>
      </div>

      {/* Cadre Promotion History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-200">
          Cadre Promotion Records
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-2.5">Previous Post</th>
                <th className="p-2.5">Promoted Post</th>
                <th className="p-2.5">Pay Level</th>
                <th className="p-2.5">Effective Date</th>
                <th className="p-2.5">Sanction Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2.5 text-slate-600">Junior Assistant</td>
                <td className="p-2.5 font-bold text-orange-600">Senior Assistant</td>
                <td className="p-2.5 font-semibold">Level 9</td>
                <td className="p-2.5 font-mono">2018-10-01</td>
                <td className="p-2.5 font-mono text-[10px] text-slate-400">DHE/ORDER/2018/8890</td>
              </tr>
              <tr>
                <td className="p-2.5 text-slate-600">Senior Assistant</td>
                <td className="p-2.5 font-bold text-orange-600">Section Officer</td>
                <td className="p-2.5 font-semibold">Level 10</td>
                <td className="p-2.5 font-mono">2023-04-15</td>
                <td className="p-2.5 font-mono text-[10px] text-slate-400">DHE/ORDER/2023/1023</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

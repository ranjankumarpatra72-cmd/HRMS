import React, { useState } from 'react';
import {
  KeyRound,
  X,
  Shield,
  HelpCircle,
  Mail,
  Phone,
  UserCheck,
  CheckCircle2,
  Building2,
  AlertCircle
} from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCredential?: (type: 'ddo' | 'employee', user: string, pass: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSelectCredential
}) => {
  const [empId, setEmpId] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  if (!isOpen) return null;

  const handleSendResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId.trim()) return;
    setRequestSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-sky-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600/40 border border-sky-400/30 flex items-center justify-center text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                HRMS Password & Credential Recovery
              </h3>
              <p className="text-[11px] text-sky-200 font-medium">
                Panchayati Raj & Drinking Water Department
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-700 text-xs">
          {/* Official Reset Policy Advisory */}
          <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 space-y-1.5">
            <h4 className="font-bold text-sky-900 text-xs flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sky-700" />
              Standard Institutional Reset Protocol
            </h4>
            <p className="text-slate-600 leading-relaxed">
              In accordance with government cybersecurity standards, employee account passwords are administered and reset by the <strong>Drawing & Disbursing Officer (DDO)</strong> or <strong>Establishment Section</strong>.
            </p>
          </div>

          {/* Quick Request Section */}
          {!requestSent ? (
            <form onSubmit={handleSendResetRequest} className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-bold text-slate-800">
                Submit Self-Service Password Reset Request:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="Enter your HRMS ID (e.g. EMP10001)"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg uppercase font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  Submit Request
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                A notification will be routed to your respective DDO queue for one-click approval.
              </p>
            </form>
          ) : (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Reset Request Logged Successfully
              </div>
              <p className="text-[11px] text-emerald-800">
                Request for <strong className="font-mono">{empId.toUpperCase()}</strong> has been submitted to the DDO Establishment inbox. Default password resets to <strong className="font-mono">Password123!</strong> upon DDO confirmation.
              </p>
            </div>
          )}

          {/* Testing Quick-Fill Reference */}
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
            <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              Official Testing Accounts &amp; Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              <div
                onClick={() => {
                  if (onSelectCredential) {
                    onSelectCredential('ddo', 'EMP20267858', 'Ranjan@2004');
                    onClose();
                  }
                }}
                className="p-2.5 bg-white rounded-lg border border-amber-300 hover:border-sky-500 cursor-pointer transition-all shadow-2xs group"
              >
                <div className="font-bold text-slate-900 font-sans flex items-center justify-between text-xs">
                  <span>DDO Account</span>
                  <span className="text-[10px] text-sky-600 group-hover:underline">Use & Login</span>
                </div>
                <div className="text-slate-600 mt-1">ID: <span className="font-bold text-sky-700">EMP20267858</span></div>
                <div className="text-slate-600">PWD: <span className="font-bold text-emerald-700">Ranjan@2004</span></div>
              </div>

              <div
                onClick={() => {
                  if (onSelectCredential) {
                    onSelectCredential('employee', 'EMP10001', 'Password123!');
                    onClose();
                  }
                }}
                className="p-2.5 bg-white rounded-lg border border-amber-300 hover:border-sky-500 cursor-pointer transition-all shadow-2xs group"
              >
                <div className="font-bold text-slate-900 font-sans flex items-center justify-between text-xs">
                  <span>Staff / Employee</span>
                  <span className="text-[10px] text-sky-600 group-hover:underline">Use & Login</span>
                </div>
                <div className="text-slate-600 mt-1">ID: <span className="font-bold text-sky-700">EMP10001</span></div>
                <div className="text-slate-600">PWD: <span className="font-bold text-emerald-700">Password123!</span></div>
              </div>
            </div>
          </div>

          {/* Helpdesk Support Contacts */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-slate-600">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-600" />
              <span>Toll-Free Support: <strong>1800-345-6789</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              <span>hrms-support@odisha.gov.in</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

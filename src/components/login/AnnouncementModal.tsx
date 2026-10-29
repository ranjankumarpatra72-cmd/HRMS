import React from 'react';
import {
  Bell,
  X,
  FileText,
  Calendar,
  Building2,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/50 border border-sky-400/40 flex items-center justify-center text-white shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                Official Department Notification & Circular
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                HRMS Portal Announcements (2025–26)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm">
          {/* Main Circular Item */}
          <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-sky-900">
              <span className="bg-sky-200/80 px-2.5 py-0.5 rounded-full font-mono text-[11px]">
                Circular No. PRDW-HRMS-2026/0842
              </span>
              <span className="flex items-center gap-1 text-slate-500 font-normal text-xs">
                <Calendar className="w-3.5 h-3.5" /> Date: 15-Aug-2026
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              Annual Performance Appraisal Report (e-PAR) Submission & Aadhaar Seeding Schedule
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              All Panchayati Raj & Drinking Water Department employees, Panchayat Executive Officers (PEO), and Block staff are hereby notified that the electronic appraisal module (e-PAR) for the financial year 2025–26 is active. The final date for self-appraisal submission is 30th September 2026.
            </p>
          </div>

          {/* Bulleted Directives */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600" /> Key Guidelines & Compliance:
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 pl-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Digital Service Book Verification:</strong> DDOs must ensure all service history, increments, and leave records are validated prior to the upcoming quarter audit.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>LPC & Transfer Processing:</strong> Online transfer forwarding and Last Pay Certificate (LPC) generation must be performed strictly through the HRMS workflow.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Security Advisory:</strong> Never share your HRMS password or OTP with anyone. DDOs are requested to rotate administrative passwords every 90 days.
                </span>
              </li>
            </ul>
          </div>

          {/* Issuing Authority */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-800">Panchayati Raj & Drinking Water Department</p>
              <p>Government of Odisha, Lok Seva Bhawan, Bhubaneswar</p>
            </div>
            <div className="text-right font-mono text-[11px] text-slate-400">
              Ref: HRMS/OD/2026-V4
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Notice</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Close Announcement
          </button>
        </div>
      </div>
    </div>
  );
};

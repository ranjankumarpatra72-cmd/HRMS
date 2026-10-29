import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { CommunicationItem, CommunicationAttachment } from '../../types/index';
import { downloadCommunicationPdfFile } from '../../utils/communicationPdfGenerator';
import { CommunicationPdfViewerModal } from './CommunicationPdfViewerModal';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  CreditCard,
  Building,
  GraduationCap,
  Shield,
  HelpCircle,
  Award,
  Send,
  ExternalLink,
  Mail,
  Paperclip,
  Check,
  CheckCheck,
  Eye,
  Clock,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface ModalProps {
  type: string | null;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const EmployeeDashboardModals: React.FC<ModalProps> = ({
  type,
  onClose,
  onNavigateTab
}) => {
  const { user, employee, addToast } = useAuth();
  const [supportCategory, setSupportCategory] = useState('Service Book / Profile Correction');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState('');

  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionDesc, setSuggestionDesc] = useState('');
  const [suggestionDept, setSuggestionDept] = useState('Panchayati Raj & Drinking Water Department');
  const [suggestionSuccess, setSuggestionSuccess] = useState(false);

  const [correctionField, setCorrectionField] = useState('Educational Qualification');
  const [correctionCurrentVal, setCorrectionCurrentVal] = useState('B.A. (Arts)');
  const [correctionNewVal, setCorrectionNewVal] = useState('M.A. (Public Administration)');
  const [correctionReason, setCorrectionReason] = useState('Degree completed and approved by appointing authority');
  const [correctionSubmitted, setCorrectionSubmitted] = useState(false);

  // Communications live state
  const [communications, setCommunications] = useState<CommunicationItem[]>([]);
  const [loadingComm, setLoadingComm] = useState(false);
  const [selectedCommDetail, setSelectedCommDetail] = useState<CommunicationItem | null>(null);
  const [viewingPdfModal, setViewingPdfModal] = useState<{ comm: CommunicationItem; att?: CommunicationAttachment } | null>(null);

  useEffect(() => {
    if (type === 'communication') {
      fetchCommunications();
    }
  }, [type]);

  const fetchCommunications = async () => {
    try {
      setLoadingComm(true);
      const res = await apiFetch('/api/communications');
      const data = await res.json();
      if (data.success) {
        setCommunications(data.communications || []);
      }
    } catch (e) {
      console.error('Failed to fetch communications in modal', e);
    } finally {
      setLoadingComm(false);
    }
  };

  const handleMarkAsRead = async (comm: CommunicationItem) => {
    try {
      const res = await apiFetch(`/api/communications/${comm.id}/read`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCommunications(prev =>
          prev.map(c => (c.id === comm.id ? { ...c, isRead: true } : c))
        );
        if (selectedCommDetail && selectedCommDetail.id === comm.id) {
          setSelectedCommDetail(prev => prev ? { ...prev, isRead: true } : null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadAttachment = (att: CommunicationAttachment, comm: CommunicationItem) => {
    downloadCommunicationPdfFile(comm, att);
    addToast('success', 'Downloaded', `Attachment ${att.fileName} downloaded.`);
  };

  if (!type || !employee) return null;

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const genTicket = `HRMS-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketNo(genTicket);
    setSupportSuccess(true);
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestionSuccess(true);
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCorrectionSubmitted(true);
  };

  const renderModalContent = () => {
    switch (type) {
      case 'communication':
        if (selectedCommDetail) {
          return (
            <div className="space-y-4 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCommDetail(null)}
                className="text-sky-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                &larr; Back to all notices
              </button>

              <div className="bg-sky-50 p-3.5 rounded-xl border border-sky-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sky-900 bg-white px-2 py-0.5 rounded border border-sky-300">
                    Ref: {selectedCommDetail.referenceNo}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(selectedCommDetail.publishDate || selectedCommDetail.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedCommDetail.title}</h4>
                <div className="text-[11px] text-slate-600">
                  Authority: <strong>{selectedCommDetail.senderName}</strong> ({selectedCommDetail.senderDesignation})
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line">
                {selectedCommDetail.content}
              </div>

              {selectedCommDetail.attachments && selectedCommDetail.attachments.length > 0 && (
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                    Official PDF Enclosures &amp; Attachments ({selectedCommDetail.attachments.length})
                  </span>
                  <div className="space-y-1.5">
                    {selectedCommDetail.attachments.map(att => (
                      <div key={att.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs gap-2">
                        <span className="flex items-center gap-2 text-slate-800 font-medium truncate max-w-[280px]">
                          <div className="w-6 h-6 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            PDF
                          </div>
                          <span className="truncate">{att.fileName}</span>
                          <span className="text-slate-400 font-mono text-[10px]">({att.fileSize})</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewingPdfModal({ comm: selectedCommDetail, att })}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer border border-red-200"
                            title="View PDF document"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(att, selectedCommDetail)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer border border-slate-300"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab('communication');
                  }}
                  className="text-sky-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Communication Center</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-3 text-xs">
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-sky-900 block">Establishment Communications</span>
                <p className="text-sky-700 text-[11px]">Real-time official notices and circulars issued by DDO / Admin.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab('communication');
                }}
                className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <span>Full View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {loadingComm ? (
              <div className="p-6 text-center text-slate-400">Loading synchronized communications...</div>
            ) : communications.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No active notices found.</div>
            ) : (
              <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto pr-1">
                {communications.map(comm => (
                  <div
                    key={comm.id}
                    onClick={() => {
                      setSelectedCommDetail(comm);
                      if (!comm.isRead) handleMarkAsRead(comm);
                    }}
                    className={`py-3 px-2 hover:bg-sky-50/50 rounded-lg transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      !comm.isRead ? 'bg-sky-50/30' : ''
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!comm.isRead && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        )}
                        <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          {comm.referenceNo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(comm.publishDate || comm.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-xs truncate">
                        {comm.title}
                      </h5>
                      <p className="text-slate-500 text-[11px] line-clamp-1">
                        {comm.summary || comm.content}
                      </p>
                      <div className="text-[10px] text-slate-400">
                        From: {comm.senderName} ({comm.senderDesignation})
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        comm.isRead ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 font-extrabold'
                      }`}>
                        {comm.isRead ? 'Read' : 'New'}
                      </span>
                      {comm.attachments && comm.attachments.length > 0 && (
                        <span className="text-[10px] text-sky-700 flex items-center gap-0.5">
                          <Paperclip className="w-3 h-3" />
                          {comm.attachments.length} doc
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'bank-history':
        return (
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">Audit trail of salary disbursement bank account records.</p>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Bank Name</th>
                    <th className="p-2">Account Number</th>
                    <th className="p-2">IFSC Code</th>
                    <th className="p-2">Effective From</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-emerald-50/50">
                    <td className="p-2 font-medium text-slate-800">{employee.bankName || 'State Bank of India'}</td>
                    <td className="p-2 font-mono">{employee.bankAccountNumber || '30894726190'}</td>
                    <td className="p-2 font-mono">{employee.ifscCode || 'SBIN0001023'}</td>
                    <td className="p-2">01-Apr-2021</td>
                    <td className="p-2"><span className="text-emerald-700 font-bold">Active Primary</span></td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-500">UCO Bank</td>
                    <td className="p-2 font-mono text-slate-500">184902100482</td>
                    <td className="p-2 font-mono text-slate-500">UCBA0000847</td>
                    <td className="p-2 text-slate-500">12-Jun-2015</td>
                    <td className="p-2"><span className="text-slate-400">Archived</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'lta':
        return (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px]">Current Block Year</div>
                <div className="text-sm font-bold text-slate-800">2024 – 2027</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px]">Home Town LTA</div>
                <div className="text-sm font-bold text-emerald-700">Available (1 Turn)</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px]">Anywhere in India LTA</div>
                <div className="text-sm font-bold text-sky-700">Available (1 Turn)</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[10px]">Last Availed Date</div>
                <div className="text-sm font-bold text-slate-700">18-Oct-2022</div>
              </div>
            </div>
            <p className="text-slate-600 text-[11px]">
              Leave Travel Concession (LTC/LTA) is regulated under Odisha Leave Rules. To apply, visit the Leave Application module.
            </p>
          </div>
        );

      case 'quarter':
        return (
          <div className="space-y-3 text-xs">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900">
              <div className="font-semibold">Government Residential Accommodation Record</div>
              <div className="mt-1 text-[11px]">Quarter Allocation ID: QTR-BBSR-2022-841</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Quarter Type</span>
                <span className="font-bold text-slate-800">Type-VI Government Quarter</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Quarter Location</span>
                <span className="font-bold text-slate-800">Unit-IX, Bhoi Nagar, Bhubaneswar</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Allotment Date</span>
                <span className="font-bold text-slate-800">14-Aug-2022</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">HRA Deduction Status</span>
                <span className="font-bold text-rose-700">HRA Foregone (Govt Quarter Occupied)</span>
              </div>
            </div>
          </div>
        );

      case 'gis':
        return (
          <div className="space-y-3 text-xs">
            <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg">
              <div className="font-bold text-sky-900">Group Insurance Scheme (GIS) Passbook</div>
              <div className="text-slate-600 text-[11px] mt-0.5">Policy Number: GIS-OD-1994-{employee.employeeId}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-500">Monthly Contribution</div>
                <div className="font-bold text-slate-800 text-sm">₹720 / mo</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-500">Accumulated Savings</div>
                <div className="font-bold text-emerald-700 text-sm">₹84,240</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-500">Insurance Cover</div>
                <div className="font-bold text-sky-700 text-sm">₹7,20,000</div>
              </div>
            </div>
          </div>
        );

      case 'it-report':
        return (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block">Annual Income Tax Statement (FY 2025-26 / AY 2026-27)</span>
                <span className="text-slate-500 text-[11px]">Tax Regime: New Tax Regime (u/s 115BAC)</span>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-sky-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-sky-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Form 16</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-500">Gross Salary</div>
                <div className="font-bold text-slate-800">₹10,56,000</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-500">Standard Deduction</div>
                <div className="font-bold text-emerald-700">₹75,000</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-500">Taxable Income</div>
                <div className="font-bold text-slate-800">₹9,81,000</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-500">TDS Deducted</div>
                <div className="font-bold text-sky-700">₹44,200</div>
              </div>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-900 font-semibold flex items-center justify-between">
              <span>Government of Odisha Official Calendar 2026</span>
              <span className="text-[11px] font-normal text-emerald-800">Department of PR &amp; DW</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="font-bold text-slate-800 block">Upcoming Holidays:</span>
                <ul className="mt-1 space-y-1 text-[11px] list-disc list-inside text-slate-600">
                  <li>05-Mar-2026: Maha Shivaratri</li>
                  <li>25-Mar-2026: Holi (Dola Purnima)</li>
                  <li>01-Apr-2026: Utkal Divas (Odisha Day)</li>
                  <li>14-Apr-2026: Maha Vishuva Sankranti / Ambedkar Jayanti</li>
                </ul>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="font-bold text-slate-800 block">Employee Leave Record:</span>
                <div className="mt-1 space-y-1 text-[11px] text-slate-600">
                  <div>Casual Leaves: <strong className="text-emerald-700">{employee.casualLeaveBalance || 12} days remaining</strong></div>
                  <div>Earned Leaves: <strong className="text-sky-700">{employee.earnedLeaveBalance || 48} days credit</strong></div>
                  <div>Restricted Holidays: <strong>2/2 availed</strong></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'qms-orders':
        return (
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">QMS-OD-2026/04: Revised Standard Operating Procedures</span>
                <span className="text-[10px] text-slate-500">Quality Management System circular for e-Office documentation</span>
              </div>
              <button className="text-sky-600 hover:underline flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">QMS-OD-2025/19: Biometric Attendance &amp; Leave Integration</span>
                <span className="text-[10px] text-slate-500">Mandatory syncing with HRMS leave accounts</span>
              </div>
              <button className="text-sky-600 hover:underline flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
        );

      case 'group-c-promotion':
        return (
          <div className="space-y-3 text-xs">
            <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-lg text-sky-900 font-semibold">
              Group-C Cadre Seniority &amp; Gradation List
            </div>
            <p className="text-slate-600 text-[11px]">
              Final Gradation List of Junior Assistants / Senior Assistants / Section Officers published by the General Administration &amp; Public Grievance Department.
            </p>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">State Cadre Gradation List 2025-26</span>
                <span className="text-[10px] text-slate-500 block">Published on 10-Jan-2026 • Verified</span>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                Eligible for Next Review
              </span>
            </div>
          </div>
        );

      case 'summon':
      case 'disciplinary':
        return (
          <div className="space-y-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>NIL / Clean Record Certificate</span>
              </div>
              <div className="text-[11px] mt-1 text-emerald-800">
                No disciplinary proceedings, vigilance inquiries, court summons, or departmental actions are pending against Employee ID: <strong>{employee.employeeId}</strong>.
              </div>
            </div>
          </div>
        );

      case 'sanctioned-loans':
        return (
          <div className="space-y-3 text-xs">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900">
              <div className="font-bold">Sanctioned Loan Account Details</div>
              <div className="text-[11px] mt-0.5">Government Interest-Bearing &amp; Non-Interest Bearing Advances</div>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2">Loan Type</th>
                    <th className="p-2">Sanction Order</th>
                    <th className="p-2">Sanction Amount</th>
                    <th className="p-2">Monthly EMI</th>
                    <th className="p-2">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2 font-medium">House Building Advance (HBA)</td>
                    <td className="p-2 font-mono">PR-HBA/2023/49</td>
                    <td className="p-2">₹12,00,000</td>
                    <td className="p-2">₹10,000</td>
                    <td className="p-2 font-bold text-amber-700">₹8,40,000</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Festival Advance</td>
                    <td className="p-2 font-mono">DDO-FA/2025/11</td>
                    <td className="p-2">₹20,000</td>
                    <td className="p-2">₹2,000</td>
                    <td className="p-2 font-bold text-emerald-700">Cleared</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'igot':
        return (
          <div className="space-y-3 text-xs">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                  iGOT Mission Karmayogi
                </span>
                <span className="font-semibold text-slate-800">Capacity Building Commission</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                National Programme for Civil Services Capacity Building (NPCSCB). Completed mandatory governance modules.
              </p>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Prevention of Sexual Harassment (PoSH)</span>
                  <span className="text-[10px] text-slate-500">Score: 95% • Certificate Issued</span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[10px]">Completed</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Public Finance &amp; GeM Procurement Rules</span>
                  <span className="text-[10px] text-slate-500">Progress: 80% • In-Progress</span>
                </div>
                <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded text-[10px]">In Progress</span>
              </div>
            </div>
          </div>
        );

      case 'support-ticket':
        return (
          <div className="space-y-3 text-xs">
            {supportSuccess ? (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">Ticket Raised Successfully!</h4>
                <p className="text-slate-600">
                  Your ticket reference number is: <strong className="text-slate-900 font-mono">{ticketNo}</strong>.
                  HRMS technical support team will review within 24-48 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSupportSuccess(false)}
                  className="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Raise Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Issue Category</label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  >
                    <option>Service Book / Profile Correction</option>
                    <option>Salary Slip / Deductions Discrepancy</option>
                    <option>e-PAR Form Submission Query</option>
                    <option>Leave Balance Discrepancy</option>
                    <option>OTP / Mobile Number Update</option>
                    <option>Other Technical Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Description / Remarks</label>
                  <textarea
                    rows={3}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe your issue with employee ID and relevant circular details..."
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#d93829] hover:bg-[#b8291c] text-white font-semibold rounded text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Support Ticket</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        );

      case 'service-book-correction':
        return (
          <div className="space-y-3 text-xs">
            {correctionSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">Correction Request Forwarded to DDO</h4>
                <p className="text-slate-600">
                  Tracking ID: <strong className="font-mono text-slate-800">SBC-2026-098</strong>. Once approved by DDO Officer, your e-Service book will automatically update.
                </p>
                <button
                  type="button"
                  onClick={() => setCorrectionSubmitted(false)}
                  className="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Submit Another Correction
                </button>
              </div>
            ) : (
              <form onSubmit={handleCorrectionSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Field to Correct</label>
                    <select
                      value={correctionField}
                      onChange={(e) => setCorrectionField(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    >
                      <option>Educational Qualification</option>
                      <option>Spouse / Family Nominee Name</option>
                      <option>Home Town Address</option>
                      <option>Blood Group</option>
                      <option>Aadhaar / PAN Reference</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Entry in Service Book</label>
                    <input
                      type="text"
                      value={correctionCurrentVal}
                      onChange={(e) => setCorrectionCurrentVal(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Requested Proposed New Entry</label>
                  <input
                    type="text"
                    value={correctionNewVal}
                    onChange={(e) => setCorrectionNewVal(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white font-medium text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason / Supporting Document Note</label>
                  <textarea
                    rows={2}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request to DDO</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        );

      case 'staff-suggestion':
        return (
          <div className="space-y-3 text-xs">
            {suggestionSuccess ? (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">Suggestion Submitted to Government of Odisha</h4>
                <p className="text-slate-600">
                  Thank you for your valuable idea to improve administrative efficiency in HRMS.
                </p>
                <button
                  type="button"
                  onClick={() => setSuggestionSuccess(false)}
                  className="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSuggestionSubmit} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Suggestion Title</label>
                  <input
                    type="text"
                    value={suggestionTitle}
                    onChange={(e) => setSuggestionTitle(e.target.value)}
                    placeholder="e.g. Online digital signature verification for leave clearance"
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Department</label>
                  <input
                    type="text"
                    value={suggestionDept}
                    onChange={(e) => setSuggestionDept(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Detailed Proposal &amp; Expected Impact</label>
                  <textarea
                    rows={3}
                    value={suggestionDesc}
                    onChange={(e) => setSuggestionDesc(e.target.value)}
                    placeholder="Explain how this suggestion enhances speed, transparency, or cost reduction..."
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#d35400] hover:bg-[#b54600] text-white font-semibold rounded text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to State Innovation Committee</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        );

      case 'online-training':
        return (
          <div className="space-y-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
              <div className="font-bold text-emerald-900">MDRAFM Online Training Programs 2026</div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Madhusudan Das Regional Academy of Financial Management (MDRAFM), Bhubaneswar.
              </p>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Course: Odisha General Financial Rules (OGFR) &amp; Treasury Code</span>
                  <span className="text-[10px] text-slate-500">Mode: Online Webinar • 10 Hours</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Nomination submitted to MDRAFM Portal!')}
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer"
                >
                  Register Now
                </button>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Course: Works Accounting &amp; GST Compliance in Panchayati Raj</span>
                  <span className="text-[10px] text-slate-500">Mode: Self-Paced • 15 Modules</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Nomination submitted to MDRAFM Portal!')}
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer"
                >
                  Register Now
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'communication': return 'My Communication (Official Notices)';
      case 'bank-history': return 'Bank Details Change History';
      case 'lta': return 'Annual LTA Balance Slip';
      case 'quarter': return 'My Government Quarter Details';
      case 'gis': return 'My GIS (Group Insurance Scheme) Passbook';
      case 'it-report': return 'Annual Income Tax Report & Form 16';
      case 'calendar': return 'Official Government Calendar & Leave Schedule';
      case 'qms-orders': return 'QMS Orders, Circulars & Standard Notices';
      case 'group-c-promotion': return 'Group C Promotion & Gradation Record';
      case 'summon': return 'My Summons & Legal Notices';
      case 'disciplinary': return 'Disciplinary Proceedings Record';
      case 'sanctioned-loans': return 'Sanctioned Government Loan List';
      case 'igot': return 'i-GOT Mission Karmayogi Learning Portfolio';
      case 'support-ticket': return 'Online Support Desk & Grievance Ticket';
      case 'service-book-correction': return 'e-Service Book Correction Request';
      case 'staff-suggestion': return 'Staff Suggestion Scheme Submission';
      case 'online-training': return 'Apply for Online Training (MDRAFM)';
      default: return 'HRMS Record Details';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className={`bg-white rounded-xl shadow-2xl border border-slate-300 w-full ${type === 'communication' ? 'max-w-2xl' : 'max-w-lg'} overflow-hidden flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="bg-[#2980b9] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
          <h3 className="font-semibold text-xs sm:text-sm tracking-tight">{getTitle()}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">{renderModalContent()}</div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {viewingPdfModal && (
        <CommunicationPdfViewerModal
          comm={viewingPdfModal.comm}
          attachment={viewingPdfModal.att}
          onClose={() => setViewingPdfModal(null)}
        />
      )}
    </div>
  );
};

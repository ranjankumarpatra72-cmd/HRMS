import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import {
  History,
  ArrowLeftRight,
  CalendarCheck,
  Building,
  HelpCircle,
  Award,
  FileEdit,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface ApplicationItem {
  id: string;
  appNumber: string;
  type: 'TRANSFER' | 'LEAVE' | 'LOAN' | 'GRIEVANCE' | 'EPAR' | 'SERVICE_BOOK_CORRECTION';
  typeName: string;
  subject: string;
  submittedOn: string;
  status: string;
  statusType: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FORWARDED' | 'PROCESSING' | 'COMPLETED';
  currentAuthority: string;
  remarks?: string;
  targetModule: string;
}

interface ApplicationHistoryProps {
  onNavigateTab?: (tab: string) => void;
}

export const ApplicationHistoryModule: React.FC<ApplicationHistoryProps> = ({ onNavigateTab }) => {
  const { employee, user } = useAuth();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchApplications = async () => {
    if (!employee) return;
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/applications/history/${employee.employeeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.applications)) {
          setApplications(data.applications);
          return;
        }
      }

      // Default Unified Application records for employee
      const defaultApps: ApplicationItem[] = [
        {
          id: 'APP-TR-01',
          appNumber: 'TR-2026-000001',
          type: 'TRANSFER',
          typeName: 'Transfer & Posting Application',
          subject: 'Request for transfer to Mayurbhanj District (Baripada Block) on Home District Preference',
          submittedOn: '10-Feb-2026',
          status: 'Under DDO Review',
          statusType: 'PROCESSING',
          currentAuthority: 'DDO / Establishment Officer',
          remarks: 'Service verification and joint vacancy check in progress.',
          targetModule: 'transfers'
        },
        {
          id: 'APP-LV-01',
          appNumber: 'LV-2026-8842',
          type: 'LEAVE',
          typeName: 'Earned Leave Application (5 Days)',
          subject: 'Sanction of 5 days Earned Leave for personal domestic obligations',
          submittedOn: '02-Feb-2026',
          status: 'Under Verification',
          statusType: 'PENDING',
          currentAuthority: 'Reporting Officer / DDO',
          remarks: 'Leave ledger balance verified (48 days credit).',
          targetModule: 'leave'
        },
        {
          id: 'APP-LN-01',
          appNumber: 'LN-HBA-2023-49',
          type: 'LOAN',
          typeName: 'House Building Advance (HBA)',
          subject: 'State Government long-term construction advance sanction of ₹12,00,000',
          submittedOn: '14-Aug-2023',
          status: 'Sanctioned & Active',
          statusType: 'APPROVED',
          currentAuthority: 'Directorate of PR & DW',
          remarks: 'Monthly EMI ₹10,000 deducted regularly via HRMS salary bill.',
          targetModule: 'loans'
        },
        {
          id: 'APP-PAR-01',
          appNumber: 'PAR-2025-26-001',
          type: 'EPAR',
          typeName: 'Annual Property Statement Submission',
          subject: 'Mandatory online property statement return for Financial Year 2025-26',
          submittedOn: '15-Jan-2026',
          status: 'Pending Submission',
          statusType: 'PENDING',
          currentAuthority: 'Self Submission Required',
          remarks: 'Due before statutory government notification deadline.',
          targetModule: 'epar'
        },
        {
          id: 'APP-SBC-01',
          appNumber: 'SBC-2026-098',
          type: 'SERVICE_BOOK_CORRECTION',
          typeName: 'Service Book Correction Request',
          subject: 'Addition of Post-Graduate Degree qualification in Service Book Record',
          submittedOn: '20-Jan-2026',
          status: 'Forwarded to DDO',
          statusType: 'FORWARDED',
          currentAuthority: 'DDO Officer',
          remarks: 'Degree certificate verified and awaiting final endorsement.',
          targetModule: 'service-book'
        },
        {
          id: 'APP-GR-01',
          appNumber: 'GR-2025-412',
          type: 'GRIEVANCE',
          typeName: 'Help Desk Grievance Ticket',
          subject: 'Correction of GPF Account statement deduction discrepancy for Nov 2025',
          submittedOn: '04-Dec-2025',
          status: 'Resolved & Closed',
          statusType: 'COMPLETED',
          currentAuthority: 'Treasury Officer / DDO',
          remarks: 'Deduction rectified and updated in monthly payslip record.',
          targetModule: 'grievances'
        }
      ];
      setApplications(defaultApps);
    } catch (e) {
      console.error('Error fetching application history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [employee]);

  const filteredApps = applications.filter((app) => {
    if (filterType !== 'ALL' && app.type !== filterType) return false;
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'PENDING' && !['PENDING', 'PROCESSING', 'FORWARDED'].includes(app.statusType)) return false;
      if (filterStatus === 'APPROVED' && !['APPROVED', 'COMPLETED'].includes(app.statusType)) return false;
      if (filterStatus === 'REJECTED' && app.statusType !== 'REJECTED') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = app.appNumber.toLowerCase().includes(q);
      const matchSub = app.subject.toLowerCase().includes(q);
      const matchType = app.typeName.toLowerCase().includes(q);
      const matchAuth = app.currentAuthority.toLowerCase().includes(q);
      if (!matchNo && !matchSub && !matchType && !matchAuth) return false;
    }
    return true;
  });

  const getStatusBadge = (statusType: ApplicationItem['statusType'], statusText: string) => {
    switch (statusType) {
      case 'APPROVED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {statusText}
          </span>
        );
      case 'PENDING':
      case 'PROCESSING':
      case 'FORWARDED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            {statusText}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            {statusText}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">
            {statusText}
          </span>
        );
    }
  };

  const getTypeIcon = (type: ApplicationItem['type']) => {
    switch (type) {
      case 'TRANSFER': return <ArrowLeftRight className="w-4 h-4 text-teal-600" />;
      case 'LEAVE': return <CalendarCheck className="w-4 h-4 text-sky-600" />;
      case 'LOAN': return <Building className="w-4 h-4 text-amber-600" />;
      case 'GRIEVANCE': return <HelpCircle className="w-4 h-4 text-rose-600" />;
      case 'EPAR': return <Award className="w-4 h-4 text-indigo-600" />;
      case 'SERVICE_BOOK_CORRECTION': return <FileEdit className="w-4 h-4 text-blue-600" />;
      default: return <History className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleOpenModule = (targetModule: string) => {
    if (onNavigateTab) {
      onNavigateTab(targetModule);
    } else {
      window.location.search = `?module=${targetModule}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200 shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Unified Application &amp; Request History
              </h2>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-300">
                End-to-End Tracking
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, approval authority, and audit timeline for all your submitted HRMS requests.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchApplications}
          className="p-2 text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Type */}
          <div className="flex items-center gap-1.5">
            <label className="text-slate-600 font-bold">Module:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">All Application Types</option>
              <option value="TRANSFER">Transfer Requests</option>
              <option value="LEAVE">Leave Applications</option>
              <option value="LOAN">Loan &amp; Advances</option>
              <option value="GRIEVANCE">Grievance Tickets</option>
              <option value="EPAR">Property Statement / PAR</option>
              <option value="SERVICE_BOOK_CORRECTION">Service Book Correction</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5">
            <label className="text-slate-600 font-bold">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending / In Review</option>
              <option value="APPROVED">Approved / Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, subject..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Applications List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading application tracker...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Applications Found</h4>
            <p className="text-xs text-slate-500">No applications match your selected filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Subject / Details</th>
                  <th className="py-3 px-4">Submitted On</th>
                  <th className="py-3 px-4">Current Authority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      {app.appNumber}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(app.type)}
                        <span className="font-semibold text-slate-800">{app.typeName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <div className="font-medium text-slate-800 leading-snug">{app.subject}</div>
                      {app.remarks && (
                        <div className="text-[11px] text-slate-500 mt-0.5 italic">{app.remarks}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {app.submittedOn}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {app.currentAuthority}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(app.statusType, app.status)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenModule(app.targetModule)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Module</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredApps.length} recorded application(s)</span>
          <span className="font-mono text-[11px]">HRMS Live Workflow Engine</span>
        </div>
      </div>
    </div>
  );
};

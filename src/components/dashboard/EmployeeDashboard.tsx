import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { OdishaSealLogo } from '../login/OdishaSealLogo';
import { EmployeeDashboardModals } from './EmployeeDashboardModals';
import {
  User,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Building,
  ArrowLeftRight,
  ShieldCheck,
  FolderOpen,
  History,
  Bell,
  HelpCircle,
  Award,
  Lock,
  ExternalLink,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Printer,
  Sparkles,
  LayoutGrid,
  Menu,
  ChevronDown,
  Mail
} from 'lucide-react';

interface EmployeeDashboardProps {
  setActiveTab: (tab: string) => void;
  pendingLeavesCount?: number;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  setActiveTab,
  pendingLeavesCount = 1
}) => {
  const { user, employee, logout, addToast } = useAuth();

  // Dynamic communication stats
  const [commUnreadCount, setCommUnreadCount] = useState<number>(0);
  const [commTotalCount, setCommTotalCount] = useState<number>(0);

  useEffect(() => {
    const loadCommStats = async () => {
      try {
        const res = await apiFetch('/api/communications');
        const data = await res.json();
        if (data.success && Array.isArray(data.communications)) {
          setCommTotalCount(data.total || data.communications.length);
          setCommUnreadCount(data.unreadCount ?? data.communications.filter((c: any) => !c.isRead).length);
        }
      } catch (e) {
        console.error('Error fetching communications stats:', e);
      }
    };
    loadCommStats();
  }, []);

  // Filter States for My Task Grid
  const [selectedTask, setSelectedTask] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [filterEmpName, setFilterEmpName] = useState('');
  const [filterGpfNo, setFilterGpfNo] = useState('');

  // UI Collapse States
  const [isTaskCollapsed, setIsTaskCollapsed] = useState(false);
  const [isReportsCollapsed, setIsReportsCollapsed] = useState(false);
  const [isRequestsCollapsed, setIsRequestsCollapsed] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  // Active Modal state
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Tasks list
  const initialTasks = [
    {
      id: 'TSK-2026-9081',
      name: 'Annual Property Statement Submission 2025-26',
      initiatedBy: 'Establishment Officer',
      initiatedOn: '15-Jan-2026',
      status: 'Pending',
      type: 'epar'
    },
    {
      id: 'TSK-2026-8842',
      name: 'Earned Leave Application (5 Days)',
      initiatedBy: employee?.name || 'Self',
      initiatedOn: '02-Feb-2026',
      status: 'Under Verification (DDO)',
      type: 'leave'
    },
    {
      id: 'TSK-2026-7731',
      name: 'Transfer & Posting Application (TR-2026-000001)',
      initiatedBy: employee?.name || 'Self',
      initiatedOn: '10-Feb-2026',
      status: 'Under DDO Review',
      type: 'transfers'
    }
  ];

  const filteredTasks = initialTasks.filter((task) => {
    if (selectedStatus !== 'All' && !task.status.toLowerCase().includes(selectedStatus.toLowerCase())) {
      return false;
    }
    if (filterEmpName && !task.initiatedBy.toLowerCase().includes(filterEmpName.toLowerCase())) {
      return false;
    }
    if (filterGpfNo && employee?.gpfNpsNo && !employee.gpfNpsNo.toLowerCase().includes(filterGpfNo.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleOpenNewTab = (moduleKey: string) => {
    const url = `${window.location.origin}${window.location.pathname}?module=${moduleKey}`;
    window.open(url, '_blank');
  };

  const majorServices = [
    {
      id: 'communication',
      title: 'e-Communication',
      desc: 'Official establishment orders, circulars & DDO intimations',
      icon: Mail,
      color: 'from-amber-500 to-orange-600',
      badge: commUnreadCount > 0 ? `${commUnreadCount} New Intimations` : 'All Caught Up'
    },
    {
      id: 'profile',
      title: 'My Profile',
      desc: 'Personal details, address, family nominee & KYC',
      icon: User,
      color: 'from-blue-500 to-indigo-600',
      badge: 'KYC Verified'
    },
    {
      id: 'service-book',
      title: 'My Service Book',
      desc: 'e-Service Book with posting, promotions & increments',
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-600',
      badge: 'e-Signed'
    },
    {
      id: 'salary',
      title: 'Pay Slip & Salary',
      desc: 'Monthly pay breakdown, deductions & PDF download',
      icon: CreditCard,
      color: 'from-amber-500 to-orange-600',
      badge: `Level ${employee?.payLevel || '9'}`
    },
    {
      id: 'leave',
      title: 'Leave Account',
      desc: 'Apply leave, view balance ledger & track approval',
      icon: CalendarCheck,
      color: 'from-sky-500 to-cyan-600',
      badge: '12 CL / 48 EL'
    },
    {
      id: 'loans',
      title: 'Loan & Advance',
      desc: 'GPF advance, Festival advance & Housing loans',
      icon: Building,
      color: 'from-purple-500 to-violet-600',
      badge: 'Active'
    },
    {
      id: 'transfers',
      title: 'Transfer Module',
      desc: 'Apply transfer, track status, joint verification & LPC',
      icon: ArrowLeftRight,
      color: 'from-teal-600 to-emerald-700',
      badge: 'In Review'
    },
    {
      id: 'documents',
      title: 'e-Service Documents',
      desc: 'Official appointment orders, transfer orders & Form-16',
      icon: FolderOpen,
      color: 'from-rose-500 to-pink-600',
      badge: 'e-Vault'
    },
    {
      id: 'application-history',
      title: 'Application History',
      desc: 'Unified tracker across leaves, transfers, loans & grievances',
      icon: History,
      color: 'from-indigo-600 to-blue-700',
      badge: 'Real-time'
    },
    {
      id: 'epar',
      title: 'e-PAR & Property',
      desc: 'Annual Property Statement & performance appraisal',
      icon: Award,
      color: 'from-amber-600 to-yellow-600',
      badge: 'FY 2025-26'
    },
    {
      id: 'grievances',
      title: 'Grievance / Request',
      desc: 'Raise online service grievance & track DDO resolution',
      icon: HelpCircle,
      color: 'from-rose-600 to-red-700',
      badge: 'Help Desk'
    },
    {
      id: 'notifications',
      title: 'Notifications & Circulars',
      desc: 'Official state department notices & DDO communications',
      icon: Bell,
      color: 'from-blue-600 to-sky-700',
      badge: '2 New'
    },
    {
      id: 'change-password',
      title: 'Change Password',
      desc: 'Update your HRMS security credentials and PIN',
      icon: Lock,
      color: 'from-slate-600 to-slate-800',
      badge: 'Security'
    }
  ];

  return (
    <div className="w-full bg-[#f4f7fa] text-slate-800 font-sans select-none pb-12">
      {/* 1. TOP HEADER BANNER (Official Odisha HRMS styling) */}
      <header className="w-full bg-gradient-to-r from-[#1777b7] via-[#208acf] to-[#12689f] text-white shadow-md relative overflow-hidden border-b-2 border-[#0e4d75]">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
            backgroundSize: '100% 100%'
          }}
        />

        <div className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 relative z-10">
          {/* Left: Odisha Seal Emblem + HRMS Odisha 3D Text */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-sm bg-white border-2 border-[#e67e22] shadow-md flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
              <OdishaSealLogo className="w-full h-full" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] font-sans">
                HRMS Odisha
              </h1>
              <div className="text-[10px] text-white/90 font-medium">
                Government of Odisha Employee Self-Service
              </div>
            </div>
          </div>

          {/* Center-Right: Employee Welcome & Logout */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden lg:flex flex-col text-right text-xs">
              <span className="font-bold text-white tracking-wide">
                Welcome, {employee?.name || user?.name}
              </span>
              <span className="text-[11px] text-sky-100">
                Emp ID: {employee?.employeeId} | {employee?.designation}
              </span>
            </div>

            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full p-0.5 shadow-sm border border-white/80 shrink-0 flex items-center justify-center overflow-hidden">
              <OdishaSealLogo className="w-full h-full" />
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="flex flex-col items-center justify-center text-white hover:text-amber-200 transition-colors p-1 group cursor-pointer shrink-0"
              title="Logout from HRMS"
            >
              <div className="relative">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white group-hover:scale-105 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" fill="#1b4f72" stroke="white" strokeWidth="1.5" />
                  <line x1="8" y1="21" x2="16" y2="21" stroke="white" strokeWidth="2" />
                  <line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="2" />
                </svg>
                <div className="absolute -top-1 -right-1 bg-red-600 rounded-xs p-0.5 shadow-xs">
                  <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="currentColor">
                    <path d="M 2 2 L 8 5 L 2 8 Z" />
                  </svg>
                </div>
              </div>
              <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BREADCRUMB & QUICK MODULE NAV */}
      <div className="w-full bg-gradient-to-b from-[#d8e8f8] to-[#c2daf2] border-b border-[#a9c9e8] px-3 sm:px-6 pt-1.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-[#2c5282] font-semibold flex items-center gap-1.5 py-0.5">
            <span className="text-[#3182ce] font-bold">&gt;&gt;</span>
            <span className="hover:underline cursor-pointer">Dash Board</span>
            <span>/</span>
            <span className="text-slate-600">Employee Self Service</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
              className="text-xs font-bold text-[#1a365d] bg-white/70 hover:bg-white px-2.5 py-0.5 rounded border border-[#a8c6e2] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-sky-700" />
              <span>All HRMS Services</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isQuickMenuOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-50 divide-y divide-slate-100 text-xs">
                {majorServices.map((svc) => (
                  <div key={svc.id} className="py-1 flex items-center justify-between hover:bg-sky-50 rounded-lg px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(svc.id);
                        setIsQuickMenuOpen(false);
                      }}
                      className="flex items-center gap-2 font-medium text-slate-700 hover:text-sky-700 cursor-pointer text-left flex-1"
                    >
                      <svc.icon className="w-3.5 h-3.5 text-sky-600" />
                      <span>{svc.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenNewTab(svc.id);
                        setIsQuickMenuOpen(false);
                      }}
                      className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer"
                      title="Open in new window"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 mt-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            className="px-4 py-1.5 bg-white border-t border-x border-[#9ebcd8] rounded-t-md text-xs font-bold text-[#1a365d] shadow-xs cursor-pointer whitespace-nowrap"
          >
            Home Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="px-3 py-1.5 bg-slate-200/80 hover:bg-white border-t border-x border-[#9ebcd8] rounded-t-md text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
          >
            My Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('service-book')}
            className="px-3 py-1.5 bg-slate-200/80 hover:bg-white border-t border-x border-[#9ebcd8] rounded-t-md text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
          >
            Service Book
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salary')}
            className="px-3 py-1.5 bg-slate-200/80 hover:bg-white border-t border-x border-[#9ebcd8] rounded-t-md text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
          >
            Pay Slip
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leave')}
            className="px-3 py-1.5 bg-slate-200/80 hover:bg-white border-t border-x border-[#9ebcd8] rounded-t-md text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
          >
            Leave Account
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className="px-3 py-1.5 bg-slate-200/80 hover:bg-white border-t border-x border-[#9ebcd8] rounded-t-md text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap text-teal-800"
          >
            Transfer Module
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className="px-3 py-1.5 bg-slate-200/80 hover:bg-white border-t border-x border-[#9ebcd8] rounded-t-md text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap text-rose-800"
          >
            e-Vault Documents
          </button>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 pt-3 space-y-3">
        {/* NOTIFICATION TICKER */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs text-[#b83b26] font-semibold">
          <div className="flex items-center gap-2">
            <span className="bg-[#b83b26] text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
              HRMS Notice
            </span>
            <span>
              Total Pending PAR - 0, PENDING AS REPORTING - 0, PENDING AS REVIEWING - 0, PENDING AS ACCEPTING - 0
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Status Date: {new Date().toLocaleDateString('en-GB')}
          </span>
        </div>

        {/* 4. QUICK SUMMARY STATS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div
            onClick={() => setActiveTab('leave')}
            className="bg-white p-2.5 rounded-lg border border-[#b5cee6] shadow-2xs hover:border-sky-400 transition-all cursor-pointer"
          >
            <div className="text-[10px] text-slate-500 font-medium">Casual Leave Balance</div>
            <div className="text-sm font-black text-sky-700 mt-0.5">12 / 15 Days</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
              <span>Apply Leave</span> &rarr;
            </div>
          </div>

          <div
            onClick={() => setActiveTab('leave')}
            className="bg-white p-2.5 rounded-lg border border-[#b5cee6] shadow-2xs hover:border-sky-400 transition-all cursor-pointer"
          >
            <div className="text-[10px] text-slate-500 font-medium">Earned Leave Credit</div>
            <div className="text-sm font-black text-indigo-700 mt-0.5">48 Days</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">Leave Ledger Active</div>
          </div>

          <div
            onClick={() => setActiveTab('salary')}
            className="bg-white p-2.5 rounded-lg border border-[#b5cee6] shadow-2xs hover:border-sky-400 transition-all cursor-pointer"
          >
            <div className="text-[10px] text-slate-500 font-medium">Pay Matrix Level</div>
            <div className="text-sm font-black text-emerald-700 mt-0.5">
              Level {employee?.payLevel || '9'} (₹{employee?.basicPay?.toLocaleString('en-IN') || '44,900'})
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">View Payslip &rarr;</div>
          </div>

          <div
            onClick={() => setActiveTab('transfers')}
            className="bg-white p-2.5 rounded-lg border border-[#b5cee6] shadow-2xs hover:border-sky-400 transition-all cursor-pointer"
          >
            <div className="text-[10px] text-slate-500 font-medium">Transfer Status</div>
            <div className="text-sm font-black text-teal-700 mt-0.5">Under DDO Review</div>
            <div className="text-[10px] text-teal-600 font-semibold mt-0.5">TR-2026-000001 &rarr;</div>
          </div>

          <div
            onClick={() => setActiveModal('gis')}
            className="bg-white p-2.5 rounded-lg border border-[#b5cee6] shadow-2xs hover:border-sky-400 transition-all cursor-pointer"
          >
            <div className="text-[10px] text-slate-500 font-medium">GIS Savings Credit</div>
            <div className="text-sm font-black text-purple-700 mt-0.5">₹18,400</div>
            <div className="text-[10px] text-purple-600 font-semibold mt-0.5">GIS Passbook &rarr;</div>
          </div>

          <div
            onClick={() => setActiveTab('documents')}
            className="bg-white p-2.5 rounded-lg border border-[#b5cee6] shadow-2xs hover:border-sky-400 transition-all cursor-pointer"
          >
            <div className="text-[10px] text-slate-500 font-medium">e-Vault Documents</div>
            <div className="text-sm font-black text-rose-700 mt-0.5">6 Verified Records</div>
            <div className="text-[10px] text-rose-600 font-semibold mt-0.5">e-Repository &rarr;</div>
          </div>
        </div>

        {/* 5. MAJOR HRMS SERVICES LAUNCHER GRID (With "Open in New Tab" support) */}
        <div className="border border-[#b5cee6] rounded-sm bg-white shadow-xs overflow-hidden">
          <div className="bg-gradient-to-b from-[#ddecfa] to-[#c5def5] px-3 py-1.5 border-b border-[#accbe8] flex items-center justify-between">
            <span className="text-xs font-bold text-[#1e3a8a] flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-sky-800" />
              <span>Major Employee HRMS Services (Direct Access)</span>
            </span>
            <span className="text-[10px] text-slate-500">
              Click to view in current tab or click <ExternalLink className="w-2.5 h-2.5 inline text-sky-700" /> to open in a new tab
            </span>
          </div>

          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {majorServices.map((svc) => (
              <div
                key={svc.id}
                className="group border border-slate-200 hover:border-sky-400 rounded-xl p-3 bg-white hover:bg-sky-50/30 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${svc.color} text-white flex items-center justify-center shadow-xs shrink-0`}>
                      <svc.icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {svc.badge}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenNewTab(svc.id);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-700 rounded hover:bg-sky-100 transition-colors cursor-pointer"
                        title={`Open ${svc.title} in new browser tab`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-sky-800 transition-colors mt-2">
                    {svc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {svc.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab(svc.id)}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Launch Service</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenNewTab(svc.id)}
                    className="text-[10px] text-slate-400 hover:text-sky-700 font-medium cursor-pointer"
                  >
                    New Tab
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. "MY TASK" SECTION (Collapsible Data Grid) */}
        <div className="border border-[#b5cee6] rounded-sm bg-white shadow-xs overflow-hidden">
          {/* Header Bar */}
          <div
            onClick={() => setIsTaskCollapsed(!isTaskCollapsed)}
            className="bg-gradient-to-b from-[#ddecfa] to-[#c5def5] px-3 py-1.5 border-b border-[#accbe8] flex items-center justify-between cursor-pointer select-none"
          >
            <span className="text-xs font-bold text-[#1e3a8a]">My Task Workflow Queue</span>
            <span className="text-[10px] text-[#1e3a8a] font-bold">
              {isTaskCollapsed ? '▼ Expand' : '▲ Collapse'}
            </span>
          </div>

          {/* Collapsible Content */}
          {!isTaskCollapsed && (
            <div>
              {/* Filter Controls Row */}
              <div className="p-2.5 bg-[#f7faff] border-b border-[#dce8f5] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                {/* Select Task */}
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-700 font-medium whitespace-nowrap">Select Task</label>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="h-7 px-2 border border-[#9ebcd8] rounded-xs bg-white text-xs text-slate-800 focus:outline-hidden focus:border-[#3182ce]"
                  >
                    <option>ALL</option>
                    <option>Leave Application</option>
                    <option>Transfer Request</option>
                    <option>e-PAR Appraisal</option>
                    <option>Loan Sanction</option>
                  </select>
                </div>

                {/* Select Status */}
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-700 font-medium whitespace-nowrap">Select Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-7 px-2 border border-[#9ebcd8] rounded-xs bg-white text-xs text-slate-800 focus:outline-hidden focus:border-[#3182ce]"
                  >
                    <option>All</option>
                    <option>Pending</option>
                    <option>Under Verification</option>
                    <option>Approved</option>
                    <option>Forwarded</option>
                  </select>
                </div>

                {/* Employee Name */}
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-700 font-medium whitespace-nowrap">Initiated By</label>
                  <input
                    type="text"
                    value={filterEmpName}
                    onChange={(e) => setFilterEmpName(e.target.value)}
                    placeholder="Search initiator..."
                    className="h-7 px-2 w-28 sm:w-36 border border-[#9ebcd8] rounded-xs bg-white text-xs text-slate-800 focus:outline-hidden focus:border-[#3182ce]"
                  />
                </div>

                {/* GPF No */}
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-700 font-medium whitespace-nowrap">GPF No</label>
                  <input
                    type="text"
                    value={filterGpfNo}
                    onChange={(e) => setFilterGpfNo(e.target.value)}
                    placeholder="Search GPF..."
                    className="h-7 px-2 w-28 sm:w-36 border border-[#9ebcd8] rounded-xs bg-white text-xs text-slate-800 focus:outline-hidden focus:border-[#3182ce]"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => addToast('info', 'Filter Applied', `Showing ${filteredTasks.length} matching task items.`)}
                    className="px-4 py-1 bg-[#418abf] hover:bg-[#3478ab] active:bg-[#286391] text-white text-xs font-semibold rounded-xs shadow-2xs cursor-pointer"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#eef4fb] text-slate-700 border-b border-[#cbdff2] font-semibold">
                      <th className="py-2 px-3 border-r border-[#cbdff2]">Task ID</th>
                      <th className="py-2 px-3 border-r border-[#cbdff2]">Task name</th>
                      <th className="py-2 px-3 border-r border-[#cbdff2]">Initiated By</th>
                      <th className="py-2 px-3 border-r border-[#cbdff2]">Initiated On</th>
                      <th className="py-2 px-3 border-r border-[#cbdff2]">Status</th>
                      <th className="py-2 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 bg-white">
                          No pending tasks found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((t) => (
                        <tr key={t.id} className="border-b border-slate-100 hover:bg-sky-50/40 bg-white">
                          <td className="py-2 px-3 font-mono text-sky-800 font-medium border-r border-slate-100">{t.id}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 border-r border-slate-100">{t.name}</td>
                          <td className="py-2 px-3 text-slate-600 border-r border-slate-100">{t.initiatedBy}</td>
                          <td className="py-2 px-3 text-slate-500 border-r border-slate-100">{t.initiatedOn}</td>
                          <td className="py-2 px-3 border-r border-slate-100">
                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-xs text-[11px] font-semibold">
                              {t.status}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (t.type === 'leave') setActiveTab('leave');
                                else if (t.type === 'epar') setActiveTab('epar');
                                else if (t.type === 'transfers') setActiveTab('transfers');
                                else setActiveModal('communication');
                              }}
                              className="text-sky-600 hover:underline font-semibold text-xs cursor-pointer"
                            >
                              Open Task &rarr;
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Bar */}
              <div className="bg-[#f0f5fa] border-t border-[#cbdff2] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <select className="h-6 border border-[#a8c6e2] rounded-xs bg-white text-[11px] px-1">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                  <button className="px-1 py-0.5 text-slate-400 hover:text-slate-700 cursor-pointer font-mono font-bold">|&lt;</button>
                  <button className="px-1 py-0.5 text-slate-400 hover:text-slate-700 cursor-pointer font-mono font-bold">&lt;</button>
                  <span className="text-[11px]">
                    Page <span className="border border-slate-300 px-1 py-0.5 bg-white font-mono text-[10px]">1</span> of 1
                  </span>
                  <button className="px-1 py-0.5 text-slate-400 hover:text-slate-700 cursor-pointer font-mono font-bold">&gt;</button>
                  <button className="px-1 py-0.5 text-slate-400 hover:text-slate-700 cursor-pointer font-mono font-bold">&gt;|</button>
                  <button
                    onClick={() => addToast('info', 'Refreshed', 'Task grid synchronised.')}
                    className="text-sky-600 hover:text-sky-800 p-0.5 cursor-pointer ml-1"
                    title="Refresh"
                  >
                    🔄
                  </button>
                </div>

                <div className="text-[11px] text-slate-600 font-medium">
                  Displaying {filteredTasks.length > 0 ? `1 to ${filteredTasks.length} of ${filteredTasks.length}` : '0 to 0 of 0'} items
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7. BOTTOM 3-COLUMN WIDGETS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
          {/* COLUMN 1: MY REPORTS (Span 5) */}
          <div className="lg:col-span-5 border border-[#b5cee6] rounded-sm bg-white shadow-xs overflow-hidden flex flex-col">
            <div className="bg-gradient-to-b from-[#ddecfa] to-[#c5def5] px-3 py-1.5 border-b border-[#accbe8] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1e3a8a]">My Reports &amp; Statements</span>
              <button
                type="button"
                onClick={() => setIsReportsCollapsed(!isReportsCollapsed)}
                className="text-xs font-bold text-[#1e3a8a] hover:text-sky-900 cursor-pointer"
                title="Collapse"
              >
                {isReportsCollapsed ? '>>' : '<<'}
              </button>
            </div>

            {!isReportsCollapsed && (
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal('communication')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">
                    My Communication ({commUnreadCount}/{commTotalCount})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('loans')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">My Loan Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('salary')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">My Pay Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('lta')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">Annual LTA Balance Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('bank-history')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">Bank details change history</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('service-book')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">My Service Book (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('transfers')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer text-teal-800"
                >
                  <span className="text-[#0d6e6e] text-sm">🔄</span>
                  <span className="hover:underline font-medium">My Transfer Request / Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('quarter')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">My Quarter Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('leave')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">My Leave Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('it-report')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">My Annual IT Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('gis')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">My GIS Passbook</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('qms-orders')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">QMS Orders and Notice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('calendar')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">My Calendar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('summon')}
                  className="flex items-center gap-1.5 text-[#8b4513] hover:text-[#65300b] text-left transition-colors cursor-pointer"
                >
                  <span className="text-sm">⚖️</span>
                  <span className="hover:underline font-medium">My Summon</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal('group-c-promotion')}
                  className="flex items-center gap-1.5 hover:text-sky-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[#3b71a1] text-sm">📅</span>
                  <span className="hover:underline">Group C Promotion Report</span>
                </button>
              </div>
            )}
          </div>

          {/* COLUMN 2: USER PRIVILEGE (Span 3) */}
          <div className="lg:col-span-3 border border-[#b5cee6] rounded-sm bg-white shadow-xs overflow-hidden flex flex-col">
            <div className="bg-gradient-to-b from-[#ddecfa] to-[#c5def5] px-3 py-1.5 border-b border-[#accbe8]">
              <span className="text-xs font-bold text-[#1e3a8a]">User Privilege</span>
            </div>

            <div className="p-3 space-y-3 text-xs text-slate-800">
              <button
                type="button"
                onClick={() => setActiveModal('disciplinary')}
                className="flex items-center gap-2 hover:text-sky-700 text-left transition-colors w-full cursor-pointer"
              >
                <span className="text-[#8b4513] text-sm">👤</span>
                <span className="hover:underline">Disciplinary Proceedings</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('sanctioned-loans')}
                className="flex items-center gap-2 hover:text-sky-700 text-left transition-colors w-full cursor-pointer"
              >
                <span className="text-sky-600 text-sm">📝</span>
                <span className="hover:underline">Sanctioned Loan List</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('application-history')}
                className="flex items-center gap-2 hover:text-indigo-700 text-left transition-colors w-full cursor-pointer"
              >
                <span className="text-indigo-600 text-sm">📋</span>
                <span className="hover:underline font-medium">Application History</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className="flex items-center gap-2 hover:text-rose-700 text-left transition-colors w-full cursor-pointer"
              >
                <span className="text-rose-600 text-sm">📁</span>
                <span className="hover:underline font-medium">e-Vault Document Repository</span>
              </button>
            </div>
          </div>

          {/* COLUMN 3: REQUEST OR SUBMISSION (Span 4) */}
          <div className="lg:col-span-4 border border-[#b5cee6] rounded-sm bg-white shadow-xs overflow-hidden flex flex-col">
            <div className="bg-gradient-to-b from-[#ddecfa] to-[#c5def5] px-3 py-1.5 border-b border-[#accbe8] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1e3a8a]">Request or Submission</span>
              <button
                type="button"
                onClick={() => setIsRequestsCollapsed(!isRequestsCollapsed)}
                className="text-xs font-bold text-[#1e3a8a] hover:text-sky-900 cursor-pointer"
                title="Collapse"
              >
                {isRequestsCollapsed ? '<<' : '>>'}
              </button>
            </div>

            {!isRequestsCollapsed && (
              <div className="p-3 space-y-2.5 text-xs">
                {/* Row 1: I-Got Karmayogi & Apply Leave */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal('igot')}
                    className="flex items-center gap-1 hover:text-sky-700 text-left cursor-pointer text-[#8b4513]"
                  >
                    <span className="text-emerald-600 text-xs">📈</span>
                    <span className="hover:underline font-medium text-xs">I-Got Karmayogi Details</span>
                    <span className="text-[#e74c3c] font-bold italic text-[11px] ml-0.5 animate-pulse">💥 New</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('leave')}
                    className="flex items-center gap-1.5 hover:text-sky-700 text-left text-slate-800 cursor-pointer"
                  >
                    <span className="text-[#3b71a1] text-sm">📅</span>
                    <span className="hover:underline">Apply Leave</span>
                  </button>
                </div>

                {/* Row 2: Property Statement & QMS 2.0 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('epar')}
                    className="flex items-center gap-1.5 hover:text-sky-700 text-left text-slate-800 cursor-pointer"
                  >
                    <span className="text-[#3b71a1] text-sm">📅</span>
                    <span className="hover:underline">Property Statement</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('qms-orders')}
                    className="flex items-center gap-1.5 hover:text-sky-700 text-left text-slate-800 cursor-pointer"
                  >
                    <span className="text-[#3b71a1] text-sm">📅</span>
                    <span className="hover:underline">QMS 2.0</span>
                  </button>
                </div>

                {/* Row 3: Online Training & Support Ticket */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal('online-training')}
                    className="flex items-center gap-1.5 text-[#1b7e46] hover:text-[#115b31] text-left cursor-pointer font-medium"
                  >
                    <span className="text-sm">📅</span>
                    <span className="hover:underline">Apply for Online Training</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('support-ticket')}
                    className="flex items-center gap-1.5 text-[#d93829] hover:text-[#b02214] text-left cursor-pointer font-medium"
                  >
                    <span className="text-sm">📅</span>
                    <span className="hover:underline">Online Support Ticket</span>
                  </button>
                </div>

                {/* Service Book Correction Request */}
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveModal('service-book-correction')}
                    className="flex items-center gap-1.5 text-[#1e60a3] hover:text-[#134274] text-left cursor-pointer"
                  >
                    <span className="text-sm">📅</span>
                    <span className="hover:underline">Service Book Correction Request</span>
                  </button>
                </div>

                {/* Requested Service Book List */}
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('service-book')}
                    className="flex items-center gap-1.5 text-[#1e60a3] hover:text-[#134274] text-left cursor-pointer"
                  >
                    <span className="text-sm">📅</span>
                    <span className="hover:underline">Requested Service Book List</span>
                  </button>
                </div>

                {/* Staff Suggestion Scheme */}
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveModal('staff-suggestion')}
                    className="flex items-center gap-1.5 text-[#c45300] hover:text-[#994100] text-left cursor-pointer"
                  >
                    <span className="text-sm">📅</span>
                    <span className="hover:underline">Staff Suggestion Scheme</span>
                  </button>
                </div>

                {/* Transfer Module Direct Launch */}
                <div className="pt-1.5 mt-1 border-t border-[#cbdff2]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('transfers')}
                    className="flex items-center justify-between w-full p-2 bg-[#edf7f6] hover:bg-[#e0f2f1] text-[#0f5b5b] border border-[#80cbc4] rounded-xs transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-teal-700 font-bold">⇄</span>
                      <span className="font-bold text-xs group-hover:underline text-[#004d40]">
                        Transfer Module (Apply &amp; Track Status)
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#00695c] text-white px-2 py-0.5 rounded-xs font-semibold">
                      Open Module &rarr;
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POPUP MODALS FOR DETAILS / ACTIONS */}
      <EmployeeDashboardModals
        type={activeModal}
        onClose={() => setActiveModal(null)}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
};

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { EmployeeDashboard } from './EmployeeDashboard';
import {
  User,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Building,
  ArrowLeftRight,
  FileText,
  UserPlus,
  Award,
  FileCheck2,
  HelpCircle,
  Bell,
  ShieldCheck,
  BarChart3,
  KeyRound,
  Briefcase,
  MapPin,
  Calendar,
  LayoutDashboard,
  Mail
} from 'lucide-react';

interface DashboardHomeProps {
  setActiveTab: (tab: string) => void;
  pendingLeavesCount: number;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ setActiveTab, pendingLeavesCount }) => {
  const { user, employee } = useAuth();

  if (!employee || !user) return null;

  const isDDO = ['DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER', 'REPORTING_OFFICER'].includes(user.role);

  // If user is Employee, show the 100% authentic HRMS Odisha Employee Dashboard matching screenshot
  if (!isDDO) {
    return <EmployeeDashboard setActiveTab={setActiveTab} pendingLeavesCount={pendingLeavesCount} />;
  }

  const ddoModules = [
    { id: 'admin', name: 'Employee Management', desc: 'Employee creation, status management & password reset', icon: ShieldCheck, color: 'bg-slate-800' },
    { id: 'communication', name: 'Official Communication', desc: 'Publish & broadcast circulars, orders and establishment notices to employees', icon: Mail, color: 'bg-amber-600', badge: 'Admin Sync' },
    { id: 'profile', name: 'My Profile', desc: 'DDO profile and posting details', icon: User, color: 'bg-blue-500' },
    { id: 'reports', name: 'DDO Reports & Export', desc: 'Generate establishment & salary reports', icon: BarChart3, color: 'bg-sky-600' },
    { id: 'notifications', name: 'Notifications', desc: 'Administrative notices & system alerts', icon: Bell, color: 'bg-yellow-500' },
    { id: 'service-book', name: 'Service Book Records', desc: 'Review digital service books', icon: BookOpen, color: 'bg-indigo-500' },
    { id: 'leave', name: 'Leave Approvals', desc: 'Pending leave requests queue', icon: CalendarCheck, color: 'bg-emerald-500', badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Pending` : null },
    { id: 'salary', name: 'Batch Payroll Engine', desc: 'Process monthly payroll for establishment', icon: CreditCard, color: 'bg-violet-500' },
    { id: 'transfers', name: 'Transfers & Posting', desc: 'Process transfer applications', icon: ArrowLeftRight, color: 'bg-teal-500' },
    { id: 'change-password', name: 'Change Password', desc: 'Update login credentials', icon: KeyRound, color: 'bg-slate-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Switch to Employee View banner for DDO */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-center justify-between">
        <div className="text-xs text-sky-900">
          <span className="font-bold">Logged in as DDO (Establishment Officer).</span> You can switch between DDO Management View and Employee Dashboard View.
        </div>
        <button
          onClick={() => setActiveTab('employee-view')}
          className="px-3 py-1 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs rounded shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Switch to Employee Dashboard View</span>
        </button>
      </div>

      {/* Top Employee Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold text-2xl border-2 border-sky-500 shadow-lg shrink-0">
            {employee.name.charAt(0)}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                {employee.name}
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                {employee.status}
              </span>
            </div>

            <p className="text-sm font-semibold text-sky-700">
              {employee.designation} ({employee.employeeId})
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {employee.department}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {employee.office}, {employee.district}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Joined: {employee.dateOfJoining}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Full Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            System Notices
          </button>
        </div>
      </div>

      {/* Grid of Navigation Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
          Administrative &amp; Management Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ddoModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => setActiveTab(mod.id)}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${mod.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {mod.badge && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      {mod.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-sky-700 transition-colors">
                    {mod.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

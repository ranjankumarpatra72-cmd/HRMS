import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Bell,
  Search,
  LogOut,
  Shield,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications?: () => void;
  unreadNotifCount?: number;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenNotifications,
  unreadNotifCount = 0,
  activeTab = 'dashboard',
  setActiveTab
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="w-full bg-slate-900 text-white shadow-md border-b border-slate-800">
      {/* Top Government Bar */}
      <div className="bg-sky-900 text-sky-100 font-bold text-xs py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 uppercase border-b border-sky-800">
        <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span>PANCHAYATI RAJ & DRINKING WATER DEPARTMENT — GOVERNMENT OF ODISHA, BHUBANESWAR</span>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left Branding */}
        <div
          onClick={() => setActiveTab?.('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-sky-700 flex items-center justify-center border border-sky-500 shadow-inner group-hover:bg-sky-600 transition-colors shrink-0">
            <Building2 className="w-6 h-6 text-sky-100" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                Panchayati Raj & Drinking Water Department
              </h1>
              <span className="bg-sky-800 text-sky-200 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-600 uppercase tracking-wider shrink-0">
                {user?.role === 'DDO' ? 'DDO Establishment' : 'Employee Self-Service'}
              </span>
            </div>
            <p className="text-xs text-sky-200/90 mt-0.5 font-semibold">
              Government of Odisha, Bhubaneswar
            </p>
          </div>
        </div>

        {/* Right Controls */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end md:self-auto">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Global Employee Search"
            >
              <Search className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Search Records</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
              {user.role === 'DDO' ? (
                <Shield className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <div className="text-left">
                <div className="font-semibold text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-sky-300 font-mono">
                  {user.employeeId} ({user.role === 'DDO' ? 'DDO Officer' : 'Employee'})
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

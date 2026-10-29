import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Building,
  ArrowLeftRight,
  Award,
  HelpCircle,
  ShieldCheck,
  BarChart3,
  Bell,
  Settings,
  Building2,
  MapPin,
  Users,
  KeyRound,
  Mail
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  if (!user) return null;

  const isDDO = ['DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER', 'REPORTING_OFFICER'].includes(user.role);

  // DDO Navigation Bar Items
  const ddoNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin', label: 'Employee Management', icon: Users },
    { id: 'communication', label: 'e-Communication', icon: Mail },
    { id: 'department', label: 'Department', icon: Building2 },
    { id: 'office', label: 'Office', icon: MapPin },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Employee Navigation Bar Items
  const employeeNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'service-book', label: 'Service Book', icon: BookOpen },
    { id: 'communication', label: 'e-Communication', icon: Mail },
    { id: 'leave', label: 'Leave', icon: CalendarCheck },
    { id: 'transfers', label: 'Transfer', icon: ArrowLeftRight },
    { id: 'salary', label: 'Salary & Payslips', icon: CreditCard },
    { id: 'loans', label: 'Loan', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'grievances', label: 'Help Desk', icon: HelpCircle },
    { id: 'change-password', label: 'Change Password', icon: KeyRound },
  ];

  const navItems = isDDO ? ddoNavItems : employeeNavItems;

  return (
    <nav className="w-full bg-slate-800 border-b border-slate-700 text-slate-200 overflow-x-auto scrollbar-none shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 py-1 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const ChangePasswordModule: React.FC = () => {
  const { user, addToast, showProcessing, hideProcessing } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    showProcessing('Updating Account Password...');
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      hideProcessing();

      if (data.success) {
        setSuccessMsg('Your account password has been updated successfully.');
        addToast('success', 'Password Changed', 'Your password was updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(data.message || 'Failed to update password.');
        addToast('error', 'Update Failed', data.message || 'Check your current password.');
      }
    } catch (err) {
      hideProcessing();
      setErrorMsg('Server connection error. Please try again.');
      addToast('error', 'Server Error', 'Failed to communicate with authentication server.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Change Login Password
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your e-HRMS employee portal login credentials for security compliance.
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Password Change Failed</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Success</span>
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Account Details Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-slate-700 font-medium">
            <span>Active Employee Account:</span>
            <span className="font-bold font-mono text-sky-700">
              {user?.name} ({user?.employeeId})
            </span>
          </div>

          {/* Current Password */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current active password"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (minimum 6 characters)"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password to confirm"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 space-y-1 text-sky-900">
            <span className="font-bold block flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              Password Guidelines
            </span>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-sky-800/90 pl-1">
              <li>Must be at least 6 characters in length.</li>
              <li>Should contain a mix of letters, numbers, or special characters.</li>
              <li>Do not share your portal login credentials with anyone.</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Update Account Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

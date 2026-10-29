import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Smartphone,
  X,
  KeyRound,
  User,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield
} from 'lucide-react';

interface OtpLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'ddo' | 'employee';
}

export const OtpLoginModal: React.FC<OtpLoginModalProps> = ({ isOpen, onClose, defaultRole = 'employee' }) => {
  const { loginWithDemoOtp } = useAuth();

  const [otpRole, setOtpRole] = useState<'ddo' | 'employee'>(defaultRole);
  const [username, setUsername] = useState(defaultRole === 'ddo' ? 'EMP20267858' : 'EMP10001');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enter_id' | 'enter_otp'>('enter_id');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);

  if (!isOpen) return null;

  const handleRoleChange = (role: 'ddo' | 'employee') => {
    setOtpRole(role);
    setErrorMsg('');
    if (role === 'ddo') {
      setUsername('EMP20267858');
    } else {
      setUsername('EMP10001');
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim()) {
      setErrorMsg('Please enter your HRMS User ID / Employee ID.');
      return;
    }
    // Advance to OTP entry step
    setStep('enter_otp');
    setOtp('123456'); // Pre-fill with demo test OTP for convenience
    setResendTimer(45);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!otp.trim()) {
      setErrorMsg('Please enter the 6-digit One-Time Password (OTP).');
      return;
    }

    setIsSubmitting(true);
    const success = await loginWithDemoOtp(username, otp);
    setIsSubmitting(false);

    if (success) {
      onClose();
    } else {
      setErrorMsg('Invalid OTP. Use demo verification code 123456 or 888888.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600/40 border border-sky-400/30 flex items-center justify-center text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                OTP-Based Authentication
              </h3>
              <p className="text-[11px] text-sky-200 font-medium">
                Log in via Registered Mobile Number
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

        {/* Tab Selection */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleRoleChange('employee')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                otpRole === 'employee'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Employee OTP
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('ddo')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                otpRole === 'ddo'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              DDO OTP
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'enter_id' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {otpRole === 'ddo' ? 'DDO User ID / HRMS ID' : 'Employee HRMS ID'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={otpRole === 'ddo' ? 'e.g. EMP20267858' : 'e.g. EMP10001'}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono uppercase tracking-wide focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  OTP will be sent to your registered mobile number mapped in HRMS.
                </p>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Quick Verification:</strong> Verification OTP is <strong className="font-mono text-sky-800">123456</strong> or <strong className="font-mono text-sky-800">888888</strong>.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Send OTP to Mobile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">Enter 6-Digit OTP</span>
                  <button
                    type="button"
                    onClick={() => setStep('enter_id')}
                    className="text-sky-600 hover:underline font-semibold text-[11px]"
                  >
                    Change ID ({username})
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP (123456)"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono tracking-widest text-center font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Test code: 123456
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtp('123456')}
                    className="text-sky-600 hover:underline font-semibold"
                  >
                    Auto-Fill Test OTP
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Cancel & Return to Standard Login
          </button>
        </div>
      </div>
    </div>
  );
};

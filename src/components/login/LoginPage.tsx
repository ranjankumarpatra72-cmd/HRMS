import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HrmsIllustration } from './HrmsIllustration';
import { OdishaSealLogo } from './OdishaSealLogo';
import { AnnouncementModal } from './AnnouncementModal';
import { OtpLoginModal } from './OtpLoginModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Shield,
  UserCheck
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  // Login form state
  const [loginRole, setLoginRole] = useState<'ddo' | 'employee'>('ddo');
  const [username, setUsername] = useState('EMP20267858');
  const [password, setPassword] = useState('Ranjan@2004');
  const [showPassword, setShowPassword] = useState(false);

  // Captcha state
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('GtZ1bA');
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);

  // Submission state
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Fetch Captcha
  const fetchCaptcha = async () => {
    try {
      setIsCaptchaLoading(true);
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      if (data.success) {
        setCaptchaId(data.captchaId);
        setCaptchaCode(data.captchaCode || 'GtZ1bA');
        setCaptchaInput('');
      }
    } catch (e) {
      console.error('Failed to load CAPTCHA', e);
    } finally {
      setIsCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSwitchRole = (role: 'ddo' | 'employee') => {
    setLoginRole(role);
    setErrorMsg('');
    if (role === 'ddo') {
      setUsername('EMP20267858');
      setPassword('Ranjan@2004');
    } else {
      setUsername('EMP10001');
      setPassword('Password123!');
    }
  };

  const handleSelectCredential = (type: 'ddo' | 'employee', user: string, pass: string) => {
    setLoginRole(type);
    setUsername(user);
    setPassword(pass);
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Please enter User Id and Password.');
      return;
    }

    if (!captchaInput.trim()) {
      setErrorMsg('Please enter the Security Code.');
      return;
    }

    setIsAuthenticating(true);
    const success = await login(username, password, captchaId, captchaInput);
    setIsAuthenticating(false);

    if (!success) {
      fetchCaptcha();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fde4db] via-[#fcd6c6] to-[#fcd5c5] flex flex-col items-center justify-between py-6 px-3 sm:px-6 font-sans text-slate-800 selection:bg-amber-500 selection:text-white">
      
      {/* TOP NOTIFICATION AREA (Exact text & styling from reference) */}
      <header className="w-full max-w-2xl mx-auto text-center space-y-1 my-2 px-2">
        <p className="text-xs sm:text-sm font-medium text-[#933c33] leading-snug tracking-normal">
          Extension of deadlines for processing of the e-PAR in respect of the Group-A &amp; B officers of the State for the year 2025-26 through HRMS
        </p>
        <div>
          <button
            type="button"
            onClick={() => setShowAnnouncementModal(true)}
            className="text-xs sm:text-sm text-[#3b6ea8] hover:text-[#285182] hover:underline font-normal transition-all cursor-pointer inline-block"
          >
            Click to view Notification
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER (Golden glowing rounded frame matching reference) */}
      <main className="w-full max-w-[440px] sm:max-w-[490px] md:max-w-[530px] my-3">
        <div className="relative rounded-[32px] sm:rounded-[38px] border-[5px] sm:border-[6px] border-white shadow-2xl overflow-hidden bg-gradient-to-b from-[#ffa940] via-[#f68926] to-[#ea7008]">
          
          {/* Subtle Isometric Background Texture Grid */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #f68926 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px'
            }}
          />

          {/* TOP HEADER INSIDE CONTAINER (White rounded pill-card) */}
          <div className="relative z-10 p-3 sm:p-4">
            <div className="bg-white rounded-[24px] sm:rounded-[28px] py-2.5 px-3.5 sm:px-4 shadow-md flex items-center gap-3 border border-amber-100/60">
              
              {/* Seal / Emblem */}
              <OdishaSealLogo className="w-12 h-14 sm:w-13 sm:h-15 drop-shadow-2xs" />

              {/* Title & Subtitle with Exact Colorized Initials */}
              <div className="leading-tight select-none">
                <h1 className="text-sm sm:text-base font-medium tracking-tight text-slate-800">
                  <span className="text-[#e2483d] font-bold text-base sm:text-lg">H</span>uman{' '}
                  <span className="text-[#139a8c] font-bold text-base sm:text-lg">R</span>esource{' '}
                  <span className="text-[#e59b12] font-bold text-base sm:text-lg">M</span>anagement{' '}
                  <span className="text-[#3b5998] font-bold text-base sm:text-lg">S</span>ystem
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-600 font-normal">
                  Government of <span className="text-[#e2483d] font-semibold">Odisha</span>
                </p>
              </div>
            </div>
          </div>

          {/* GRAPHICS / ILLUSTRATION AREA (3D Isometric Laptop & Foliage) */}
          <div className="relative z-10 px-2">
            <HrmsIllustration />
          </div>

          {/* LOGIN CARD (Resting in lower container) */}
          <div className="relative z-10 px-4 sm:px-8 pb-6 pt-1">
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full mx-auto border border-amber-100/70">
              
              {/* Login Title */}
              <h2 className="text-center text-slate-800 font-semibold text-sm sm:text-base mb-3">
                Login to your Account
              </h2>

              {/* Subtle Role Toggle Tabs (DDO vs Employee) */}
              <div className="flex rounded-lg bg-slate-100 p-1 mb-3.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSwitchRole('ddo')}
                  className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginRole === 'ddo'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>DDO Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchRole('employee')}
                  className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginRole === 'employee'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Employee Login</span>
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                
                {/* User Id */}
                <div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={loginRole === 'ddo' ? 'User Id (e.g. EMP20267858)' : 'User Id (e.g. EMP10001)'}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#ea9010] focus:ring-1 focus:ring-[#ea9010] transition-all"
                    required
                    autoComplete="username"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-3.5 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#ea9010] focus:ring-1 focus:ring-[#ea9010] transition-all"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* CAPTCHA Display Box + "Can't read? Click here" */}
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  {/* Solid Blue CAPTCHA Box */}
                  <div className="bg-[#2778c4] text-white px-5 py-1.5 rounded-sm font-sans font-bold tracking-wider text-base sm:text-lg select-none shadow-xs flex items-center justify-center min-w-[130px] h-9">
                    {isCaptchaLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{captchaCode || 'GtZ1bA'}</span>
                    )}
                  </div>

                  {/* Can't read? Click here */}
                  <div className="text-right">
                    <span className="text-xs text-slate-600">Can't read? </span>
                    <button
                      type="button"
                      onClick={fetchCaptcha}
                      disabled={isCaptchaLoading}
                      className="text-xs text-[#2778c4] hover:text-[#185590] underline font-normal transition-colors cursor-pointer"
                    >
                      Click here
                    </button>
                  </div>
                </div>

                {/* Security Code Input */}
                <div>
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Security Code"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#ea9010] focus:ring-1 focus:ring-[#ea9010] transition-all"
                    required
                  />
                </div>

                {/* Golden Orange Login Button */}
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-2.5 px-4 bg-[#ea9010] hover:bg-[#d9820a] active:bg-[#c67406] text-white font-semibold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {isAuthenticating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </form>

              {/* Extra Authentication Options */}
              <div className="mt-3.5 pt-1 text-center space-y-1.5">
                <div>
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(true)}
                    className="text-[#ea9010] hover:text-[#cc7b08] font-semibold text-xs sm:text-sm hover:underline cursor-pointer"
                  >
                    Login using OTP
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[#4871a9] hover:text-[#2d5284] text-xs hover:underline cursor-pointer"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* BOTTOM INFORMATION PILL CARD (Exact match to reference) */}
      <section className="w-full max-w-[530px] mx-auto my-1.5 px-2">
        <div className="bg-[#fffae8] border border-[#f3d489] rounded-2xl p-2.5 sm:p-3 text-center text-[11px] sm:text-xs text-[#554a35] shadow-xs space-y-0.5">
          <p className="leading-tight">
            MDRAFM has developed a web based online training program on various financial matters.
          </p>
          <p className="leading-tight">
            Willing officers can register themselves by using this URL :{' '}
            <a
              href="https://mdrafm.odisha.gov.in"
              target="_blank"
              rel="noreferrer"
              className="text-[#2778c4] hover:underline font-normal"
            >
              https://mdrafm.odisha.gov.in
            </a>
          </p>
        </div>
      </section>

      {/* BOTTOM COPYRIGHT PILL CARD (Exact match to reference) */}
      <footer className="w-full max-w-[530px] mx-auto my-1 px-2">
        <div className="bg-[#fffae8] border border-[#f3d489] rounded-2xl py-2 px-3.5 text-center text-[10px] sm:text-[11px] text-[#554a35] shadow-xs leading-tight">
          Copyright © CMGI - All Rights Reserved - General Administration &amp; Public Grievance Department, Government of Odisha
        </div>
      </footer>

      {/* POPUP MODALS */}
      <AnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
      />

      <OtpLoginModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        defaultRole={loginRole}
      />

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onSelectCredential={handleSelectCredential}
      />
    </div>
  );
};

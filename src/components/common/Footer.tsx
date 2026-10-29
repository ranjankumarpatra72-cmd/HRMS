import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#122438] text-slate-300 border-t border-[#0b1724] text-xs py-4 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[11px]">
        <div className="text-center md:text-left">
          <p className="font-semibold text-white/95 tracking-wide">
            © {new Date().getFullYear()} Human Resource Management System (HRMS), Government of Odisha.
          </p>
          <p className="text-slate-400 text-[10px] mt-0.5">
            Designed & Developed for Panchayati Raj & Drinking Water Department, Odisha
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400 text-[11px]">
          <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-white cursor-pointer transition-colors">Terms of Use</span>
          <span>•</span>
          <span className="hover:text-white cursor-pointer transition-colors">Helpdesk Support</span>
          <span>•</span>
          <span className="text-emerald-400 font-mono font-medium">Portal Secure (SSL / 256-bit)</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

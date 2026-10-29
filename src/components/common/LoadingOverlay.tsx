import React from 'react';
import { Loader2, ShieldCheck, Server } from 'lucide-react';

interface LoadingOverlayProps {
  message: string | null;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4">
        <div className="relative flex justify-center items-center">
          <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center border border-sky-200">
            <Server className="w-8 h-8 text-sky-600 animate-pulse" />
          </div>
          <Loader2 className="w-12 h-12 text-sky-600 animate-spin absolute" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 font-sans tracking-tight">
            {message}
          </h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Communicating with HRMS Odisha Server API...
          </p>
        </div>

        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-sky-600 h-full w-2/3 animate-pulse rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface CmgiLogoProps {
  className?: string;
  size?: number;
}

export const CmgiLogo: React.FC<CmgiLogoProps> = ({ className = 'w-14 h-14', size = 56 }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Ring */}
        <circle cx="80" cy="80" r="74" stroke="#1E3A8A" strokeWidth="4" fill="#FFFFFF" />
        <circle cx="80" cy="80" r="68" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="2 2" fill="#F0F9FF" />

        {/* Text around rim */}
        <path id="cmgiRimTop" d="M 24,80 A 56,56 0 0,1 136,80" fill="none" />
        <text fontSize="8.5" fontWeight="bold" fill="#1E3A8A" textAnchor="middle">
          <textPath href="#cmgiRimTop" startOffset="50%">
            CENTRE FOR MODERNIZING
          </textPath>
        </text>

        <path id="cmgiRimBottom" d="M 136,80 A 56,56 0 0,1 24,80" fill="none" />
        <text fontSize="7.5" fontWeight="bold" fill="#0369A1" textAnchor="middle">
          <textPath href="#cmgiRimBottom" startOffset="50%">
            GOVERNMENT INITIATIVE (CMGI)
          </textPath>
        </text>

        {/* Center Human Ring (People Collaborating) */}
        {/* Person 1 (Top Cyan) */}
        <circle cx="80" cy="54" r="5" fill="#0284C7" />
        <path d="M 72,68 C 72,61 88,61 88,68 Z" fill="#0284C7" />

        {/* Person 2 (Right Blue) */}
        <circle cx="102" cy="74" r="5" fill="#1D4ED8" />
        <path d="M 96,87 C 92,80 106,74 110,82 Z" fill="#1D4ED8" />

        {/* Person 3 (Bottom Magenta/Pink) */}
        <circle cx="80" cy="102" r="5" fill="#DB2777" />
        <path d="M 72,92 C 72,99 88,99 88,92 Z" fill="#DB2777" />

        {/* Person 4 (Left Emerald) */}
        <circle cx="58" cy="74" r="5" fill="#059669" />
        <path d="M 64,87 C 68,80 54,74 50,82 Z" fill="#059669" />

        {/* Connecting Ring / Gear Hub */}
        <circle cx="80" cy="78" r="8" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2" />
        <circle cx="80" cy="78" r="3" fill="#D97706" />
      </svg>
    </div>
  );
};

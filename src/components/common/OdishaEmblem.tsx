import React from 'react';

interface OdishaEmblemProps {
  className?: string;
  size?: number;
}

export const OdishaEmblem: React.FC<OdishaEmblemProps> = ({ className = 'w-16 h-16', size = 64 }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Ring */}
        <circle cx="100" cy="100" r="95" stroke="#991B1B" strokeWidth="6" fill="#FFFDF9" />
        <circle cx="100" cy="100" r="88" stroke="#D97706" strokeWidth="2" strokeDasharray="3 3" fill="#FFF8EE" />

        {/* Top Text Ring - ଓଡ଼ିଶା ଶାସନ */}
        <path id="curveTop" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
        <text fontSize="14" fontWeight="bold" fill="#991B1B" textAnchor="middle">
          <textPath href="#curveTop" startOffset="50%">
            ଓଡ଼ିଶା ଶାସନ • GOVT OF ODISHA
          </textPath>
        </text>

        {/* Bottom Text Ring - सत्यमेव जयते */}
        <path id="curveBottom" d="M 170,100 A 70,70 0 0,1 30,100" fill="none" />
        <text fontSize="11" fontWeight="bold" fill="#991B1B" textAnchor="middle">
          <textPath href="#curveBottom" startOffset="50%">
            ★ सत्यमेव जयते ★
          </textPath>
        </text>

        {/* Center Decorative Circle */}
        <circle cx="100" cy="100" r="52" fill="#FEF3C7" stroke="#991B1B" strokeWidth="2.5" />

        {/* Konark Warrior Horse Motif / Ashoka Pillar Center */}
        {/* Ashoka Chakra Center Hub */}
        <circle cx="100" cy="100" r="14" stroke="#1E3A8A" strokeWidth="2" fill="#EFF6FF" />
        <circle cx="100" cy="100" r="4" fill="#1E3A8A" />
        {/* Chakra Spokes */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="100"
            y1="100"
            x2={100 + 13 * Math.cos((deg * Math.PI) / 180)}
            y2={100 + 13 * Math.sin((deg * Math.PI) / 180)}
            stroke="#1E3A8A"
            strokeWidth="1.2"
          />
        ))}

        {/* Warrior Horse Profile (Left) */}
        <path
          d="M 68,118 C 64,112 60,100 66,90 C 70,84 76,82 82,86 C 80,94 82,106 86,112 Z"
          fill="#B45309"
          stroke="#78350F"
          strokeWidth="1.5"
        />
        {/* Warrior / Rider details */}
        <circle cx="74" cy="80" r="4" fill="#B45309" stroke="#78350F" strokeWidth="1" />
        <path d="M 68,88 L 60,82 L 64,76 Z" fill="#991B1B" />

        {/* Royal Guard Lion / Warrior Right */}
        <path
          d="M 132,118 C 136,112 140,100 134,90 C 130,84 124,82 118,86 C 120,94 118,106 114,112 Z"
          fill="#B45309"
          stroke="#78350F"
          strokeWidth="1.5"
        />
        <circle cx="126" cy="80" r="4" fill="#B45309" stroke="#78350F" strokeWidth="1" />
        <path d="M 132,88 L 140,82 L 136,76 Z" fill="#991B1B" />

        {/* Base Pedestal */}
        <rect x="70" y="124" width="60" height="7" rx="3.5" fill="#991B1B" />
        <rect x="76" y="132" width="48" height="4" rx="2" fill="#D97706" />
      </svg>
    </div>
  );
};

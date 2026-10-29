import React from 'react';

export const HrmsIllustration: React.FC = () => {
  return (
    <div className="w-full max-w-[360px] sm:max-w-[420px] mx-auto relative flex items-center justify-center my-2 select-none pointer-events-none">
      {/* SVG Isometric Artwork 100% matched to reference image */}
      <svg
        viewBox="0 0 500 400"
        className="w-full h-auto drop-shadow-lg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="laptopScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff8e7" />
            <stop offset="60%" stopColor="#ffd88a" />
            <stop offset="100%" stopColor="#f5a623" />
          </linearGradient>

          <linearGradient id="laptopBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb834" />
            <stop offset="50%" stopColor="#e67e10" />
            <stop offset="100%" stopColor="#bf5f00" />
          </linearGradient>

          <linearGradient id="laptopBaseTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffa726" />
            <stop offset="100%" stopColor="#e65100" />
          </linearGradient>

          <linearGradient id="glowBackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffeed4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f98e2b" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="coralSplashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6b6b" />
            <stop offset="100%" stopColor="#d63031" />
          </linearGradient>

          <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fff1d6" />
          </linearGradient>

          <linearGradient id="tileBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe2a3" />
            <stop offset="100%" stopColor="#f39c12" />
          </linearGradient>
        </defs>

        {/* Isometric Grid & Tech Lines Background */}
        <g stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1">
          <line x1="80" y1="180" x2="250" y2="80" />
          <line x1="120" y1="230" x2="350" y2="100" />
          <line x1="200" y1="280" x2="430" y2="150" />
          <line x1="250" y1="80" x2="420" y2="180" />
          <line x1="180" y1="120" x2="350" y2="220" />
          <line x1="100" y1="170" x2="280" y2="280" />

          {/* Tech dots */}
          <circle cx="250" cy="80" r="3" fill="#ffffff" fillOpacity="0.4" />
          <circle cx="180" cy="120" r="2.5" fill="#ffffff" fillOpacity="0.4" />
          <circle cx="350" cy="100" r="3" fill="#ffffff" fillOpacity="0.4" />
          <circle cx="420" cy="180" r="2.5" fill="#ffffff" fillOpacity="0.4" />
          <circle cx="120" cy="230" r="3" fill="#ffffff" fillOpacity="0.4" />
        </g>

        {/* Coral / Red Autumn Splash Graphics behind laptop */}
        <g transform="translate(110, 100)">
          {/* Left Splashes */}
          <path
            d="M 60 120 C 20 100, 0 130, 20 80 C 40 40, 80 50, 70 90 Z"
            fill="url(#coralSplashGrad)"
            opacity="0.85"
          />
          <path
            d="M 40 90 C 10 70, 15 30, 50 40 C 70 50, 70 80, 40 90 Z"
            fill="#e17055"
            opacity="0.75"
          />
          <path
            d="M 75 60 C 65 20, 95 10, 110 30 C 125 50, 100 80, 75 60 Z"
            fill="#d63031"
            opacity="0.6"
          />

          {/* Right Splashes & Foliage */}
          <path
            d="M 180 30 C 220 10, 240 40, 220 70 C 200 90, 160 80, 180 30 Z"
            fill="url(#coralSplashGrad)"
            opacity="0.8"
          />
          <path
            d="M 210 50 C 250 40, 260 80, 230 100 C 200 110, 190 70, 210 50 Z"
            fill="#ff7675"
            opacity="0.7"
          />
          <path
            d="M 230 90 C 270 80, 280 120, 250 140 C 220 150, 210 110, 230 90 Z"
            fill="#d63031"
            opacity="0.65"
          />
        </g>

        {/* Ambient Radial Screen Glow */}
        <ellipse cx="260" cy="180" rx="140" ry="90" fill="url(#glowBackGrad)" />

        {/* ISOMETRIC LAPTOP */}
        <g id="isometric-laptop">
          {/* Laptop Screen Back Plate */}
          <path
            d="M 220 70 L 340 135 L 340 220 L 220 155 Z"
            fill="#b85d00"
          />
          {/* Screen Outer Bezel */}
          <path
            d="M 220 70 L 335 135 L 235 190 L 120 125 Z"
            fill="#d36d00"
          />
          {/* Laptop Screen Glowing Surface */}
          <path
            d="M 220 75 L 325 135 L 235 185 L 130 125 Z"
            fill="url(#laptopScreenGrad)"
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* Screen Content Graphics (Brain icon + Nodes) */}
          <g transform="translate(195, 110)">
            {/* Glowing Brain / AI Icon inside Screen */}
            <path
              d="M 25 10 C 20 5, 12 8, 12 15 C 8 16, 5 22, 8 28 C 5 33, 10 40, 18 38 C 20 44, 30 44, 34 38 C 42 40, 47 33, 44 28 C 47 22, 44 16, 40 15 C 40 8, 32 5, 25 10 Z"
              fill="#ffffff"
              fillOpacity="0.9"
            />
            {/* Brain center divide */}
            <path
              d="M 26 12 L 26 36 M 20 20 L 32 20 M 18 28 L 34 28"
              stroke="#f39c12"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Plug / Connection nodes radiating */}
            <line x1="44" y1="20" x2="55" y2="15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="44" y1="30" x2="58" y2="35" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="22" x2="-2" y2="18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Laptop Base / Keyboard Body (Isometric Lower Deck) */}
          {/* Base bottom thickness */}
          <path
            d="M 120 190 L 235 255 L 365 180 L 365 190 L 235 265 L 120 200 Z"
            fill="#8a3f00"
          />
          <path
            d="M 235 255 L 365 180 L 365 190 L 235 265 Z"
            fill="#a64d00"
          />
          {/* Base Top Surface */}
          <path
            d="M 120 190 L 235 255 L 365 180 L 250 115 Z"
            fill="url(#laptopBaseTopGrad)"
          />

          {/* Keyboard Keys Grid (Isometric) */}
          <g fill="#c95f00" opacity="0.85">
            {/* Row 1 */}
            <polygon points="175,182 188,189 184,192 171,185" />
            <polygon points="192,191 205,198 201,201 188,194" />
            <polygon points="209,200 222,207 218,210 205,203" />
            <polygon points="226,209 239,216 235,219 222,212" />
            <polygon points="243,218 256,225 252,228 239,221" />

            {/* Row 2 */}
            <polygon points="188,175 201,182 197,185 184,178" />
            <polygon points="205,184 218,191 214,194 201,187" />
            <polygon points="222,193 235,200 231,203 218,196" />
            <polygon points="239,202 252,209 248,212 235,205" />
            <polygon points="256,211 269,218 265,221 252,214" />

            {/* Row 3 */}
            <polygon points="201,168 214,175 210,178 197,171" />
            <polygon points="218,177 231,184 227,187 214,180" />
            <polygon points="235,186 248,193 244,196 231,189" />
            <polygon points="252,195 265,202 261,205 248,198" />
            <polygon points="269,204 282,211 278,214 265,207" />

            {/* Trackpad */}
            <polygon points="210,230 235,244 225,250 200,236" fill="#a84d00" />
          </g>
        </g>

        {/* FLOATING ISOMETRIC TILES & ICONS (Exact match to reference) */}

        {/* 1. Top-Right Pencil Tile */}
        <g id="tile-pencil" transform="translate(300, 110)">
          <polygon points="30,0 60,15 30,30 0,15" fill="url(#tileGrad)" stroke="url(#tileBorderGrad)" strokeWidth="1.5" />
          <polygon points="30,30 60,15 60,20 30,35" fill="#e08a00" />
          <polygon points="0,15 30,30 30,35 0,20" fill="#f39c12" />
          {/* Pencil Icon */}
          <path
            d="M 24 18 L 36 10 L 38 12 L 26 20 Z M 22 21 L 25 21 L 24 18 Z"
            fill="#d35400"
          />
        </g>

        {/* 2. Middle-Right Mail / Envelope Tile */}
        <g id="tile-mail" transform="translate(325, 145)">
          <polygon points="38,0 76,18 38,36 0,18" fill="url(#tileGrad)" stroke="url(#tileBorderGrad)" strokeWidth="1.5" />
          <polygon points="38,36 76,18 76,24 38,42" fill="#e08a00" />
          <polygon points="0,18 38,36 38,42 0,24" fill="#f39c12" />
          {/* Mail Envelope Icon */}
          <rect x="22" y="10" width="32" height="18" rx="2" fill="#e67e22" />
          <path d="M 22 10 L 38 21 L 54 10" stroke="#ffffff" strokeWidth="2" fill="none" />
        </g>

        {/* 3. Far-Right Plug / Key Microchip Tile */}
        <g id="tile-key" transform="translate(370, 195)">
          <polygon points="20,0 40,10 20,20 0,10" fill="url(#tileGrad)" stroke="url(#tileBorderGrad)" strokeWidth="1.2" />
          <polygon points="20,20 40,10 40,14 20,24" fill="#e08a00" />
          <polygon points="0,10 20,20 20,24 0,14" fill="#f39c12" />
          <circle cx="20" cy="10" r="5" fill="#d35400" />
          <rect x="18" y="12" width="4" height="6" fill="#d35400" />
        </g>

        {/* 4. Left Documents / Chart Tile */}
        <g id="tile-docs" transform="translate(145, 195)">
          <polygon points="28,0 56,14 28,28 0,14" fill="url(#tileGrad)" stroke="url(#tileBorderGrad)" strokeWidth="1.5" />
          <polygon points="28,28 56,14 56,19 28,33" fill="#e08a00" />
          <polygon points="0,14 28,28 28,33 0,19" fill="#f39c12" />
          {/* Mini document bars */}
          <line x1="16" y1="12" x2="40" y2="12" stroke="#e67e22" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="17" x2="34" y2="17" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="22" x2="26" y2="22" stroke="#d35400" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 5. Center-Front e-Service "@" Tile */}
        <g id="tile-at" transform="translate(265, 230)">
          <polygon points="18,0 36,9 18,18 0,9" fill="url(#tileGrad)" stroke="url(#tileBorderGrad)" strokeWidth="1.2" />
          <polygon points="18,18 36,9 36,13 18,22" fill="#e08a00" />
          <polygon points="0,9 18,18 18,22 0,13" fill="#f39c12" />
          {/* @ text */}
          <text x="18" y="13" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#d35400" fontFamily="sans-serif">
            @
          </text>
        </g>

        {/* 6. Left Scissors Floating Icon */}
        <g id="tile-scissors" transform="translate(135, 260)">
          <polygon points="18,0 36,9 18,18 0,9" fill="url(#tileGrad)" stroke="url(#tileBorderGrad)" strokeWidth="1.2" />
          <polygon points="18,18 36,9 36,13 18,22" fill="#e08a00" />
          <polygon points="0,9 18,18 18,22 0,13" fill="#f39c12" />
          {/* Scissors Icon */}
          <path
            d="M 12 11 C 10 9 10 7 12 6 C 14 5 16 7 15 9 L 20 12 L 23 7 M 15 11 L 23 15 M 12 13 C 10 15 10 17 12 18 C 14 19 16 17 15 15"
            stroke="#d35400"
            strokeWidth="1.2"
            fill="none"
          />
        </g>

        {/* 7. Bottom Percentage "%" Floating Symbol */}
        <g id="tile-percent" transform="translate(235, 280)">
          <text
            x="0"
            y="0"
            fontSize="18"
            fontWeight="900"
            fill="#ffffff"
            fillOpacity="0.8"
            fontFamily="monospace"
            className="drop-shadow-sm"
          >
            %
          </text>
        </g>
      </svg>
    </div>
  );
};

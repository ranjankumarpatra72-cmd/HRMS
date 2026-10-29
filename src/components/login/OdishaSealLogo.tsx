import React from 'react';
import sealImg from '../../assets/odisha_seal.png';

interface OdishaSealLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'clean' | 'round' | 'square';
}

export const OdishaSealLogo: React.FC<OdishaSealLogoProps> = ({
  className = 'w-10 h-10',
  size,
  variant = 'clean',
}) => {
  const containerClasses =
    variant === 'round'
      ? 'bg-white rounded-full p-1 shadow-sm border border-white/80'
      : variant === 'square'
      ? 'bg-white rounded-sm border-2 border-[#e67e22] shadow-md p-0.5'
      : '';

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none overflow-hidden ${containerClasses} ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src={sealImg}
        alt="Seal of Government of Odisha"
        className="w-full h-full object-contain filter drop-shadow-xs"
        loading="eager"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== window.location.origin + '/odisha_seal.png') {
            target.src = '/odisha_seal.png';
          }
        }}
      />
    </div>
  );
};

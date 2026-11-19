import React from 'react';

interface OlympicRingsIconProps {
  className?: string;
}

/** Five interlocking Olympic rings matching the Mini Olympics 2026 brand palette. */
export function OlympicRingsIcon({ className = 'w-8 h-4' }: OlympicRingsIconProps) {
  return (
    <svg
      viewBox="0 0 116 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top row: Blue, White, Red */}
      <circle cx="24" cy="21" r="14" stroke="#3B82F6" strokeWidth="4.2" />
      <circle cx="58" cy="21" r="14" stroke="#F8FAFC" strokeWidth="4.2" />
      <circle cx="92" cy="21" r="14" stroke="#F43F5E" strokeWidth="4.2" />
      {/* Bottom row: Gold, Green */}
      <circle cx="41" cy="36" r="14" stroke="#FBBF24" strokeWidth="4.2" />
      <circle cx="75" cy="36" r="14" stroke="#22C55E" strokeWidth="4.2" />
    </svg>
  );
}

export default OlympicRingsIcon;

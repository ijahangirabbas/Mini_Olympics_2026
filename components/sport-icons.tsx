import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export function SportIcon({ name, className = 'w-6 h-6', size = 24 }: { name: string; className?: string; size?: number }) {
  switch (name) {
    case 'cricket':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M19 5l-8.5 8.5" />
          <path d="M14 10l-1.5 1.5" />
          <path d="M4 20l4-4" />
          <path d="M7 17l-3 3" />
          <circle cx="18" cy="18" r="3" />
          <path d="M17 15.5a3 3 0 0 1 0 5" />
        </svg>
      );
    case 'football':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="12 7 15.5 9.5 14 13.5 10 13.5 8.5 9.5 12 7" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 7V2" />
          <path d="M15.5 9.5l4-2" />
          <path d="M14 13.5l3.5 3.5" />
          <path d="M10 13.5l-3.5 3.5" />
          <path d="M8.5 9.5l-4-2" />
        </svg>
      );
    case 'hockey':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M4 3l8 12a4 4 0 0 0 6 0l2-3" />
          <circle cx="6" cy="19" r="2.5" fill="currentColor" fillOpacity="0.2" />
        </svg>
      );
    case 'kabaddi':
    case 'bicep':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M6 15c0-4 3-7 7-7h1a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4h-2" />
          <path d="M8 19l4-4" />
          <path d="M4 11a5 5 0 0 1 5-5" />
          <circle cx="9" cy="5" r="2" />
        </svg>
      );
    case 'handball':
    case 'basketball':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2.5 12h19" />
          <path d="M12 2.5a15 15 0 0 1 0 19" />
          <path d="M12 2.5a15 15 0 0 0 0 19" />
        </svg>
      );
    case 'volleyball':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 12a10 10 0 0 0 8.66-5" />
          <path d="M12 12a10 10 0 0 0-8.66-5" />
          <path d="M12 12v10" />
        </svg>
      );
    case 'frisbee':
    case 'disc':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <ellipse cx="12" cy="12" rx="10" ry="5" />
          <ellipse cx="12" cy="12" rx="6" ry="2.5" />
        </svg>
      );
    case 'tug-of-war':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 12h20" strokeDasharray="2 2" />
          <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
          <path d="M6 9v6" />
          <path d="M18 9v6" />
        </svg>
      );
    case 'swimming':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 18c2 1 4 1 6 0s4-1 6 0 4 1 6 0" />
          <path d="M2 21c2 1 4 1 6 0s4-1 6 0 4 1 6 0" />
          <circle cx="7" cy="7" r="2" />
          <path d="M11 11l4-2-2-4" />
          <path d="M12 14l3-2" />
        </svg>
      );
    case 'shuttlecock':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="19" r="3" fill="currentColor" fillOpacity="0.2" />
          <path d="M9.5 16.5L6 6l5 3 1-6 1 6 5-3-3.5 10.5" />
          <path d="M8 11h8" />
        </svg>
      );
    case 'table-tennis':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="9" r="6" />
          <path d="M12 15v6" />
          <path d="M9.5 21h5" />
          <circle cx="19" cy="7" r="2" fill="currentColor" />
        </svg>
      );
    case 'chess':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M8 20h8" />
          <path d="M9 20v-2h6v2" />
          <path d="M9 18c0-3-1-4-1-7 0-3 3-5 5-5 2 0 4 2 4 4 0 1-1 3-1 4 1 0 2 1 2 2v2H9z" />
          <circle cx="12.5" cy="9" r="1.5" />
        </svg>
      );
    case 'dice':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="16" cy="8" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="8" cy="16" r="1.5" fill="currentColor" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'running':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="14" cy="5" r="2" />
          <path d="M8 22l3-6 3-2 3 3 3-1" />
          <path d="M4 17l4-3 3-6" />
          <path d="M12 9l3-2 4 3" />
        </svg>
      );
    case 'gamepad':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="2" y="6" width="20" height="12" rx="6" />
          <path d="M6 12h4" />
          <path d="M8 10v4" />
          <circle cx="15.5" cy="10.5" r="1" fill="currentColor" />
          <circle cx="17.5" cy="12.5" r="1" fill="currentColor" />
        </svg>
      );
    case 'combat':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M4 14l6-6 4 4-6 6z" />
          <path d="M14 8l3-3a2 2 0 0 1 3 3l-3 3" />
          <path d="M3 21l3-3" />
          <path d="M9 15l2 2" />
        </svg>
      );
    case 'crosshair':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
        </svg>
      );
    case 'target':
    case 'bow':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'trophy':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
          <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
          <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
          <path d="M12 16v4" />
          <path d="M8 20h8" />
        </svg>
      );
    case 'stopwatch':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="14" r="8" />
          <path d="M12 2v2" />
          <path d="M10 2h4" />
          <path d="M12 14l3-3" />
        </svg>
      );
    case 'flame':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.88-2-3-2-3s-2 1.12-2 3z" />
          <path d="M12 2c-4 4-6 8-6 12a6 6 0 0 0 12 0c0-4-2-8-6-12z" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="9" />
          <polygon points="12 6 15 11 10 11 13 16 9 16" fill="currentColor" fillOpacity="0.2" />
        </svg>
      );
  }
}

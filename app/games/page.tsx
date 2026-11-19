import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/navbar';
import GamesDirectory from '@/components/games-directory';

export const metadata: Metadata = {
  title: 'All Disciplines',
  description: 'Browse and filter 50+ Mini Olympics 2026 team sports, indoor & table games, track & field, fun games, and esports events.',
};

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-[#0B1124] text-[#F8FAFC] selection:bg-[#12E2C4] selection:text-[#0B1124]">
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-sm font-mono text-[#94A3B8]">
            Loading championship disciplines...
          </div>
        }
      >
        <GamesDirectory />
      </Suspense>
    </div>
  );
}

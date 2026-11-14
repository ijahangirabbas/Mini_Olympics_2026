'use client';

import React from 'react';
import Navbar from '@/components/navbar';
import HeroSection from '@/components/hero-section';
import GamesCatalog from '@/components/games-catalog';
import ChampionshipStats from '@/components/championship-stats';
import WhyCompete from '@/components/why-compete';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#101114] text-[#F4F1EA] selection:bg-[#D5F05B] selection:text-[#101114]">
      {/* Premium Navigation */}
      <Navbar />

      {/* Cinematic 3D Hero Section */}
      <HeroSection />

      {/* Complete 50+ Disciplines Catalog Experience */}
      <GamesCatalog />

      {/* Championship Statistics Section */}
      <ChampionshipStats />

      {/* Why Compete Athletic Pillars */}
      <WhyCompete />
    </div>
  );
}

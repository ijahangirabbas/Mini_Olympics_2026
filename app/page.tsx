import React from 'react';
import Navbar from '@/components/navbar';
import HeroSection from '@/components/hero-section';
import GamesCarousel from '@/components/games-carousel';
import ChampionshipStats from '@/components/championship-stats';
import WhyCompete from '@/components/why-compete';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B1124] text-[#F8FAFC] selection:bg-[#12E2C4] selection:text-[#0B1124]">
      {/* Premium Navigation */}
      <Navbar />

      {/* Cinematic 3D Hero Section */}
      <HeroSection />

      {/* Auto-Scrolling Disciplines Carousel + View All */}
      <GamesCarousel />

      {/* Championship Statistics Section */}
      <ChampionshipStats />

      {/* Why Compete Athletic Pillars */}
      <WhyCompete />
    </div>
  );
}

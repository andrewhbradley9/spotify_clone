import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import SearchSection from '../components/SearchSection';
import TrendingSection from '../components/TrendingSection';

const Home = () => {
  return (
    <div>
      <Header />
      <HeroSection />
      <SearchSection />
      <TrendingSection />
      <Footer />
    </div>
  );
};

export default Home;

import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate(); // Hook for navigation

  const handleSignUpClick = () => {
    navigate('/register'); // Navigate to the Regi page
  };

  return (
    <section className="hero">
      <p>
        Get the highest quality assets created by top industry artists. Discover new tracks, albums, and exclusive content tailored to your musical taste.<br/>
        Join a thriving community of music lovers and elevate your listening experience with Coog Music.
      </p>

      <button className="hero-btn" onClick={handleSignUpClick}>
        Register
      </button>
    </section>
  );
};

export default HeroSection;

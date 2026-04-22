import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero-fullscreen">
      {/* Background and ambient glow */}
      <div className="hero-glow-bg"></div>

      <div className="hero-main-content">
        <h1 className="hero-giant-text fade-in delay-100">
          SecureWealth
        </h1>
        
        <div className="hero-center-image slide-up delay-300">
          <img src="/lock_graph_shape.png" alt="Secure Trading Asset" />
        </div>
      </div>

      <div className="hero-bottom-bar fade-in delay-400">
        <div className="bottom-left">
          <span className="date-text">Est. 2026</span>
          <span className="direction-text">Algorithmic direction</span>
        </div>

        <div className="bottom-right">
          <a href="#services">SERVICES</a>
          <a href="#work">PERFORMANCE</a>
          <a href="#platform">PLATFORM</a>
        </div>
      </div>
    </section>
  );
};

export default Hero;

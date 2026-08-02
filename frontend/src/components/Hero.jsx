import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Hero.css';

const Hero = () => {
  const { t } = useLanguage();

  return (
    <section className="hero-fullscreen">
      {/* Background and ambient glow */}
      <div className="hero-glow-bg"></div>

      <div className="hero-main-content">
        <h1 className="hero-giant-text fade-in delay-100">
          {t('hero.brand')}
        </h1>
        
        <div className="hero-center-image slide-up delay-300">
          <img src="/lock_graph_shape.png" alt="Secure Trading Asset" />
        </div>
      </div>

      <div className="hero-bottom-bar fade-in delay-400">
        <div className="bottom-left">
          <span className="date-text">{t('hero.est')}</span>
          <span className="direction-text">{t('hero.tagline')}</span>
        </div>

        <div className="bottom-right">
          <a href="#services">{t('hero.services')}</a>
          <a href="#work">{t('hero.performance')}</a>
          <a href="#platform">{t('hero.platform')}</a>
        </div>
      </div>
    </section>
  );
};

export default Hero;

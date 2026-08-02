import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h2>SecureWealth <span className="text-accent">AI</span></h2>
            <p>{t('hero.tagline')}</p>
          </div>
          
          <div className="footer-links-group">
            <h3>{t('nav.services')}</h3>
            <ul>
              <li><a href="#services">{t('services.twinTitle')}</a></li>
              <li><a href="#services">{t('services.fraudTitle')}</a></li>
              <li><a href="#services">{t('services.analyticsTitle')}</a></li>
              <li><a href="#services">{t('services.taxTitle')}</a></li>
            </ul>
          </div>
          
          <div className="footer-links-group">
            <h3>{t('nav.platform')}</h3>
            <ul>
              <li><a href="#services">{t('nav.home')}</a></li>
              <li><a href="#services">{t('nav.security')}</a></li>
              <li><a href="#services">{t('nav.portfolio')}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} SecureWealth AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

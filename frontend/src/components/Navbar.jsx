import React, { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  return (
    <>
      <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <div className="logo">
            <a href="#">SecureWealth <span className="text-accent">AI</span></a>
          </div>

          <button 
            className="menu-trigger-btn"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            MENU
          </button>
        </div>
      </header>

      {/* Fullscreen Menu Overlay */}
      <div className={`fullscreen-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-inner">
          <div className="menu-left">
            <div className="menu-logo-box">
              <h1>SECURE<br/>WEALTH</h1>
            </div>
            <p className="menu-description">
              Secure 
            </p>
          </div>

          <div className="menu-right">
            <div className="close-wrapper">
              <button className="menu-close-btn" onClick={() => setIsMenuOpen(false)}>
                CLOSE
              </button>
            </div>

            <ul className="menu-links-list">
              <li style={{ '--item-index': 1 }}>
                <span className="plus">+</span>
                <a href="#services" onClick={() => setIsMenuOpen(false)}>SERVICES</a>
              </li>
              <li style={{ '--item-index': 2 }}>
                <span className="plus">+</span>
                <a href="#work" onClick={() => setIsMenuOpen(false)}>PERFORMANCE</a>
              </li>
              <li style={{ '--item-index': 3 }}>
                <span className="plus">+</span>
                <a href="#platform" onClick={() => setIsMenuOpen(false)}>PLATFORM</a>
              </li>
              <li style={{ '--item-index': 4 }}>
                <span className="plus">+</span>
                <a href="#about" onClick={() => setIsMenuOpen(false)}>ABOUT US</a>
              </li>
            </ul>

            <div className="menu-socials">
              <a href="#">INSTAGRAM</a>
              <a href="#">BEHANCE</a>
              <a href="#">X</a>
              <a href="#">LINKEDIN</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;

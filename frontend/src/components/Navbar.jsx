import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleLogoutClick = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <>
      <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <div className="logo">
            <Link to="/">SecureWealth <span className="text-accent">AI</span></Link>
          </div>

          <div className="nav-actions">
            {user ? (
              <div className="nav-user-greeting">
                <Link to="/dashboard" className="btn btn-secondary nav-btn-dash">
                  DASHBOARD
                </Link>
                <button onClick={handleLogoutClick} className="btn btn-logout-text">
                  LOGOUT
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary nav-btn-login">
                SIGN IN
              </Link>
            )}

            <button 
              className="menu-trigger-btn"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              MENU
            </button>
          </div>
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
              AI-driven wealth management assistant paired with a robust security twin layer. Experience future wealth planning with zero compromise on safety.
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
                {user ? (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>DASHBOARD</Link>
                ) : (
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>ACCESS CLIENT PORTAL</Link>
                )}
              </li>
              {user && (
                <li style={{ '--item-index': 3 }}>
                  <span className="plus">+</span>
                  <a href="#" onClick={handleLogoutClick}>LOGOUT</a>
                </li>
              )}
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

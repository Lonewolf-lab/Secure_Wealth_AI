import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h2>SecureWealth <span className="text-accent">AI</span></h2>
            <p>Next-generation algorithmic wealth management.</p>
            
            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email for insights" className="newsletter-input" />
              <button type="submit" className="btn btn-primary newsletter-btn">Subscribe</button>
            </form>
          </div>
          
          <div className="footer-links-group">
            <h3>Services</h3>
            <ul>
              <li><a href="#">Algorithmic Trading</a></li>
              <li><a href="#">Predictive Analytics</a></li>
              <li><a href="#">Secure Vaults</a></li>
              <li><a href="#">Institutional Grade</a></li>
            </ul>
          </div>
          
          <div className="footer-links-group">
            <h3>Company</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Security</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          
          <div className="footer-links-group">
            <h3>Social</h3>
            <ul>
              <li><a href="#">LinkedIn</a></li>
              <li><a href="#">Twitter (X)</a></li>
              <li><a href="#">Instagram</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} SecureWealth AI. All rights reserved.</p>
          <div className="legal-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

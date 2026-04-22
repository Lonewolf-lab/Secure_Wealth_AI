import React from 'react';
import { ArrowRight } from 'lucide-react';
import './Testimonials.css';

const Testimonials = () => {
  const stats = [
    { value: "84.2%", label: "Average Annual Returns", link: "#" },
    { value: "120M+", label: "Assets Under AI Management", link: "#" },
    { value: "0.01s", label: "Trade Execution Speed", link: "#" },
    { value: "99.9%", label: "Uptime & Security", link: "#" }
  ];

  return (
    <section id="work" className="testimonials-section">
      <div className="container">
        <div className="testimonials-header">
          <h2 className="section-title">
            The Data <br />
            <span className="text-accent">Speaks for Itself.</span>
          </h2>
          <p className="section-subtitle">
            While human traders sleep, our algorithms are securing gains across global markets.
          </p>
        </div>

        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <h3 className="stat-value">{stat.value}</h3>
              <div className="stat-details">
                <p className="stat-label">{stat.label}</p>
                <a href={stat.link} className="stat-link">
                  View Data <ArrowRight size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="quote-container">
          <blockquote className="testimonial-quote">
            "SecureWealth AI completely transformed how we view asset management. Their predictive models achieved in one quarter what traditional hedge funds aim for in a year. The platform is intuitive, secure, and undeniably powerful."
          </blockquote>
          <p className="quote-author">— Sarah Jenkins, Director of Investments at Global Capital</p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

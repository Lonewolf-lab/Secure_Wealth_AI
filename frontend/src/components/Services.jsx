import React, { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import './Services.css';

const Services = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = document.querySelectorAll('.service-horizontal-card');
    cards.forEach((card) => observer.observe(card));
    
    const header = document.querySelector('.services-header-new');
    if (header) observer.observe(header);

    return () => {
      cards.forEach((card) => observer.unobserve(card));
      if (header) observer.unobserve(header);
    };
  }, []);

  const services = [
    {
      id: '01',
      title: "Digital Wealth Twin",
      description: "Receive an exact AI replica of your portfolio, updated in real-time with market data, transaction history, and personalized insights.",
      tags: ["Digital Replica", "Real-Time Sync", "Market Data Integration", "Personalized Insights"]
    },
    {
      id: '02',
      title: "Fraud Detection",
      description: "Leveraging Advanced Behavioral Biometrics & Multi-Factor Authentication to secure your assets from unauthorized access.",
      tags: ["Behavioral Biometrics", "Multi-Factor Authentication", "AI-Powered Detection", "Real-Time Monitoring"]
    },
    {
      id: '03',
      title: "Predictive Analytics",
      description: "Stay ahead of market trends. We forecast market shifts before they happen, allowing your portfolio to adapt proactively and intelligently.",
      tags: ["Market Forecasting", "Risk Assessment", "Sentiment Analysis", "Trend Modeling"]
    },
    {
      id: '04',
      title: "Tax Planning",
      description: "Maximize your returns with our AI-powered tax planning. Reduce your tax liability by optimizing your investment strategies and leveraging smart tax-saving opportunities.",
      tags: ["Tax Optimization", "Investment Strategy", "AI-Powered Planning", "Real-Time Tax Savings"]
    }
  ];

  return (
    <section id="services" className="services-section" ref={sectionRef}>
      <div className="container">
        <div className="services-header-new">
          <h2 className="title-our">Our</h2>
          <h2 className="title-services">services</h2>
        </div>

        <div className="services-list">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="service-horizontal-card" 
              style={{ 
                transitionDelay: `${index * 150}ms`,
                '--card-index': index
              }}
            >
              <div className="service-number">{service.id}</div>
              
              <div className="service-content">
                <h3 className="service-title-large">{service.title}</h3>
                <p className="service-desc">{service.description}</p>
                
                <div className="service-tags">
                  {service.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="service-tag">{tag}</span>
                  ))}
                </div>
              </div>
              
              <div className="service-arrow-wrapper">
                <button className="service-arrow-btn" aria-label={`Learn more about ${service.title}`}>
                  <ArrowUpRight size={24} className="arrow-icon" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import './LanguageSelector.css';

const LanguageSelector = ({ compact = false, alignRight = false }) => {
  const { lang, setLang, languages, currentLanguageObj } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`language-selector-dropdown ${compact ? 'compact' : ''} ${alignRight ? 'align-right' : 'align-left'}`}>
      <button 
        className="lang-select-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
      >
        <Globe size={16} className="globe-icon" />
        <span className="lang-flag">{currentLanguageObj.flag}</span>
        <span className="lang-name">{compact ? currentLanguageObj.code.toUpperCase() : currentLanguageObj.native}</span>
        <ChevronDown size={14} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="lang-overlay-backdrop" onClick={() => setIsOpen(false)} />
          <ul className={`lang-dropdown-menu ${alignRight ? 'align-right' : 'align-left'}`}>
            {languages.map((l) => (
              <li key={l.code}>
                <button
                  className={`lang-option-btn ${lang === l.code ? 'active' : ''}`}
                  onClick={() => {
                    setLang(l.code);
                    setIsOpen(false);
                  }}
                >
                  <span className="option-flag">{l.flag}</span>
                  <span className="option-native">{l.native}</span>
                  <span className="option-code">({l.label})</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;

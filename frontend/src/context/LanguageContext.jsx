import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import pa from '../locales/pa.json';
import ur from '../locales/ur.json';

const LanguageContext = createContext();

export const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧', native: 'English', dir: 'ltr' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳', native: 'हिन्दी', dir: 'ltr' },
  { code: 'pa', label: 'Punjabi', flag: '🇮🇳', native: 'ਪੰਜਾਬੀ', dir: 'ltr' },
  { code: 'ur', label: 'Urdu', flag: '🇮🇳', native: 'اردو', dir: 'rtl' }
];

const localeMap = { en, hi, pa, ur };

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('app_lang') || 'en';
  });

  useEffect(() => {
    const currentLangObj = languages.find((l) => l.code === lang) || languages[0];
    document.documentElement.dir = currentLangObj.dir || 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (newLang) => {
    if (localeMap[newLang]) {
      setLangState(newLang);
      localStorage.setItem('app_lang', newLang);
    }
  };

  // Helper nested translation lookup t('auth.loginTitle', { name: 'Arjun' })
  const t = (keyPath, params = {}, fallback = '') => {
    const keys = keyPath.split('.');
    let current = localeMap[lang] || localeMap.en;

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English dictionary
        let englishCurrent = localeMap.en;
        for (const k of keys) {
          if (englishCurrent && englishCurrent[k] !== undefined) {
            englishCurrent = englishCurrent[k];
          } else {
            return fallback || keyPath;
          }
        }
        current = englishCurrent;
        break;
      }
    }

    if (typeof current === 'string' && params && typeof params === 'object') {
      let result = current;
      Object.keys(params).forEach((paramKey) => {
        result = result.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), params[paramKey]);
      });
      return result;
    }

    return current;
  };

  const currentLanguageObj = languages.find((l) => l.code === lang) || languages[0];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages, currentLanguageObj }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

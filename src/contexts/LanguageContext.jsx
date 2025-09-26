// src/contexts/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Default: italiano, stored in localStorage
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('urban-ph-language');
      return stored || 'it';
    }
    return 'it';
  });

  // Persist language choice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('urban-ph-language', language);
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'it' ? 'en' : 'it');
  };

  const isItalian = language === 'it';
  const isEnglish = language === 'en';

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      isItalian,
      isEnglish
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
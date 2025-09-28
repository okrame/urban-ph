// src/contexts/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine language from URL path
  const getLanguageFromPath = () => {
    return location.pathname.startsWith('/en') ? 'en' : 'it';
  };

  const [language, setLanguage] = useState(() => {
    // First check URL, then localStorage
    const urlLanguage = getLanguageFromPath();
    if (urlLanguage === 'en') return 'en';
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('urban-ph-language');
      return stored || 'it';
    }
    return 'it';
  });

  // Update language when URL changes
  useEffect(() => {
    const urlLanguage = getLanguageFromPath();
    setLanguage(urlLanguage);
  }, [location.pathname]);

  // Persist language choice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('urban-ph-language', language);
    }
  }, [language]);

  const toggleLanguage = () => {
    const newLanguage = language === 'it' ? 'en' : 'it';
    setLanguage(newLanguage);
    
    // Navigate to appropriate URL
    if (newLanguage === 'en') {
      // Add /en prefix
      const newPath = location.pathname === '/' ? '/en' : `/en${location.pathname}`;
      navigate(newPath);
    } else {
      // Remove /en prefix
      const newPath = location.pathname.replace(/^\/en/, '') || '/';
      navigate(newPath);
    }
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
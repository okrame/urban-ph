// src/contexts/LanguageContext.jsx - Versione con Query Parameters
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
  
  // Determine language from URL search params
  const getLanguageFromURL = () => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('lang') === 'en' ? 'en' : 'it';
  };

  const [language, setLanguage] = useState(() => {
    // First check URL params, then localStorage
    const urlLanguage = getLanguageFromURL();
    if (urlLanguage === 'en') return 'en';
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('urban-ph-language');
      return stored || 'it';
    }
    return 'it';
  });

  // Update language when URL changes
  useEffect(() => {
    const urlLanguage = getLanguageFromURL();
    setLanguage(urlLanguage);
  }, [location.search]);

  // Persist language choice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('urban-ph-language', language);
    }
  }, [language]);

  const toggleLanguage = () => {
    const newLanguage = language === 'it' ? 'en' : 'it';
    setLanguage(newLanguage);
    
    // Update URL with query parameter
    const searchParams = new URLSearchParams(location.search);
    
    if (newLanguage === 'en') {
      searchParams.set('lang', 'en');
    } else {
      searchParams.delete('lang');
    }
    
    const newSearch = searchParams.toString();
    const newUrl = `${location.pathname}${newSearch ? '?' + newSearch : ''}`;
    
    navigate(newUrl);
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
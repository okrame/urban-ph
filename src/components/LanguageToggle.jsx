// src/components/LanguageToggle.jsx
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage();
  
  return (
    <button
      onClick={toggleLanguage}
      className={`
        flex items-center gap-1 px-3 py-1.5 
        text-sm font-medium 
        bg-white/10 hover:bg-white/20 
        backdrop-blur-sm rounded-full 
        border border-white/20 
        transition-all duration-200 
        text-white hover:text-white
        ${className}
      `}
      aria-label={`Switch to ${language === 'it' ? 'English' : 'Italiano'}`}
    >
      <span className={language === 'it' ? 'opacity-100' : 'opacity-50'}>
        IT
      </span>
      <span className="opacity-50">|</span>
      <span className={language === 'en' ? 'opacity-100' : 'opacity-50'}>
        EN
      </span>
    </button>
  );
};

export default LanguageToggle;
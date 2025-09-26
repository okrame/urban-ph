// src/hooks/useText.js
import { useLanguage } from '../contexts/LanguageContext';

// Hook per ottenere il testo nella lingua corrente
export const useText = (textObject) => {
  const { language } = useLanguage();
  
  // Se textObject è una stringa, la restituisce così com'è
  if (typeof textObject === 'string') {
    return textObject;
  }
  
  // Se è un oggetto con traduzioni, restituisce la lingua corrente
  // Fallback all'italiano se la lingua richiesta non esiste
  return textObject[language] || textObject.it || textObject.en || '';
};

// Hook per ottenere funzioni di traduzione specifiche per componente
export const useComponentText = (translations) => {
  const { language } = useLanguage();
  
  // Ritorna una funzione che accetta una chiave e restituisce la traduzione
  const t = (key) => {
    const textObj = translations[key];
    if (!textObj) return key; // fallback alla chiave se non trovata
    
    if (typeof textObj === 'string') return textObj;
    return textObj[language] || textObj.it || textObj.en || key;
  };
  
  return { t, language };
};
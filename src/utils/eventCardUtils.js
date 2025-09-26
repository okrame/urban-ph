// utils/eventCardUtils.js 

//import { useLanguage } from '../contexts/LanguageContext';

export const DESCRIPTION_LIMIT = 320;

//const { language } = useLanguage();


const BOOKING_TRANSLATIONS = {
  bookbutton: { it: "Prenota", en: "Book Now" },
  loading: { it: "Attendi...", en: "Hold on..." },
  eventEnded: { it: "Evento Concluso", en: "Event Ended" },
  confirmed: { it: "Prenotazione Confermata!", en: "Booking Confirmed!" },
  fullyBooked: { it: "Tutto Esaurito", en: "Fully Booked" },
  bookingClosed: { it: "Prenotazioni Chiuse", en: "Booking Closed" },
  bookAgain: { it: "Prenota ancora", en: "Book Again" },
  signInToBook: { it: "Accedi per Prenotare", en: "Sign In to Book" }
};


// Funzione di traduzione semplice
const getTranslation = (key, language) => {
  // Se non viene passata la lingua, leggila dal localStorage
  if (!language) {
    language = (typeof window !== 'undefined') ? 
      localStorage.getItem('urban-ph-language') || 'it' : 'it';
  }
  
  return BOOKING_TRANSLATIONS[key]?.[language] || BOOKING_TRANSLATIONS[key]?.it || key;
};

// BORDER CLASSES FUNCTIONS
export const getBorderClasses = (index) => {
  if (index % 2 === 0) {
    return "border-b-2 border-l-2 border-black rounded-bl-3xl";
  } else {
    return "border-b-2 border-r-2 border-black rounded-br-3xl";
  }
};

export const getBorderClassesMobile = (index) => {
  if (index % 2 === 0) {
    return "border-b-2 border-l-2 border-black rounded-bl-3xl";
  } else {
    return "border-b-2 border-r-2 border-black rounded-br-3xl";
  }
};

export const getContentBorderClassesMobile = (index) => {
  return "overflow-hidden";
};

export const getActiveCardRounding = (index) =>
  index % 2 === 0 ? 'rounded-bl-3xl' : 'rounded-br-3xl';

export const getActiveFrameThickness = (index) =>
  index % 2 === 0
    ? 'border-b-2 border-l-2 md:border-b-2 md:border-l-2'
    : 'border-b-2 border-r-2 md:border-b-2 md:border-r-2';

export const getImageRoundingMobile = (index) => {
  if (index === 0) return "rounded-tr-2xl";
  return index % 2 === 1 ? "rounded-tl-2xl" : "rounded-tr-2xl";
};

export const getImageRoundingDesktop = (index, showFullDescription = false) => {
  if (showFullDescription) {
    return "";
  }
  
  if (index % 2 === 0) {
    return "rounded-bl-[22px]";
  } else {
    return "rounded-br-[22px]";
  }
};

// ANIMATION VARIANTS
export const createImageVariants = (isImageLeft) => ({
  hidden: {
    x: isImageLeft ? -100 : 100,
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
});

export const createContentVariants = (isImageLeft, setCardVisible, setRoughAnimationsReady) => ({
  hidden: {
    x: isImageLeft ? 100 : -100,
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      onComplete: () => {
        setCardVisible(true);
        setTimeout(() => setRoughAnimationsReady(true), 200);
      }
    }
  }
});

export const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0
    }
  }
};

export const createMobileVariants = (setCardVisible, setRoughAnimationsReady) => ({
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      onComplete: () => {
        setCardVisible(true);
        setTimeout(() => setRoughAnimationsReady(true), 200);
      }
    }
  }
});

// UTILITY FUNCTIONS
export const getImageSource = (event, imageError) => {
  if (imageError) {
    return 'https://via.placeholder.com/600x400?text=No+Image+Available';
  }

  if (event.imageBase64) {
    return event.imageBase64;
  }

  if (event.image) {
    return event.image;
  }

  return 'https://via.placeholder.com/600x400?text=No+Image+Available';
};

export const getMapHeight = (showFullDescription, contentHeight) => {
  if (!showFullDescription) return 0;

  const maxMapHeight = 350;
  const minMapHeight = 220;

  if (contentHeight > 0) {
    const proportionalHeight = Math.min(contentHeight * 0.7, maxMapHeight);
    return Math.max(proportionalHeight, minMapHeight);
  }

  return minMapHeight;
};

export const shouldTruncateDescription = (description) => {
  return description && description.length > DESCRIPTION_LIMIT;
};

// BUTTON STATE LOGIC
export const getButtonState = (isBooked, bookingStatus, loading, isBookable) => {
  const isClosedForBooking = !isBookable;
  const isFullyBooked = isClosedForBooking;
  const isInteractiveButton = !((isBooked && bookingStatus !== 'cancelled') || loading || (!isBookable && bookingStatus !== 'cancelled'));
  
  return {
    isClosedForBooking,
    isFullyBooked,
    isInteractiveButton
  };
};

// ✅ FUNZIONE CHE ACCETTA 't' COME PARAMETRO
export const getButtonText = (isBooked, bookingStatus, loading, isBookable, eventStatus, user, bookableReason) => {
  
  if (loading) return getTranslation('loading');
  
  if (eventStatus === 'past') return getTranslation('eventEnded');
  
  if (isBooked && bookingStatus !== 'cancelled') return getTranslation('confirmed');
  
  if (!isBookable && bookingStatus !== 'cancelled') {
    if (bookableReason === "No spots left") return getTranslation('fullyBooked');
    return getTranslation('bookingClosed');
  }
  
  if (user) {
    if (bookingStatus === 'cancelled') return getTranslation('bookAgain');
    return getTranslation('bookbutton');
  }
  
  return getTranslation('signInToBook');
};
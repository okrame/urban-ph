import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Calendar, MapPin, Share2 } from 'lucide-react';
import Confetti from 'react-confetti';
import UPHLogo from '../assets/UPH_Logo(black).png';
import { useLanguage } from '../contexts/LanguageContext';

function CelebratoryToast({
  isVisible,
  onComplete,
  message = "Booking Confirmed!",
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventVenueName,
  eventUrl,
  eventId
}) {

  const { language } = useLanguage();
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Salva lo stato corrente
      const originalStyle = window.getComputedStyle(document.body).overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;

      // FORZARE scroll to top in modo sincrono e aggressivo
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Lock body scroll SENZA offset (così il contenuto resta in cima)
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0px';
      document.body.style.left = '0';
      document.body.style.right = '0';

      // Cleanup function per quando il toast scompare
      return () => {
        // Restore body scroll
        document.body.style.overflow = originalStyle;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.left = '';
        document.body.style.right = '';

        // Restore scroll position alla posizione originale
        window.scrollTo(0, 0);
      };
    }
  }, [isVisible]);

  // Handle close directly
  const handleClose = () => {
    onComplete?.();
  };

  // Auto-complete 
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 25000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  // Generate calendar reminder
  const handleAddToCalendar = () => {
    if (!eventTitle || !eventDate) return;

    // Format date for Google Calendar (YYYYMMDDTHHMMSSZ)
    const formatDateForGoogle = (dateStr, timeStr) => {
      try {
        const date = new Date(dateStr);
        if (timeStr) {
          const [hours, minutes] = timeStr.split(':');
          date.setHours(parseInt(hours), parseInt(minutes));
        }
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      } catch (error) {
        console.error('Error formatting date:', error);
        return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      }
    };

    const startDate = formatDateForGoogle(eventDate, eventTime);

    // End time (assume 2 hours duration if no end time specified)
    const endDate = (() => {
      try {
        const start = new Date(eventDate);
        if (eventTime) {
          const [hours, minutes] = eventTime.split(':');
          start.setHours(parseInt(hours), parseInt(minutes));
        }
        start.setHours(start.getHours() + 2); // Add 2 hours
        return start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      } catch (error) {
        console.error('Error calculating end date:', error);
        const fallback = new Date();
        fallback.setHours(fallback.getHours() + 2);
        return fallback.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      }
    })();

    const location = eventVenueName && eventLocation
      ? `${eventVenueName}, ${eventLocation}`
      : eventLocation || eventVenueName || '';

    // Create Google Calendar URL
    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', eventTitle + ' - Urban Ph');
    googleCalendarUrl.searchParams.set('dates', `${startDate}/${endDate}`);
    googleCalendarUrl.searchParams.set('details', `Your booking for ${eventTitle} is confirmed!`);

    if (location) {
      googleCalendarUrl.searchParams.set('location', location);
    }

    // Open Google Calendar in new tab
    window.open(googleCalendarUrl.toString(), '_blank');
  };

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Format time for display
  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return timeStr;
    }
  };


  const handleShare = async () => {
    const shareUrl = generateShareUrl(eventTitle, eventId);


    const shareData = {
      title: eventTitle ? `${eventTitle} - Urban pH` : 'Urban pH Event',
      text: eventTitle
        ? `I'm going to ${eventTitle}! Check it out:`
        : 'Check out this Urban pH event:',
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Event link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Event link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }
    }
  };

  // Funzione helper per generare l'URL di share
  const generateShareUrl = (eventTitle, eventId) => {
    if (!eventId) return 'https://urbanph.it/';

    const eventName = eventTitle
      ? eventTitle.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
      : '';

    // URL PULITO usando Firebase Hosting rewrite
    const baseUrl = 'https://europe-west3-uph-website.cloudfunctions.net/share';
    const params = new URLSearchParams();
    params.set('open', eventId);
    if (eventName) params.set('name', eventName);

    // Include language parameter if not Italian (default)
    if (language === 'en') {
      params.set('lang', 'en');
    }

    return `${baseUrl}?${params.toString()}`;
  };

  const isMobile = window.innerWidth < 640;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none flex justify-center"
          style={{
            alignItems: isMobile ? 'flex-start' : 'center',
            paddingTop: isMobile ? '20vh' : '8vh',
            paddingBottom: isMobile ? '5vh' : '0'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* React Confetti with custom colors */}
          <Confetti
            width={windowDimension.width}
            height={windowDimension.height}
            colors={[
              '#f5f4d7', '#b1bda5', '#f5f4d7', '#b1bda5', // Primi due colori ripetuti
              '#BDA9F1', '#BDA9F1', '#BDA9F1', '#BDA9F1'  // Ultimo colore 4 volte (doppio)
            ]}
            numberOfPieces={250}
            recycle={false}
            run={isVisible}
            initialVelocityY={{ min: 5, max: 15 }}
          />

          {/* Main celebration message */}
          <motion.div
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center border border-white/20 relative pointer-events-auto"
            initial={{
              opacity: 0,
              scale: 0.5,
              y: 50
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: -20
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1
            }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Success icon with pulse */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 400,
                damping: 15
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex justify-center"
              >
                <img
                  src={UPHLogo}
                  alt="UPH Logo"
                  className="h-16 w-auto object-contain"
                />
              </motion.div>
            </motion.div>

            {/* Message text */}
            <motion.h3
              className="text-2xl font-bold text-gray-800 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {eventTitle ? (
                <>
                  Booking confirmed for
                  <br />
                  <span className="text-xl font-semibold italic text-[#8c69ef]">
                    {eventTitle}
                  </span>
                </>
              ) : (
                message
              )}
            </motion.h3>

            {/* Event Details */}
            {(eventDate || eventLocation || eventVenueName) && (
              <motion.div
                className="mb-6 space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {eventDate && (
                  <div className="flex items-center justify-center gap-2 text-gray-700 text-sm sm:text-base">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8c69ef]" />
                    <span className="font-medium">
                      {formatDisplayDate(eventDate)}
                      {eventTime && (
                        <span className="ml-2 text-gray-600">
                          at {formatDisplayTime(eventTime)}
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {(eventLocation || eventVenueName) && (
                  <div className="flex items-center justify-center gap-2 text-gray-700 text-sm sm:text-base">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8c69ef] flex-shrink-0" />
                    <span className="font-medium">
                      {eventVenueName && eventLocation
                        ? `${eventVenueName}, ${eventLocation}`
                        : eventLocation || eventVenueName}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            {(eventTitle && eventDate) || eventUrl ? (
              <motion.div
                className="mb-4 flex gap-3 justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {eventTitle && eventDate && (
                  <motion.button
                    onClick={handleAddToCalendar}
                    className={`bg-[#a98df3] hover:bg-[#8c69ef] text-white font-semibold transition-colors duration-200 flex items-center gap-2 rounded-lg
      ${isMobile ? "py-1.5 px-3 text-sm" : "py-2 px-4 text-base"}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Calendar className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
                    Add to Calendar
                  </motion.button>
                )}

                {eventUrl && (
                  <motion.button
                    onClick={handleShare}
                    className={`bg-[#b1bda5] hover:bg-[#9aa892] text-white font-semibold transition-colors duration-200 flex items-center gap-2 rounded-lg
      ${isMobile ? "py-1.5 px-3 text-sm" : "py-2 px-4 text-base"}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Share2 className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
                    Share
                  </motion.button>
                )}
              </motion.div>
            ) : null}

            <motion.p
              className={`text-gray-600 ${isMobile ? "text-sm" : "text-base"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              Hold tight, your confirmation email is landing in your inbox any moment now 🛬
            </motion.p>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CelebratoryToast;
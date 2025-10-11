// components/EventCard/EventCardDesktopLayout.jsx
import { motion } from 'framer-motion';
import LocationMap from '../LocationMap';
import RoughNotationText from '../RoughNotationText';
import {
  getBorderClasses,
  getImageRoundingDesktop,
  getImageSource,
  getMapHeight,
  getDescriptionLimit,
  getActiveFrameThickness
} from '../../utils/eventCardUtils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { MapPin } from 'lucide-react';
import { useComponentText } from '../../hooks/useText';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedEventField } from '../../utils/eventCardUtils';

const ECARD_TRANSLATIONS = {
  // Titoli e intestazioni
  showmore: {
    it: "SCOPRI DI PIÙ",
    en: "SHOW MORE",
  },

  showless: {
    it: "MOSTRA MENO",
    en: "SHOW LESS",
  },

}


const EventCardDesktopLayout = ({
  event,
  index,
  isImageLeft,
  shouldAnimate,
  imageVariants,
  contentVariants,
  contentRef,
  showFullDescription,
  setShowFullDescription,
  contentHeight,
  handleImageError,
  imageError,
  roughAnimationsReady,
  allowRoughAnimations,
  annotationTrigger,
  authError,
  bookingStatus,
  eventStatus,
  isBookable,
  isFullyBooked,
  isClosedForBooking,
  getButtonContent,
  getButtonText,
  isInteractiveButton,
  handleBookEvent,
  layoutStable,
  isBooked,
  loading
}) => {


  const { t } = useComponentText(ECARD_TRANSLATIONS);
  const { language } = useLanguage();
  const localizedTitle = getLocalizedEventField(event, 'title', language);
  const localizedDescription = getLocalizedEventField(event, 'description', language);
  const localizedVenueName = getLocalizedEventField(event, 'venueName', language);
  const localizedDate = getLocalizedEventField(event, 'date', language);
  const descriptionLimit = getDescriptionLimit(language);
  const shouldTruncate = localizedDescription && localizedDescription.length > descriptionLimit;

  return (
    <div
      id={`event-${event.id}`}
      className={`hidden lg:flex ${isImageLeft ? 'flex-row' : 'flex-row-reverse'} 
    ${getBorderClasses(index)} 
    ${showFullDescription ? getActiveFrameThickness(index) : ''}`}
    >
      {/* X di chiusura - AGGIUNGERE QUESTO BLOCCO */}
      {showFullDescription && (
        <button
          onClick={() => setShowFullDescription(false)}
          className="absolute top-3 right-3 z-50 w-6 h-6 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-sm border border-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
          aria-label="Close expanded view"
        >
          ×
        </button>
      )}
      {/* Image section */}
      <motion.div
        className="w-[30%] flex flex-col"
        initial={shouldAnimate ? "hidden" : false}
        whileInView={shouldAnimate ? "visible" : undefined}
        animate={shouldAnimate ? undefined : { opacity: 1, filter: "none" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        variants={shouldAnimate ? imageVariants : undefined}
        viewport={shouldAnimate ? { once: true, amount: 0.25 } : undefined}
      >
        {/* Main image */}
        <div className="h-[26rem] overflow-hidden">
          <img
            src={getImageSource(event, imageError)}
            alt={localizedTitle}
            className={`w-full h-full object-cover ${getImageRoundingDesktop(index, showFullDescription)}`}
            onError={handleImageError}
          />
        </div>

        {/* Map section with dynamic height */}
        {showFullDescription && (
          <motion.div
            className="border-t border-black"
            style={{
              height: `${getMapHeight(showFullDescription, contentHeight)}px`,
              minHeight: '250px',
              maxHeight: '380px'
            }}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: `${getMapHeight(showFullDescription, contentHeight)}px`,
              opacity: 1
            }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="w-full h-full p-2 flex flex-col">
              <div className="flex-1 min-h-0">
                <LocationMap
                  location={event.location}
                  isVisible={showFullDescription}
                  style={{ height: '120%', width: '100%' }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {showFullDescription && event.secondaryImage && (
          <motion.div
            className=""
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut", delay: 0.1 }}
          >
            <div className="w-full overflow-hidden">
              <img
                src={event.secondaryImage}
                alt={`${localizedTitle} - Additional view`}
                className="w-full h-auto object-cover mt-20 p-4"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </motion.div>
        )}

      </motion.div>

      {/* Content section */}
      <motion.div
        className="w-[70%] p-8 flex flex-col"
        initial={shouldAnimate ? "hidden" : false}
        whileInView={shouldAnimate ? "visible" : undefined}
        animate={shouldAnimate ? undefined : { opacity: 1, filter: "none" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        variants={shouldAnimate ? contentVariants : undefined}
        viewport={shouldAnimate ? { once: true, amount: 0.25 } : undefined}
      >
        <div ref={contentRef} className="flex-1 -mb-6">
          <h3 className="text-2xl font-bold text-black mb-4">{localizedTitle}</h3>
          {event.id !== 'Xx35S2HvQhoCW3eLzfCM' && (

            <div className="flex items-center font-mono text-sm text-black opacity-70 mb-4 flex-wrap gap-2">
              <RoughNotationText
                type="underline"
                color="#4A7E74"
                strokeWidth={2}
                animationDelay={roughAnimationsReady ? 200 : 0}
                animate={false}
                //disabled={!allowRoughAnimations || !roughAnimationsReady}
                trigger={annotationTrigger}
              >
                {localizedDate}
              </RoughNotationText>
              <span className="mx-2">·</span>
              <span>{event.time}</span>
              <div className="w-full mt-1">
                <span className="flex items-center gap-1 text-sm text-gray-800">
                  <MapPin className="w-4 h-4" />
                  {localizedVenueName || event.location}
                </span>
              </div>
            </div>
          )}
          <div className="text-[1.05rem] text-black opacity-90 mb-4 leading-relaxed text-justify">
            {shouldTruncate && !showFullDescription ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mb-1">{children}</h3>,
                    p: ({ children }) => <span>{children}</span>,
                    a: ({ children, href }) => {
                      // Auto-fix URLs without protocol
                      let finalHref = href;
                      if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#') && !href.startsWith('/')) {
                        finalHref = 'https://' + href;
                      }
                      return (
                        <a
                          href={finalHref}
                          className="text-purple-600 hover:text-purple-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {localizedDescription.substring(0, descriptionLimit) + '...'}
                </ReactMarkdown>
                <button
                  onClick={() => setShowFullDescription(true)}
                  className="ml-2 text-[#000000] hover:text-green-800 underline text-sm"
                >
                  {t('showmore')}
                </button>
              </>
            ) : (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    // Override default styles to match your design
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mb-1">{children}</h3>,
                    p: ({ children }) => <p className="mb-2">{children}</p>,
                    a: ({ children, href }) => <a href={href} className="text-[#9333EA] hover:text-purple-700 underline focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-sm" target="_blank" rel="noopener noreferrer">{children}</a>,
                    ul: ({ children }) => <ul className="list-disc pl-6">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6">{children}</ol>,
                  }}
                >
                  {localizedDescription}
                </ReactMarkdown>
                {shouldTruncate && (
                  <button
                    onClick={() => {
                      setShowFullDescription(false);
                      setTimeout(() => {
                        contentRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }, 150);
                    }}
                    className="ml-2 text-black hover:text-green-800 underline text-sm"
                  >
                    {t('showless')}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Event meta info */}
          {!isBooked && (
            <div className="flex flex-wrap gap-3 text-xs text-black opacity-70 mb-4">
              {event.id !== 'Xx35S2HvQhoCW3eLzfCM' && (
                event.spotsLeft === 0 ? (
                  <span className="px-2 py-1">Fully booked</span>
                ) : event.spotsLeft < 4 ? (
                  <span className="px-2 py-1">{event.spotsLeft} spots left !</span>
                ) : null
              )}
            </div>
          )}
          {event.id !== 'Xx35S2HvQhoCW3eLzfCM' && (
            <>
              {/* Status messages */}
              {authError && (
                <div className="absolute p-2 h-9 -mb-8 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {authError}
                </div>
              )}

              {/* {bookingStatus === 'cancelled' && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
              <p className="font-medium">Booking Cancelled</p>
            </div>
          )} */}

              {isFullyBooked && bookingStatus !== 'cancelled' && (
                <div className="absolute mb-3 p-3" style={{ backgroundColor: '#FFFADE' }}>
                  <p className="font-medium text-black text-sm">This event is fully booked</p>
                </div>
              )}


              {isClosedForBooking && bookingStatus !== 'cancelled' && (
                <div className="absolute p-3" style={{ backgroundColor: '#FFFADE' }}>
                  <p className="font-medium text-black text-sm">Booking closed</p>
                </div>
              )}

            </>
          )}

        </div>

        {/* Book button */}
        <div className="w-full mt-2">
          <button
            onClick={handleBookEvent}
            disabled={(isBooked && bookingStatus !== 'cancelled') || loading || (!isBookable && bookingStatus !== 'cancelled' && event.id !== 'Xx35S2HvQhoCW3eLzfCM')}
            className={`w-full py-4 px-4 text-lg font-light transition-all duration-300 ${(isBooked && bookingStatus !== 'cancelled')
              ? 'bg-transparent text-black'
              : loading
                ? 'bg-transparent text-black cursor-wait'
                : (!isBookable && bookingStatus !== 'cancelled' && event.id !== 'Xx35S2HvQhoCW3eLzfCM')
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                  : 'bg-transparent text-black hover:text-green-800 transition-colors'
              }`}
            style={{
              background: ((isBooked && bookingStatus !== 'cancelled') || loading || isInteractiveButton) ? 'transparent' : undefined,
              border: ((isBooked && bookingStatus !== 'cancelled') || loading || isInteractiveButton) ? 'none' : undefined
            }}
          >
            {event.id !== 'Xx35S2HvQhoCW3eLzfCM' && (
              ((isBooked && bookingStatus !== 'cancelled') || loading) ? (
                getButtonContent()
              ) : isInteractiveButton ? (
                <RoughNotationText
                  key={`desktop-btn-${showFullDescription ? 'expanded' : 'collapsed'}-${layoutStable}`}
                  type="box"
                  color="#4A7E74"
                  strokeWidth={2}
                  animationDelay={showFullDescription ? 300 : (roughAnimationsReady ? 100 : 0)}
                  disabled={!allowRoughAnimations || !roughAnimationsReady}
                  trigger={showFullDescription && !layoutStable ? false : (annotationTrigger || true)}
                >
                  {getButtonText()}
                </RoughNotationText>
              ) : (
                getButtonText()
              )
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EventCardDesktopLayout;
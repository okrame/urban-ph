// components/EventCard/EventCardMobileLayout.jsx
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useLayoutEffect } from 'react';
import LocationMap from '../LocationMap';
import RoughNotationText from '../RoughNotationText';
import {
  getBorderClassesMobile,
  getContentBorderClassesMobile,
  getImageRoundingMobile,
  getImageSource,
  shouldTruncateDescription,
  DESCRIPTION_LIMIT,
  getActiveFrameThickness
} from '../../utils/eventCardUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { X, MapPin } from "lucide-react";



const EventCardMobileLayout = ({
  event,
  index,
  shouldAnimate,
  mobileVariants,
  cardRef,
  showFullDescription,
  setShowFullDescription,
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
  isBooked,
  loading,
  shouldShowBookedState
}) => {
  const shouldTruncate = shouldTruncateDescription(event.description);
  const isImageLeft = index % 2 === 0;
  const isFrameVisible = !showFullDescription;

  const forceAlwaysVisible = !!showFullDescription;

  // local in-view just for RoughNotation
  const dateRef = useRef(null);
  const dateInView = useInView(dateRef, { once: true, rootMargin: '40% 0px -10% 0px' });
  const btnRef = useRef(null);
  const btnInView = useInView(btnRef, { once: true, rootMargin: '40% 0px -10% 0px' });


  const [rnArmed, setRnArmed] = useState(false);
  useLayoutEffect(() => {
    if (!roughAnimationsReady || !allowRoughAnimations) return;
    let f1 = 0, f2 = 0;
    f1 = requestAnimationFrame(() => {
      f2 = requestAnimationFrame(() => setRnArmed(true));
    });
    return () => { cancelAnimationFrame(f1); cancelAnimationFrame(f2); };
  }, [roughAnimationsReady, allowRoughAnimations, showFullDescription]);

  // Final trigger: after armed, when external trigger OR in-view OR already open
  const roughTrigger = (annotationTrigger || dateInView || forceAlwaysVisible);


  return (
    <motion.div
      id={`event-${event.id}`}
      ref={cardRef}
      style={{
        marginLeft: "7.5px",
        marginRight: "7px",
        ...(isFrameVisible ? {} : { boxShadow: 'none' }),
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitOverflowScrolling: 'touch',
        willChange: 'opacity, transform',
        minHeight: 1
      }}
      className={[
        "relative lg:hidden sm:mx-6 md:mx-8 bg-white",
        showFullDescription ? "overflow-visible" : "overflow-hidden",
        isFrameVisible ? getBorderClassesMobile(index) : "ring-0 ring-transparent border-0 border-transparent",
        isFrameVisible ? getActiveFrameThickness(index) : "",
      ].join(" ")}
      variants={shouldAnimate && !forceAlwaysVisible ? mobileVariants : undefined}
      initial={shouldAnimate && !forceAlwaysVisible ? "hidden" : false}
      animate={
        shouldAnimate && !forceAlwaysVisible
          ? undefined
          : { opacity: 1 } // REMOVED the filter from here
      }
      whileInView={shouldAnimate && !forceAlwaysVisible ? "visible" : undefined}
      viewport={shouldAnimate && !forceAlwaysVisible ? { once: true, amount: 0.3 } : undefined}
    >

      {/* X di chiusura  */}
      {showFullDescription && (
        <button
          onClick={() => setShowFullDescription(false)}
          className={`absolute top-1 -right-1 ${isImageLeft ? 'right-0' : 'left-0'} z-50 w-3 h-3 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-sm border border-gray-300 text-gray-900 hover:text-gray-800 transition-colors`}
          aria-label="Close expanded view"
        >
          <X className="w-2 h-2" />
        </button>
      )}
      {/* Mobile Header Section - Image + Basic Info */}
      <motion.div
        className={`w-full h-48 sm:h-56 flex ${isImageLeft ? 'flex-row' : 'flex-row-reverse'}`}

      >
        {/* Image Half */}
        <div className={`w-1/2 h-full overflow-hidden ${getImageRoundingMobile(index)}`}>
          <img
            src={getImageSource(event, imageError)}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        </div>

        {/* Info Half */}
        <div className="w-1/2 h-full p-3 sm:p-4 flex flex-col justify-center bg-white">
          <h3 className="text-lg sm:text-xl font-bold text-black mb-2 line-clamp-3">{event.title}</h3>
          {event.id !== 'Xx35S2HvQhoCW3eLzfCM' && (
            <div className="flex flex-col text-xs sm:text-sm text-black opacity-70 gap-1">
              <div className="flex items-center gap-1 font-bold" ref={dateRef}>
                <RoughNotationText
                  key={`rn-${Number(roughTrigger)}-${showFullDescription ? 'open' : 'closed'}`}
                  type="underline"
                  color="#4A7E74"
                  strokeWidth={2}
                  animationDelay={0}
                  animate="false"
                  //disabled={!allowRoughAnimations}
                  trigger={roughTrigger}
                >
                  {event.date}
                </RoughNotationText>
              </div>
              <span>{event.time}</span>
              <span className="flex gap-1 text-xs sm:text-sm">
                <MapPin className="w-4 h-4" />
                {event.venueName || event.location}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile Content - Description and Actions */}
      <motion.div
        className={`py-6 px-4 sm:px-6 md:px-8 ${getContentBorderClassesMobile(index)}`}
      >
        <div
          className="text-sm text-black opacity-90 mb-4 leading-relaxed text-left sm:text-justify"
          style={{ textJustify: 'auto', hyphens: 'auto', textWrap: 'pretty' }}
        >
          {shouldTruncate && !showFullDescription ? (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-semibold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                  p: ({ children }) => <p className="mb-2">{children}</p>,
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
                {event.description.substring(0, DESCRIPTION_LIMIT) + '...'}
              </ReactMarkdown>
              <button
                onClick={() => setShowFullDescription(true)}
                className="ml-2 text-black hover:text-green-700 underline text-sm"
              >
                Show more
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
                {event.description}
              </ReactMarkdown>
              {shouldTruncate && (
                <button
                  onClick={() => {
                    setShowFullDescription(false);
                    setTimeout(() => {
                      cardRef.current?.scrollIntoView({
                        behavior: 'instant',
                        block: 'smooth'
                      });
                    }, 150);
                  }}
                  className="ml-2 text-black hover:text-green-700 underline text-sm"
                >
                  Show less
                </button>
              )}
            </>
          )}
        </div>

        {/* Mobile Map section */}
        {showFullDescription && (
          <motion.div
            className="mb-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full" style={{ height: '250px' }}>
              <LocationMap
                location={event.location}
                isVisible={showFullDescription}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </motion.div>
        )}

        {/* Event meta info */}
        {!isBooked && (
          <div className="flex flex-wrap gap-2 text-xs text-black opacity-70 mb-4">
            {event.id !== 'Xx35S2HvQhoCW3eLzfCM' && (
              event.spotsLeft === 0 ? (
                <span className="px-2 py-1">Fully booked</span>
              ) : event.spotsLeft < 4 ? (
                <span className="px-2 py-1">{event.spotsLeft} spots left</span>
              ) : null
            )}
          </div>
        )}

        {event.id !== 'Xx35S2HvQhoCW3eLzfCM' && (
          <>
            {/* Status messages */}
            <div className="h-0 -mb-8 relative">
              {authError && (
                <div className="fixed top-44 left-4 right-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm z-50 rounded shadow-lg">
                  {authError}
                </div>
              )}
            </div>
            {/* {bookingStatus === 'cancelled' && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
            <p className="font-medium">Booking Cancelled</p>
          </div>
        )} */}

            {isFullyBooked && bookingStatus !== 'cancelled' && (
              <div className="absolute mt-12 right-10" style={{ backgroundColor: '#FFFADE' }}>
                <p className="font-medium text-black text-sm">This event is fully booked</p>
              </div>
            )}


            {isClosedForBooking && bookingStatus !== 'cancelled' && (
              <div className="absolute mt-5 left-5" style={{ backgroundColor: '#FFFADE' }}>
                <p className="font-medium text-black text-sm">Booking closed</p>
              </div>
            )}
          </>
        )}

        {/* Mobile Book button */}
        <div className="w-full mt-2 relative z-20"> {/* Add relative z-20 to button container */}
          <button
            onClick={handleBookEvent}
            disabled={
              (isBooked && bookingStatus !== 'cancelled') ||
              loading ||
              (!isBookable && bookingStatus !== 'cancelled' && event.id !== 'Xx35S2HvQhoCW3eLzfCM')
            }
            className={`relative w-full py-3 px-4 text-base font-light transition-all duration-300 ${(isBooked && bookingStatus !== 'cancelled')
              ? 'bg-transparent text-black'
              : loading
                ? 'bg-transparent text-black cursor-wait'
                : (!isBookable && bookingStatus !== 'cancelled' && event.id !== 'Xx35S2HvQhoCW3eLzfCM')
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                  : 'bg-transparent text-black hover:text-purple-700 transition-colors'
              }`}
            style={{
              background:
                (isBooked && bookingStatus !== 'cancelled') || loading || isInteractiveButton
                  ? 'transparent'
                  : undefined,
              border:
                (isBooked && bookingStatus !== 'cancelled') || loading || isInteractiveButton
                  ? 'none'
                  : undefined,
              position: 'relative',
              zIndex: 20
            }}
          >
            {/* Use the same logic as desktop: getButtonContent() for booked/loading states */}

            {event.id !== 'Xx35S2HvQhoCW3eLzfCM' && (
              <>
                {((isBooked && bookingStatus !== 'cancelled') || loading) ? (
                  <span className="relative z-[70]">
                    {getButtonContent()}
                  </span>
                ) : isInteractiveButton ? (
                  <span
                    ref={btnRef}
                    className="inline-block align-middle relative z-[70]"
                  >
                    <RoughNotationText
                      key={`btn-rn-${Number(annotationTrigger)}-${Number(btnInView)}-${showFullDescription ? 'open' : 'closed'}`}
                      type="box"
                      color="#4A7E74"
                      strokeWidth={2}
                      animationDelay={100}
                      disabled={!allowRoughAnimations}
                      trigger={annotationTrigger || btnInView || forceAlwaysVisible}
                      className="relative z-[70]"
                    >
                      {getButtonText()}
                    </RoughNotationText>
                  </span>
                ) : (
                  getButtonText()
                )}
              </>
            )}

          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EventCardMobileLayout;

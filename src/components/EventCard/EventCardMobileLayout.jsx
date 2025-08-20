// components/EventCard/EventCardMobileLayout.jsx
import { motion } from 'framer-motion';
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
import { useLocation } from 'react-router-dom';


const EventCardMobileLayout = ({
  event,
  index,
  isActive,
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
  shouldShowBookedState // Add this prop
}) => {
  const shouldTruncate = shouldTruncateDescription(event.description);
  const isImageLeft = index % 2 === 0;
  const isFrameVisible = !showFullDescription;

  // Content styling based on booking status (applied to inner content, not borders)
  const getContentClasses = () => {
    let baseClasses = "transition-all duration-700 ease-in-out";
    
    if (shouldShowBookedState) {
      baseClasses += " opacity-60 saturate-50 grayscale-[0.2]";
    }
    
    return baseClasses;
  };

  // Content animation props for booking state
  const getContentAnimationProps = () => {
    if (!shouldShowBookedState) return {};
    
    return {
      initial: { opacity: 0.6 },
      animate: { 
        opacity: 0.6,
        filter: "saturate(0.5) grayscale(0.2)"
      },
      transition: { duration: 0.7, ease: "easeInOut" }
    };
  };

  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const deepLinked = isActive && params.get('open') === event.id;

  const enableInView = !deepLinked;  // only use whileInView when NOT deep-linked

  return (
    <motion.div
      id={`event-${event.id}`}
      style={{
        // 2) see next block — prevents deferred paint on mobile for the opened card
        contentVisibility: deepLinked ? 'visible' : undefined
      }}
      ref={cardRef}
      className={[
        "relative lg:hidden sm:mx-6 md:mx-8 bg-white overflow-hidden",
        // 🟢 keep only when frame is visible
        isFrameVisible ? getBorderClassesMobile(index) : "ring-0 ring-transparent border-0 border-transparent",
        isFrameVisible ? getActiveFrameThickness(index) : "",
      ].join(" ")}
      variants={mobileVariants}
      initial={deepLinked ? "visible" : "hidden"}
      animate={deepLinked ? "visible" : undefined}
      whileInView={enableInView ? "visible" : undefined}
      viewport={enableInView ? { once: true, amount: 0.3 } : undefined}
    >
      {/* Mobile Header Section - Image + Basic Info */}
      <motion.div 
        className={`w-full h-48 sm:h-56 flex ${isImageLeft ? 'flex-row' : 'flex-row-reverse'} ${getContentClasses()}`}
        {...getContentAnimationProps()}
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
          <h3 className="text-lg sm:text-xl font-light text-black mb-2 line-clamp-2">{event.title}</h3>
          <div className="flex flex-col text-xs sm:text-sm text-black opacity-70 gap-1">
            <div className="flex items-center gap-1">
              <RoughNotationText
                type="underline"
                color="#4A7E74"
                strokeWidth={2}
                animationDelay={roughAnimationsReady ? 200 : 0}
                disabled={!allowRoughAnimations || !roughAnimationsReady}
                trigger={annotationTrigger}
              >
                {event.date}
              </RoughNotationText>
            </div>
            <span>{event.time}</span>
            <span className="text-xs sm:text-sm truncate">
              {event.venueName || event.location}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Mobile Content - Description and Actions */}
      <motion.div 
        className={`py-6 px-4 sm:px-6 md:px-8 ${getContentBorderClassesMobile(index)} ${getContentClasses()}`}
        {...getContentAnimationProps()}
      >
        <div className="text-sm text-black opacity-80 mb-4 leading-relaxed">
          {shouldTruncate && !showFullDescription ? (
            <>
              {event.description.substring(0, DESCRIPTION_LIMIT)}...
              <button
                onClick={() => setShowFullDescription(true)}
                className="ml-2 text-purple-600 hover:text-purple-800 underline text-sm"
              >
                Show more
              </button>
            </>
          ) : (
            <>
              {event.description}
              {shouldTruncate && (
                <button
                  onClick={() => setShowFullDescription(false)}
                  className="ml-2 text-purple-600 hover:text-purple-800 underline text-sm"
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
        <div className="flex flex-wrap gap-2 text-xs text-black opacity-70 mb-4">
          <span className="px-2 py-1">
            {event.spotsLeft > 0 ? `${event.spotsLeft} spots left` : "Fully booked"}
          </span>
        </div>

        {/* Status messages */}
        {authError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {authError}
          </div>
        )}

        {bookingStatus === 'cancelled' && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
            <p className="font-medium">Booking Cancelled</p>
          </div>
        )}

        {isFullyBooked && bookingStatus !== 'cancelled' && (
          <div className="mb-3 p-3" style={{ backgroundColor: '#FFFADE' }}>
            <p className="font-medium text-black text-sm">This event is fully booked</p>
          </div>
        )}

        {eventStatus === 'past' && (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-200">
            <p className="font-medium text-black text-sm">This event has ended</p>
          </div>
        )}

        {isClosedForBooking && bookingStatus !== 'cancelled' && (
          <div className="mb-3 p-3" style={{ backgroundColor: '#FFFADE' }}>
            <p className="font-medium text-black text-sm">Booking closed</p>
          </div>
        )}

        {/* Mobile Book button */}
        <div className="w-full mt-2">
          <button
            onClick={handleBookEvent}
            disabled={
              (isBooked && bookingStatus !== 'cancelled') ||
              loading ||
              (!isBookable && bookingStatus !== 'cancelled')
            }
            className={`w-full py-3 px-4 text-base font-light transition-all duration-300 ${
              (isBooked && bookingStatus !== 'cancelled')
                ? 'bg-transparent text-black'
                : loading
                  ? 'bg-transparent text-black cursor-wait'
                  : (!isBookable && bookingStatus !== 'cancelled')
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
                  : undefined
            }}
          >
            {((isBooked && bookingStatus !== 'cancelled') || loading) ? (
              getButtonContent()
            ) : isInteractiveButton ? (
              <RoughNotationText
                type="box"
                color="#4A7E74"
                strokeWidth={2}
                animationDelay={roughAnimationsReady ? 100 : 0}
                disabled={!allowRoughAnimations || !roughAnimationsReady}
                trigger={annotationTrigger}
              >
                {getButtonText()}
              </RoughNotationText>
            ) : (
              getButtonText()
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EventCardMobileLayout;
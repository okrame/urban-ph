// components/EventCard/EventCardDesktopLayout.jsx
import { motion } from 'framer-motion';
import LocationMap from '../LocationMap';
import RoughNotationText from '../RoughNotationText';
import LoadingSpinner from '../LoadingSpinner';
import { 
  getBorderClasses, 
  getImageRoundingDesktop, 
  getImageSource, 
  getMapHeight,
  shouldTruncateDescription,
  DESCRIPTION_LIMIT
} from '../../utils/eventCardUtils';

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
  isBooked,
  loading
}) => {
  const shouldTruncate = shouldTruncateDescription(event.description);

  return (
    <div className={`hidden lg:flex ${isImageLeft ? 'flex-row' : 'flex-row-reverse'} ${getBorderClasses(index)}`}>
      {/* Image section */}
      <motion.div
        className="w-[30%] flex flex-col"
        variants={shouldAnimate ? imageVariants : {}}
      >
        {/* Main image */}
        <div className="h-96 overflow-hidden">
          <img
            src={getImageSource(event, imageError)}
            alt={event.title}
            className={`w-full h-full object-cover ${getImageRoundingDesktop(index)}`}
            onError={handleImageError}
          />
        </div>

        {/* Map section with dynamic height */}
        {showFullDescription && (
          <motion.div
            className="border-t border-black"
            style={{
              height: `${getMapHeight(showFullDescription, contentHeight)}px`,
              minHeight: '220px',
              maxHeight: '350px'
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
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Content section */}
      <motion.div
        className="w-[70%] p-8 flex flex-col"
        variants={shouldAnimate ? contentVariants : {}}
      >
        <div ref={contentRef} className="flex-1">
          <h3 className="text-2xl font-light text-black mb-4">{event.title}</h3>

          <div className="flex items-center text-sm text-black opacity-70 mb-4 flex-wrap gap-2">
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
            <span className="mx-2">·</span>
            <span>{event.time}</span>
            <span className="mx-2">·</span>
            <span>{event.venueName || event.location}</span>
          </div>

          <div className="text-sm text-black opacity-80 mb-4 leading-relaxed">
            {shouldTruncate && !showFullDescription ? (
              <>
                {event.description.substring(0, DESCRIPTION_LIMIT)}...
                <button
                  onClick={() => setShowFullDescription(true)}
                  className="ml-2 text-purple-800 hover:text-purple-600 underline text-sm"
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

          {/* Event meta info */}
          <div className="flex flex-wrap gap-3 text-xs text-black opacity-70 mb-4">
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

          {bookingStatus === 'cancelled' }

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
        </div>

        {/* Book button */}
        <div className="w-full mt-2">
          <button
            onClick={handleBookEvent}
            disabled={(isBooked && bookingStatus !== 'cancelled') || loading || (!isBookable && bookingStatus !== 'cancelled')}
            className={`w-full py-4 px-4 text-lg font-light transition-all duration-300 ${(isBooked && bookingStatus !== 'cancelled')
              ? 'bg-transparent text-black'
              : loading
                ? 'bg-transparent text-black cursor-wait'
                : (!isBookable && bookingStatus !== 'cancelled')
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                  : 'bg-transparent text-black hover:text-green-800 transition-colors'
              }`}
            style={{
              background: ((isBooked && bookingStatus !== 'cancelled') || loading || isInteractiveButton) ? 'transparent' : undefined,
              border: ((isBooked && bookingStatus !== 'cancelled') || loading || isInteractiveButton) ? 'none' : undefined
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
    </div>
  );
};

export default EventCardDesktopLayout;
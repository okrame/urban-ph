import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BookingForm from './BookingForm';
import PaymentModal from './PaymentModal';
import RoughNotationText from './RoughNotationText';
import LoadingSpinner from './LoadingSpinner';
import EventCardDesktopLayout from './EventCard/EventCardDesktopLayout';
import EventCardMobileLayout from './EventCard/EventCardMobileLayout';
import { useEventCardPosition } from '../contexts/EventCardPositionContext';

// Custom hooks
import { useEventCardState } from '../hooks/useEventCardState';
import { useEventCardHandlers } from '../hooks/useEventCardHandlers';

// Utils
import { 
  containerVariants,
  createImageVariants,
  createContentVariants,
  createMobileVariants,
  getButtonState,
  getButtonText
} from '../utils/eventCardUtils';

function EventCard({ event, user, onAuthNeeded, index = 0 }) {
  // State management via custom hook
  const state = useEventCardState(event, user);
  
  // Position tracking
  const { updateEventCardPosition } = useEventCardPosition();
  
  // Handlers via custom hook
  const handlers = useEventCardHandlers({
    event,
    user,
    onAuthNeeded,
    isBookable: state.isBookable,
    bookableReason: state.bookableReason,
    isBooked: state.isBooked,
    bookingStatus: state.bookingStatus,
    applicablePrice: state.applicablePrice,
    setLoading: state.setLoading,
    setAuthError: state.setAuthError,
    setAuthRequested: state.setAuthRequested,
    setIsFirstTimeBooking: state.setIsFirstTimeBooking,
    setExistingUserData: state.setExistingUserData,
    setShowBookingForm: state.setShowBookingForm,
    setBookingFormData: state.setBookingFormData,
    setShowPaymentModal: state.setShowPaymentModal,
    setIsBooked: state.setIsBooked,
    setBookingSuccess: state.setBookingSuccess,
    setBookingStatus: state.setBookingStatus,
    setShouldAnimate: state.setShouldAnimate,
    setAllowRoughAnimations: state.setAllowRoughAnimations,
    setBookingJustCompleted: state.setBookingJustCompleted,
    setAnnotationTrigger: state.setAnnotationTrigger,
    setImageError: state.setImageError
  });

  // Derived values
  const isImageLeft = index % 2 === 0;
  const { isClosedForBooking, isFullyBooked, isInteractiveButton } = getButtonState(
    state.isBooked, 
    state.bookingStatus, 
    state.loading, 
    state.isBookable
  );

  // Position tracking effect
  useEffect(() => {
    if (!state.cardRef.current || !updateEventCardPosition) return;

    const updatePosition = () => {
      const rect = state.cardRef.current.getBoundingClientRect();
      updateEventCardPosition(rect, index);
    };

    updatePosition();

    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(state.cardRef.current);
    window.addEventListener('resize', updatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [updateEventCardPosition, index]);

  // User auth effect
  useEffect(() => {
    if (!state.prevUserState && user && state.authRequested && !state.isBooked) {
      handlers.handleBookEvent();
      state.setAuthRequested(false);
    }
    state.setPrevUserState(user);
  }, [user, state.authRequested, state.isBooked]);

  // Animation effects
  useEffect(() => {
    if (state.roughAnimationsReady) {
      state.setAnnotationTrigger(prev => prev + 1);
    }
  }, [state.showFullDescription, state.roughAnimationsReady]);

  useEffect(() => {
    let resizeTimer;
    const handleResize = () => {
      if (state.roughAnimationsReady) {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          state.setAnnotationTrigger(prev => prev + 1);
        }, 200);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [state.roughAnimationsReady]);

  // Animation variants
  const imageVariants = createImageVariants(isImageLeft);
  const contentVariants = createContentVariants(
    isImageLeft, 
    state.setCardVisible, 
    state.setRoughAnimationsReady
  );
  const mobileVariants = createMobileVariants(
    state.setCardVisible, 
    state.setRoughAnimationsReady
  );

  // Button content logic
  const getButtonContent = () => {
    if (state.isBooked && state.bookingStatus !== 'cancelled') {
      return (
        <RoughNotationText
          type="box"
          color="#AFACFB"
          strokeWidth={2}
          animationDelay={100}
          disabled={!state.allowRoughAnimations || !state.roughAnimationsReady || state.bookingJustCompleted}
          trigger={state.annotationTrigger}
        >
          Booking Confirmed!
        </RoughNotationText>
      );
    }

    if (state.loading) {
      return (
        <div className="flex items-center gap-2">
          <LoadingSpinner size={20} color="#4A7E74" />
          <span>Hold on...</span>
        </div>
      );
    }

    return getButtonText(
      state.isBooked, 
      state.bookingStatus, 
      state.loading, 
      state.isBookable, 
      state.eventStatus, 
      user, 
      state.bookableReason
    );
  };

  // Early returns for special states
  if (!event || !event.id) {
    return null;
  }

  // Show booking form
  if (state.showBookingForm) {
    return (
      <motion.div
        ref={state.cardRef}
        className={`bg-white overflow-hidden`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-light mb-4 text-black">{event.title}</h3>
        {state.authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {state.authError}
          </div>
        )}
        <BookingForm
          onSubmit={handlers.handleFormSubmit}
          onCancel={handlers.handleCancelForm}
          loading={state.loading}
          isFirstTime={state.isFirstTimeBooking}
          existingData={state.existingUserData}
          event={{
            ...event,
            paymentAmount: state.applicablePrice,
            userMembershipStatus: state.userMembershipStatus
          }}
        />
      </motion.div>
    );
  }

  // Show payment modal
  if (state.showPaymentModal) {
    const eventForPayment = {
      ...event,
      paymentAmount: state.applicablePrice
    };

    return (
      <>
        <motion.div
          ref={state.cardRef}
          className="bg-white overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-light mb-4 text-black">{event.title}</h3>
          <p className="text-center text-gray-600 text-sm">
            Please complete the payment to confirm your booking.
          </p>
          {state.authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {state.authError}
            </div>
          )}
        </motion.div>

        <PaymentModal
          isOpen={state.showPaymentModal}
          onClose={handlers.handlePaymentCancel}
          event={eventForPayment}
          userData={state.bookingFormData}
          onPaymentSuccess={handlers.handlePaymentSuccess}
          onPaymentCancel={handlers.handlePaymentCancel}
        />
      </>
    );
  }

  // Main event card
  return (
    <motion.div
      ref={state.cardRef}
      className="bg-white overflow-hidden"
      variants={containerVariants}
      initial={state.shouldAnimate ? "hidden" : "false"}
      animate={state.shouldAnimate ? undefined : "false"}
      whileInView={state.shouldAnimate ? "visible" : undefined}
      viewport={state.shouldAnimate ? { once: true, amount: 0.3 } : undefined}
    >
      {/* Desktop Layout */}
      <EventCardDesktopLayout
        event={event}
        index={index}
        isImageLeft={isImageLeft}
        shouldAnimate={state.shouldAnimate}
        imageVariants={imageVariants}
        contentVariants={contentVariants}
        contentRef={state.contentRef}
        showFullDescription={state.showFullDescription}
        setShowFullDescription={state.setShowFullDescription}
        contentHeight={state.contentHeight}
        handleImageError={handlers.handleImageError}
        imageError={state.imageError}
        roughAnimationsReady={state.roughAnimationsReady}
        allowRoughAnimations={state.allowRoughAnimations}
        annotationTrigger={state.annotationTrigger}
        authError={state.authError}
        bookingStatus={state.bookingStatus}
        eventStatus={state.eventStatus}
        isBookable={state.isBookable}
        isFullyBooked={isFullyBooked}
        isClosedForBooking={isClosedForBooking}
        getButtonContent={getButtonContent}
        getButtonText={() => getButtonText(
          state.isBooked, 
          state.bookingStatus, 
          state.loading, 
          state.isBookable, 
          state.eventStatus, 
          user, 
          state.bookableReason
        )}
        isInteractiveButton={isInteractiveButton}
        handleBookEvent={handlers.handleBookEvent}
        isBooked={state.isBooked}
        loading={state.loading}
      />

      {/* Mobile Layout */}
      <EventCardMobileLayout
        event={event}
        index={index}
        shouldAnimate={state.shouldAnimate}
        mobileVariants={mobileVariants}
        cardRef={state.cardRef}
        contentRef={state.contentRef}
        showFullDescription={state.showFullDescription}
        setShowFullDescription={state.setShowFullDescription}
        handleImageError={handlers.handleImageError}
        imageError={state.imageError}
        roughAnimationsReady={state.roughAnimationsReady}
        allowRoughAnimations={state.allowRoughAnimations}
        annotationTrigger={state.annotationTrigger}
        authError={state.authError}
        bookingStatus={state.bookingStatus}
        eventStatus={state.eventStatus}
        isBookable={state.isBookable}
        isFullyBooked={isFullyBooked}
        isClosedForBooking={isClosedForBooking}
        getButtonContent={getButtonContent}
        getButtonText={() => getButtonText(
          state.isBooked, 
          state.bookingStatus, 
          state.loading, 
          state.isBookable, 
          state.eventStatus, 
          user, 
          state.bookableReason
        )}
        isInteractiveButton={isInteractiveButton}
        handleBookEvent={handlers.handleBookEvent}
        isBooked={state.isBooked}
        loading={state.loading}
      />
    </motion.div>
  );
}

export default EventCard;
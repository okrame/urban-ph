import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { bookEventSimple, checkUserBooking, determineEventStatus, isEventBookable, getUserContactInfo } from '../../firebase/firestoreServices';
import { getUserProfile, checkUserProfileComplete } from '../../firebase/userServices';
import BookingForm from './BookingForm';
import PaymentModal from './PaymentModal';
import LocationMap from './LocationMap';
import RoughNotationText from './RoughNotationText';
import LoadingSpinner from './LoadingSpinner';
import { useEventCardPosition } from '../contexts/EventCardPositionContext';

const getBorderClasses = (index) => {
  // All cards get bottom border + alternating left/right borders
  if (index % 2 === 0) {
    // Even index (0, 2, 4...) - bottom + left borders with bottom-left rounded corner
    return "border-b-2 border-l-2 border-black rounded-bl-3xl";
  } else {
    // Odd index (1, 3, 5...) - bottom + right borders with bottom-right rounded corner
    return "border-b-2 border-r-2 border-black rounded-br-3xl";
  }
};


function EventCard({ event, user, onAuthNeeded, index = 0 }) {
  const [isBooked, setIsBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [eventStatus, setEventStatus] = useState('');
  const [isBookable, setIsBookable] = useState(true);
  const [bookableReason, setBookableReason] = useState('');
  const [imageError, setImageError] = useState(false);
  const [prevUserState, setPrevUserState] = useState(null);
  const [authRequested, setAuthRequested] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('none');

  const [bookingFormData, setBookingFormData] = useState(null);
  const [isFirstTimeBooking, setIsFirstTimeBooking] = useState(false);
  const [existingUserData, setExistingUserData] = useState({});
  const [userMembershipStatus, setUserMembershipStatus] = useState(null);
  const [applicablePrice, setApplicablePrice] = useState(0);

  // State to track if we should show animations (only for main card view)
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [cardVisible, setCardVisible] = useState(false);
  const [roughAnimationsReady, setRoughAnimationsReady] = useState(false);
  const [annotationTrigger, setAnnotationTrigger] = useState(0);
  const [allowRoughAnimations, setAllowRoughAnimations] = useState(true);
  const [bookingJustCompleted, setBookingJustCompleted] = useState(false);

  // Refs for dynamic sizing and position tracking
  const contentRef = useRef(null);
  const cardRef = useRef(null); // NEW: Ref for the main card container
  const [contentHeight, setContentHeight] = useState(0);

  const { updateEventCardPosition, getMobileMargins } = useEventCardPosition();

  // Determine if image should be on left or right based on index
  const isImageLeft = index % 2 === 0;

  // Character limit for description
  const DESCRIPTION_LIMIT = 400;
  const shouldTruncate = event.description && event.description.length > DESCRIPTION_LIMIT;

  // NEW
useEffect(() => {
  if (!cardRef.current || !updateEventCardPosition) return;

  const updatePosition = () => {
    const rect = cardRef.current.getBoundingClientRect();
    updateEventCardPosition(rect, index);
  };

  updatePosition();

  
  const resizeObserver = new ResizeObserver(updatePosition);
  resizeObserver.observe(cardRef.current);
  
  window.addEventListener('resize', updatePosition);
  
  return () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', updatePosition);
  };
}, [updateEventCardPosition, index]);

  // Animation variants for slide-in effects
  const imageVariants = {
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
  };

  const contentVariants = {
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
          // Start rough notation animations after a short delay
          setTimeout(() => setRoughAnimationsReady(true), 200);
        }
      }
    }
  };

  // Container animation to orchestrate the simultaneous animation
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0 // Simultaneous animation
      }
    }
  };

  // Mobile animation variants (simpler, no horizontal movement)
  const mobileVariants = {
    hidden: {
      y: 30,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        onComplete: () => {
          setCardVisible(true);
          // Start rough notation animations after a short delay
          setTimeout(() => setRoughAnimationsReady(true), 200);
        }
      }
    }
  };

  // Effect to measure content height when description is expanded
  useEffect(() => {
    if (showFullDescription && contentRef.current) {
      const measureHeight = () => {
        const height = contentRef.current.scrollHeight;
        setContentHeight(height);
      };
      measureHeight();
    } else {
      setContentHeight(0);
    }
  }, [showFullDescription, event.description]);

  // Effect to trigger annotation recreation when layout changes - SIMPLE APPROACH
  useEffect(() => {
    if (roughAnimationsReady) {
      // Trigger immediately to hide existing annotations, then recreate after layout settles
      setAnnotationTrigger(prev => prev + 1);
    }
  }, [showFullDescription, roughAnimationsReady]);

  // Resize handler
  useEffect(() => {
    let resizeTimer;
    
    const handleResize = () => {
      if (roughAnimationsReady) {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          setAnnotationTrigger(prev => prev + 1);
        }, 200);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [roughAnimationsReady]);

  // Calculate map height based on content height
  const getMapHeight = () => {
    if (!showFullDescription) return 0;

    // Base height for the main image (384px = h-96)
    const baseImageHeight = 384;
    // Maximum map height (350px for expanded view)
    const maxMapHeight = 350;
    // Minimum map height for readability
    const minMapHeight = 220;

    if (contentHeight > 0) {
      // Calculate proportional height but cap it at maximum
      const proportionalHeight = Math.min(contentHeight * 0.7, maxMapHeight);
      return Math.max(proportionalHeight, minMapHeight);
    }

    return minMapHeight;
  };

  // [Keep all existing useEffect hooks - unchanged]
  useEffect(() => {
    if (!prevUserState && user && authRequested && !isBooked) {
      handleBookEvent();
      setAuthRequested(false);
    }
    setPrevUserState(user);
  }, [user, authRequested, isBooked]);

  useEffect(() => {
    setIsBooked(false);
    setBookingSuccess(false);
    setAuthError(null);
    setShowBookingForm(false);
    setShowPaymentModal(false);
    setBookingStatus('none');
  }, [user]);

  useEffect(() => {
    if (event) {
      const status = determineEventStatus(event.date, event.time);
      setEventStatus(status);
      setImageError(false);

      const checkBookability = async () => {
        try {
          const { bookable, reason } = await isEventBookable(event.id);
          setIsBookable(bookable);
          setBookableReason(reason || '');
        } catch (error) {
          console.error("Error checking event bookability:", error);
          setIsBookable(false);
          setBookableReason("Error checking event status");
        }
      };

      checkBookability();
    }
  }, [event]);

  useEffect(() => {
    const checkMembershipStatus = async () => {
      if (user && event) {
        try {
          const { getUserProfile } = await import('../../firebase/userServices');
          const userProfile = await getUserProfile(user.uid);
          const isMember = userProfile?.currentYearMember || false;
          setUserMembershipStatus(isMember);

          const isPaidEvent = event.memberPrice !== null && event.nonMemberPrice !== null;

          if (isPaidEvent) {
            setApplicablePrice(isMember ? event.memberPrice : event.nonMemberPrice);
          } else if (event.paymentAmount) {
            setApplicablePrice(event.paymentAmount);
          } else {
            setApplicablePrice(0);
          }
        } catch (error) {
          console.error('Error checking membership status:', error);
          setUserMembershipStatus(false);

          const isPaidEvent = event.memberPrice !== null && event.nonMemberPrice !== null;
          setApplicablePrice(isPaidEvent ? event.nonMemberPrice : (event.paymentAmount || 0));
        }
      } else {
        setUserMembershipStatus(null);
        const isPaidEvent = event.memberPrice !== null && event.nonMemberPrice !== null;
        setApplicablePrice(isPaidEvent ? event.nonMemberPrice : (event.paymentAmount || 0));
      }
    };

    checkMembershipStatus();
  }, [user, event]);

  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!user || !event.id) {
        setIsBooked(false);
        setBookingSuccess(false);
        setBookingStatus('none');
        return;
      }

      try {
        const { isBooked: hasBooking, status } = await checkUserBooking(user.uid, event.id, true);

        if (hasBooking && status !== 'cancelled') {
          setIsBooked(true);
          setBookingSuccess(true);
          setBookingStatus(status || 'confirmed');
        } else {
          setIsBooked(false);
          setBookingSuccess(false);
          setBookingStatus(status || 'none');
        }
      } catch (error) {
        console.error("Error checking booking status:", error);
        setIsBooked(false);
        setBookingSuccess(false);
        setBookingStatus('none');
      }
    };

    checkBookingStatus();
  }, [user, event.id]);

  // [Keep all handler functions - unchanged from original]
  const handleBookEvent = async () => {
    setAuthError(null);

    if (!isBookable) {
      setAuthError(bookableReason);
      return;
    }

    if (!user) {
      if (onAuthNeeded) {
        setAuthRequested(true);
        onAuthNeeded();
      }
      return;
    }

    if (isBooked && bookingStatus !== 'cancelled') {
      setAuthError("You've already booked this event!");
      return;
    }

    try {
      setLoading(true);

      const { checkUserBookingRequirements } = await import('../../firebase/firestoreServices');
      const requirements = await checkUserBookingRequirements(user.uid);

      setIsFirstTimeBooking(requirements.needsPersonalDetails);

      if (requirements.needsPersonalDetails) {
        if (requirements.isFirstTime) {
          setExistingUserData(requirements.existingData || {});
        } else {
          setExistingUserData({
            ...requirements.existingData,
            email: requirements.existingData.email || user.email || '',
            phone: ''
          });

          const contactInfo = await getUserContactInfo(user.uid);
          if (contactInfo) {
            setExistingUserData(prev => ({
              ...prev,
              email: contactInfo.email || prev.email,
              phone: contactInfo.phone || ''
            }));
          }
        }
      } else {
        const contactInfo = await getUserContactInfo(user.uid);
        setExistingUserData({
          ...requirements.existingData,
          email: contactInfo?.email || requirements.existingData.email || user.email || '',
          phone: contactInfo?.phone || ''
        });
      }
    } catch (error) {
      console.error("Error checking booking requirements:", error);
      setAuthError("Error checking user information. Please try again.");
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }

    setShowBookingForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setAuthError(null);

    try {
      const { bookable, reason } = await isEventBookable(event.id);
      if (!bookable) {
        setAuthError(reason);
        setLoading(false);
        return;
      }

      const userData = {
        userId: user.uid,
        email: formData.email,
        phone: formData.phone,
        displayName: user.displayName || null,
        name: formData.name,
        surname: formData.surname,
        birthDate: formData.birthDate,
        address: formData.address,
        taxId: formData.taxId,
        instagram: formData.instagram,
        requests: formData.requests
      };

      setBookingFormData(userData);

      const isPaidEvent = event.memberPrice !== null && event.nonMemberPrice !== null;
      const requiresPayment = isPaidEvent && applicablePrice > 0;

      if (requiresPayment) {
        setShowBookingForm(false);
        setShowPaymentModal(true);
      } else {
        const result = await bookEventSimple(event.id, userData);

        if (result.success) {
          setIsBooked(true);
          setBookingSuccess(true);
          setBookingStatus('confirmed');
          setShowBookingForm(false);
          setShouldAnimate(false); // Disable motion animations
          setAllowRoughAnimations(true); // Keep rough annotations enabled
          setBookingJustCompleted(true); // Prevent immediate highlight animation
          
          // Trigger clean booking confirmed animation after delay
          setTimeout(() => {
            setBookingJustCompleted(false);
            setAnnotationTrigger(prev => prev + 1);
          }, 300);
        } else {
          setAuthError(result.message || "Booking failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error preparing for booking:", error);
      setAuthError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    setLoading(true);
    setAuthError(null);

    try {
      console.log("Payment approved:", paymentData);

      const sanitizedPaymentDetails = {
        paymentId: paymentData.paymentDetails?.paymentId || '',
        payerID: paymentData.paymentDetails?.payerID || null,
        payerEmail: paymentData.paymentDetails?.payerEmail || '',
        status: 'COMPLETED',
        amount: applicablePrice,
        currency: event.paymentCurrency || 'EUR',
        createTime: paymentData.paymentDetails?.createTime || new Date().toISOString(),
        updateTime: paymentData.paymentDetails?.updateTime || new Date().toISOString(),
        orderId: paymentData.paymentDetails?.orderId || null
      };

      const result = await bookEventSimple(event.id, {
        ...bookingFormData,
        paymentDetails: sanitizedPaymentDetails
      });

      if (result && result.success) {
        setIsBooked(true);
        setBookingSuccess(true);
        setBookingStatus('confirmed');
        setShowPaymentModal(false);
        setShouldAnimate(false); // Disable motion animations
        setAllowRoughAnimations(true); // Keep rough annotations enabled
        setBookingJustCompleted(true); // Prevent immediate highlight animation
        
        // Trigger clean booking confirmed animation after delay
        setTimeout(() => {
          setBookingJustCompleted(false);
          setAnnotationTrigger(prev => prev + 1);
        }, 500);
      } else {
        throw new Error(result.message || "Unknown error during booking");
      }
    } catch (error) {
      console.error("Error completing booking:", error);
      setAuthError("An error occurred during booking. Please contact support with your payment ID.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setAuthError("Payment was cancelled.");
  };

  const handleCancelForm = () => {
    setShowBookingForm(false);
    setAuthError(null);
    setShouldAnimate(false); // Disable motion animations since card has been viewed
    setAllowRoughAnimations(true); // Keep rough annotations enabled
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageSource = () => {
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

  const isClosedForBooking = !isBookable && eventStatus === 'active';
  const isFullyBooked = bookableReason === "No spots left";
  const isInteractiveButton = !((isBooked && bookingStatus !== 'cancelled') || loading || (!isBookable && bookingStatus !== 'cancelled'));

  // Get button text and rendering logic
  const getButtonContent = () => {
    if (isBooked && bookingStatus !== 'cancelled') {
      // Return JSX for booking confirmed with purple highlight
      return (
        <RoughNotationText
          type="box"
          color="#AFACFB"
          strokeWidth={2}
          animationDelay={100}
          disabled={!allowRoughAnimations || !roughAnimationsReady || bookingJustCompleted}
          trigger={annotationTrigger}
        >
          Booking Confirmed!
        </RoughNotationText>
      );
    }
    
    if (loading) {
      // Return JSX with loading spinner
      return (
        <div className="flex items-center gap-2">
          <LoadingSpinner size={20} color="#4A7E74" />
          <span>Hold on...</span>
        </div>
      );
    }
    
    if (!isBookable && bookingStatus !== 'cancelled') {
      if (isFullyBooked) return 'Fully Booked';
      if (eventStatus === 'past') return 'Event Ended';
      return 'Booking Closed';
    }
    
    if (user) {
      if (bookingStatus === 'cancelled') return 'Book Again';
      return 'Book Now';
    }
    
    return 'Sign In to Book';
  };

  // Simplified button text getter for cases where we need string
  const getButtonText = () => {
    if (isBooked && bookingStatus !== 'cancelled') return 'Booking Confirmed!';
    if (loading) return 'Hold on...';
    if (!isBookable && bookingStatus !== 'cancelled') {
      if (isFullyBooked) return 'Fully Booked';
      if (eventStatus === 'past') return 'Event Ended';
      return 'Booking Closed';
    }
    if (user) {
      if (bookingStatus === 'cancelled') return 'Book Again';
      return 'Book Now';
    }
    return 'Sign In to Book';
  };

  if (!event || !event.id) {
    return null;
  }

  // Show booking form
  if (showBookingForm) {
  return (
    <motion.div
      ref={cardRef} 
      className={`bg-white overflow-hidden ${getBorderClasses(index)}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-light mb-4 text-black">{event.title}</h3>
      {authError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {authError}
        </div>
      )}
      <BookingForm
        onSubmit={handleFormSubmit}
        onCancel={handleCancelForm}
        loading={loading}
        isFirstTime={isFirstTimeBooking}
        existingData={existingUserData}
        event={{
          ...event,
          paymentAmount: applicablePrice,
          userMembershipStatus: userMembershipStatus
        }}
      />
    </motion.div>
  );
}

  // Show payment modal
  if (showPaymentModal) {
  const eventForPayment = {
    ...event,
    paymentAmount: applicablePrice
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        className={`bg-white overflow-hidden p-6 ${getBorderClasses(index)}`}  // Updated: use getBorderClasses, removed border and my-8
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-light mb-4 text-black">{event.title}</h3>
        <p className="text-center text-gray-600 text-sm">
          Please complete the payment to confirm your booking.
        </p>
        {authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {authError}
          </div>
        )}
      </motion.div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentCancel}
        event={eventForPayment}
        userData={bookingFormData}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentCancel={handlePaymentCancel}
      />
    </>
  );
}

  // Main event card with responsive layout
  return (
    <motion.div
      ref={cardRef} // add ref to the main container
      className={`bg-white overflow-hidden ${getBorderClasses(index)}`}
      variants={containerVariants}
      initial={shouldAnimate ? "hidden" : "false"}
      animate={shouldAnimate ? undefined : "false"}
      whileInView={shouldAnimate ? "visible" : undefined}
      viewport={shouldAnimate ? { once: true, amount: 0.3 } : undefined}
    >
      {/* Desktop Layout  */}
      <div className={`hidden lg:flex ${isImageLeft ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Image section */}
        <motion.div
          className="w-[30%] flex flex-col"
          variants={shouldAnimate ? imageVariants : {}}
        >
          {/* Main image */}
          <div className="h-96">
            <img
              src={getImageSource()}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>

          {/* Map section with dynamic height */}
          {showFullDescription && (
            <motion.div
              className="border-t border-black"
              style={{
                height: `${getMapHeight()}px`,
                minHeight: '220px',
                maxHeight: '350px'
              }}
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: `${getMapHeight()}px`,
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

        {/* Content section  */}
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
              {/* Spots left - no underline */}
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
              <div className="mb-3 p-3" style={{ backgroundColor: '#FFFADE' }}>
                <p className="font-medium text-black text-sm">Your previous booking was cancelled</p>
                <p className="text-xs text-black opacity-70 mt-1">You can book again if you wish.</p>
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
          </div>

          {/* Enhanced Book button - Updated for new content logic */}
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

      {/* Mobile Layout */}
      <motion.div
        ref={cardRef}
        className="lg:hidden mx-4 sm:mx-6 md:mx-8"
        variants={shouldAnimate ? mobileVariants : {}}
        initial={shouldAnimate ? "hidden" : "false"}
        animate={shouldAnimate ? undefined : "false"}
        whileInView={shouldAnimate ? "visible" : undefined}
        viewport={shouldAnimate ? { once: true, amount: 0.3 } : undefined}
      >
        {/* Mobile Image - Smaller height */}
        <div className="w-full h-48 sm:h-56">
          <img
            src={getImageSource()}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        </div>

        {/* Mobile Content */}
        <div 
  className="py-6"
  //style={getMobileMargins(index)}


>
  <h3 className="text-xl sm:text-2xl font-light text-black mb-3">{event.title}</h3>

  <div className="flex flex-col sm:flex-row sm:items-center text-sm text-black opacity-70 mb-4 gap-1 sm:gap-0 flex-wrap">
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
    <span className="hidden sm:inline mx-2">·</span>
    <span>{event.time}</span>
    <span className="hidden sm:inline mx-2">·</span>
    <div className="flex items-center gap-1">
      <span className="text-xs sm:text-sm">
        {event.venueName || event.location}
      </span>
    </div>
  </div>

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

  {/* Event meta info - Mobile - no underline for spots left */}
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
            <div className="mb-3 p-3" style={{ backgroundColor: '#FFFADE' }}>
              <p className="font-medium text-black text-sm">Your previous booking was cancelled</p>
              <p className="text-xs text-black opacity-70 mt-1">You can book again if you wish.</p>
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

          {/* Mobile Book button - Updated for new content logic */}
          <div className="w-full mt-2">
            <button
              onClick={handleBookEvent}
              disabled={(isBooked && bookingStatus !== 'cancelled') || loading || (!isBookable && bookingStatus !== 'cancelled')}
              className={`w-full py-3 px-4 text-base font-light transition-all duration-300 ${(isBooked && bookingStatus !== 'cancelled')
                  ? 'bg-transparent text-black'
                  : loading
                    ? 'bg-transparent text-black cursor-wait'
                    : (!isBookable && bookingStatus !== 'cancelled')
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                      : 'bg-transparent text-black hover:text-purple-700 transition-colors'
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
        </div>
      </motion.div>
    </motion.div>
  );
}

export default EventCard;
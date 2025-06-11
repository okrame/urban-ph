import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { bookEventSimple, checkUserBooking, determineEventStatus, isEventBookable, getUserContactInfo } from '../../firebase/firestoreServices';
import { getUserProfile, checkUserProfileComplete } from '../../firebase/userServices';
import BookingForm from './BookingForm';
import PaymentModal from './PaymentModal';
import LocationMap from './LocationMap';

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
  
  // Determine if image should be on left or right based on index
  const isImageLeft = index % 2 === 0;
  
  // Character limit for description
  const DESCRIPTION_LIMIT = 200;
  const shouldTruncate = event.description && event.description.length > DESCRIPTION_LIMIT;
  
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
        ease: "easeOut"
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
        ease: "easeOut"
      }
    }
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
  
  // [Keep all handler functions - unchanged]
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
          setShouldAnimate(false);
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
        setShouldAnimate(false);
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
    // Disable animation since card has already been viewed
    setShouldAnimate(false);
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

  if (!event || !event.id) {
  return null;
}

  // Show booking form
  if (showBookingForm) {
    return (
      <motion.div 
        className="bg-white border border-black rounded-none overflow-hidden p-6 my-8"
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
          className="bg-white border border-black rounded-none overflow-hidden p-6 my-8"
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
      className="bg-white border border-black my-8 overflow-hidden"
      variants={containerVariants}
      initial={shouldAnimate ? "hidden" : "false"}
      animate={shouldAnimate ? undefined : "false"}
      whileInView={shouldAnimate ? "visible" : undefined}
      viewport={shouldAnimate ? { once: true, amount: 0.3 } : undefined}
    >
      {/* Desktop Layout */}
      <div className={`hidden lg:flex ${isImageLeft ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Image section - 50% width with animation */}
        <motion.div 
          className="w-1/2 flex flex-col"
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
          
          {/* Map section appears below the image when expanded */}
          {showFullDescription && (
            <motion.div 
              className="border-t border-black"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4">
                <h4 className="text-sm font-light text-black mb-3">Event Location</h4>
                <LocationMap location={event.location} isVisible={showFullDescription} />
              </div>
            </motion.div>
          )}
        </motion.div>
        
        {/* Content section - 50% width with animation */}
        <motion.div 
          className="w-1/2 p-8 flex flex-col justify-between"
          variants={shouldAnimate ? contentVariants : {}}

        >
          <div>
            <h3 className="text-2xl font-light text-black mb-4">{event.title}</h3>
            
            <div className="flex items-center text-sm text-black opacity-70 mb-4">
              <span>{event.date}</span>
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
            
            {/* Event meta info */}
            <div className="flex flex-wrap gap-3 text-xs text-black opacity-70 mb-4">
              <span className="border border-black px-2 py-1">{event.type}</span>
              <span className="border border-black px-2 py-1">
                {event.spotsLeft > 0 ? `${event.spotsLeft} spots left` : "Fully booked"}
              </span>
              {(event.memberPrice !== null || event.nonMemberPrice !== null || event.paymentAmount > 0) && (
                <span className="border border-purple-600 text-purple-600 px-2 py-1">
                  {event.memberPrice !== null && event.nonMemberPrice !== null ? (
                    user ? (
                      userMembershipStatus !== null ? (
                        userMembershipStatus ? `€${event.memberPrice}` : `€${event.nonMemberPrice}`
                      ) : `€${event.memberPrice}/${event.nonMemberPrice}`
                    ) : `€${event.memberPrice}/${event.nonMemberPrice}`
                  ) : (
                    `€${event.paymentAmount || 0}`
                  )}
                </span>
              )}
            </div>
            
            {/* Status messages */}
            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                {authError}
              </div>
            )}
            
            {bookingStatus === 'cancelled' && (
              <div className="mb-4 p-3" style={{backgroundColor: '#FFFADE'}}>
                <p className="font-medium text-black text-sm">Your previous booking was cancelled</p>
                <p className="text-xs text-black opacity-70 mt-1">You can book again if you wish.</p>
              </div>
            )}
            
            {isFullyBooked && bookingStatus !== 'cancelled' && (
              <div className="mb-4 p-3" style={{backgroundColor: '#FFFADE'}}>
                <p className="font-medium text-black text-sm">This event is fully booked</p>
              </div>
            )}
            
            {eventStatus === 'past' && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
                <p className="font-medium text-black text-sm">This event has ended</p>
              </div>
            )}
            
            {isClosedForBooking && bookingStatus !== 'cancelled' && (
              <div className="mb-4 p-3" style={{backgroundColor: '#FFFADE'}}>
                <p className="font-medium text-black text-sm">Booking closed</p>
              </div>
            )}
          </div>
          
          {/* Book button with hover animation */}
          <motion.button 
            onClick={handleBookEvent}
            disabled={(isBooked && bookingStatus !== 'cancelled') || loading || (!isBookable && bookingStatus !== 'cancelled')}
            className={`w-full py-3 px-4 border text-sm font-light transition-colors ${
              (isBooked && bookingStatus !== 'cancelled') || (bookingSuccess && bookingStatus !== 'cancelled')
                ? 'border-black bg-black text-white cursor-not-allowed' 
                : (!isBookable && bookingStatus !== 'cancelled')
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : loading 
                    ? 'border-gray-300 bg-gray-100 text-gray-600 cursor-wait' 
                    : 'border-black bg-white text-black hover:bg-black hover:text-white'
            }`}
            whileHover={{ scale: loading || (isBooked && bookingStatus !== 'cancelled') || (!isBookable && bookingStatus !== 'cancelled') ? 1 : 1.02 }}
            whileTap={{ scale: loading || (isBooked && bookingStatus !== 'cancelled') || (!isBookable && bookingStatus !== 'cancelled') ? 1 : 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {isBooked && bookingStatus !== 'cancelled'
              ? 'Booking Confirmed' 
              : loading 
                ? 'Processing...' 
                : (!isBookable && bookingStatus !== 'cancelled')
                  ? isFullyBooked 
                    ? 'Fully Booked'
                    : eventStatus === 'past'
                      ? 'Event Ended'
                      : 'Booking Closed'
                  : user 
                    ? bookingStatus === 'cancelled'
                      ? 'Book Again'
                      : 'Book Now'
                    : 'Sign In to Book'}
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile Layout */}
      <motion.div 
        className="lg:hidden"
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
        <div className="p-6">
          <h3 className="text-xl sm:text-2xl font-light text-black mb-3">{event.title}</h3>
          
          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-black opacity-70 mb-4 gap-1 sm:gap-0">
            <span>{event.date}</span>
            <span className="hidden sm:inline mx-2">·</span>
            <span>{event.time}</span>
            <span className="hidden sm:inline mx-2">·</span>
            <span className="text-xs sm:text-sm">{event.venueName || event.location}</span>
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

          {/* Mobile Map section - Full width under text when expanded */}
          {showFullDescription && (
            <motion.div 
              className="mb-4 border border-black rounded-none overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4">
                <h4 className="text-sm font-light text-black mb-3">Event Location</h4>
                <LocationMap location={event.location} isVisible={showFullDescription} />
              </div>
            </motion.div>
          )}
          
          {/* Event meta info */}
          <div className="flex flex-wrap gap-2 text-xs text-black opacity-70 mb-4">
            <span className="border border-black px-2 py-1">{event.type}</span>
            <span className="border border-black px-2 py-1">
              {event.spotsLeft > 0 ? `${event.spotsLeft} spots left` : "Fully booked"}
            </span>
            {(event.memberPrice !== null || event.nonMemberPrice !== null || event.paymentAmount > 0) && (
              <span className="border border-purple-600 text-purple-600 px-2 py-1">
                {event.memberPrice !== null && event.nonMemberPrice !== null ? (
                  user ? (
                    userMembershipStatus !== null ? (
                      userMembershipStatus ? `€${event.memberPrice}` : `€${event.nonMemberPrice}`
                    ) : `€${event.memberPrice}/${event.nonMemberPrice}`
                  ) : `€${event.memberPrice}/${event.nonMemberPrice}`
                ) : (
                  `€${event.paymentAmount || 0}`
                )}
              </span>
            )}
          </div>
          
          {/* Status messages */}
          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {authError}
            </div>
          )}
          
          {bookingStatus === 'cancelled' && (
            <div className="mb-4 p-3" style={{backgroundColor: '#FFFADE'}}>
              <p className="font-medium text-black text-sm">Your previous booking was cancelled</p>
              <p className="text-xs text-black opacity-70 mt-1">You can book again if you wish.</p>
            </div>
          )}
          
          {isFullyBooked && bookingStatus !== 'cancelled' && (
            <div className="mb-4 p-3" style={{backgroundColor: '#FFFADE'}}>
              <p className="font-medium text-black text-sm">This event is fully booked</p>
            </div>
          )}
          
          {eventStatus === 'past' && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
              <p className="font-medium text-black text-sm">This event has ended</p>
            </div>
          )}
          
          {isClosedForBooking && bookingStatus !== 'cancelled' && (
            <div className="mb-4 p-3" style={{backgroundColor: '#FFFADE'}}>
              <p className="font-medium text-black text-sm">Booking closed</p>
            </div>
          )}
          
          {/* Mobile Book button */}
          <motion.button 
            onClick={handleBookEvent}
            disabled={(isBooked && bookingStatus !== 'cancelled') || loading || (!isBookable && bookingStatus !== 'cancelled')}
            className={`w-full py-3 px-4 border text-sm font-light transition-colors ${
              (isBooked && bookingStatus !== 'cancelled') || (bookingSuccess && bookingStatus !== 'cancelled')
                ? 'border-black bg-black text-white cursor-not-allowed' 
                : (!isBookable && bookingStatus !== 'cancelled')
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : loading 
                    ? 'border-gray-300 bg-gray-100 text-gray-600 cursor-wait' 
                    : 'border-black bg-white text-black hover:bg-black hover:text-white'
            }`}
            whileHover={{ scale: loading || (isBooked && bookingStatus !== 'cancelled') || (!isBookable && bookingStatus !== 'cancelled') ? 1 : 1.02 }}
            whileTap={{ scale: loading || (isBooked && bookingStatus !== 'cancelled') || (!isBookable && bookingStatus !== 'cancelled') ? 1 : 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {isBooked && bookingStatus !== 'cancelled'
              ? 'Booking Confirmed' 
              : loading 
                ? 'Processing...' 
                : (!isBookable && bookingStatus !== 'cancelled')
                  ? isFullyBooked 
                    ? 'Fully Booked'
                    : eventStatus === 'past'
                      ? 'Event Ended'
                      : 'Booking Closed'
                  : user 
                    ? bookingStatus === 'cancelled'
                      ? 'Book Again'
                      : 'Book Now'
                    : 'Sign In to Book'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default EventCard;
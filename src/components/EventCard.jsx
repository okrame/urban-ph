import { useState, useEffect } from 'react';
import { bookEventSimple, checkUserBooking, determineEventStatus, isEventBookable, getUserContactInfo } from '../../firebase/firestoreServices';
import { getUserProfile, checkUserProfileComplete } from '../../firebase/userServices';
import BookingForm from './BookingForm';
import PaymentModal from './PaymentModal';

function EventCard({ event, user, onAuthNeeded }) {
  const [isBooked, setIsBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [eventStatus, setEventStatus] = useState('');
  const [isBookable, setIsBookable] = useState(true);
  const [bookableReason, setBookableReason] = useState('');
  const [imageError, setImageError] = useState(false);
  const [prevUserState, setPrevUserState] = useState(null);
  const [authRequested, setAuthRequested] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('none'); // 'none', 'confirmed', 'cancelled'
  
  const [bookingFormData, setBookingFormData] = useState(null);
  const [isFirstTimeBooking, setIsFirstTimeBooking] = useState(false);
  const [existingUserData, setExistingUserData] = useState({});
  
  // Track previous user state to detect sign-in, but only for requested auth
  useEffect(() => {
    if (!prevUserState && user && authRequested && !isBooked) {
      handleBookEvent();
      // Reset the auth requested flag to prevent reopening on subsequent renders
      setAuthRequested(false);
    }
    
    setPrevUserState(user);
  }, [user, authRequested, isBooked]);

  // Reset booking states when user changes (signs in or out)
  useEffect(() => {
    // Reset booking states when user changes
    setIsBooked(false);
    setBookingSuccess(false);
    setAuthError(null);
    setShowBookingForm(false);
    setShowPaymentModal(false);
    setBookingStatus('none');
  }, [user]);

  // Check event status and bookability
  useEffect(() => {
    if (event) {
      const status = determineEventStatus(event.date, event.time);
      setEventStatus(status);
      
      // Reset image error state when event changes
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
  
  // Check booking status when user or event changes
  useEffect(() => {
    const checkBookingStatus = async () => {
      // Reset the booking state if there's no user
      if (!user || !event.id) {
        setIsBooked(false);
        setBookingSuccess(false);
        setBookingStatus('none');
        return;
      }
      
      try {
        // Modified to return both the booking existence and status
        const { isBooked: hasBooking, status } = await checkUserBooking(user.uid, event.id, true);
        
        // Check if booking exists and is not cancelled
        if (hasBooking && status !== 'cancelled') {
          setIsBooked(true);
          setBookingSuccess(true);
          setBookingStatus(status || 'confirmed');
        } else {
          // If booking doesn't exist or was cancelled, user can book again
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
  
  const handleBookEvent = async () => {
    // Clear any previous errors
    setAuthError(null);
    
    // Check if event is bookable first
    if (!isBookable) {
      setAuthError(bookableReason);
      return;
    }
    
    if (!user) {
      // If no user is logged in, trigger the auth modal
      if (onAuthNeeded) {
        // Set flag that auth was requested specifically for this event
        setAuthRequested(true);
        onAuthNeeded();
      }
      return;
    }
    
    // Only block if the booking is confirmed (not cancelled)
    if (isBooked && bookingStatus !== 'cancelled') {
      setAuthError("You've already booked this event!");
      return;
    }
    
    // Check if this is user's first time booking
    try {
      setLoading(true);
      const isProfileComplete = await checkUserProfileComplete(user.uid);
      setIsFirstTimeBooking(!isProfileComplete);
      
      // Get user profile data
      const userProfile = await getUserProfile(user.uid);
      
      if (!isProfileComplete) {
        // First time booking - use whatever profile data is available
        setExistingUserData(userProfile || {});
      } else {
        // Not first time - already has complete profile
        // Get contact info from previous bookings
        const contactInfo = await getUserContactInfo(user.uid);
        if (contactInfo) {
          setExistingUserData({
            ...userProfile,
            email: contactInfo.email || userProfile.email,
            phone: contactInfo.phone || ''
          });
        } else {
          setExistingUserData(userProfile || {});
        }
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
    } finally {
      setLoading(false);
    }    
    setShowBookingForm(true);
  };
  
  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Check bookability again just before submission
      const { bookable, reason } = await isEventBookable(event.id);
      if (!bookable) {
        setAuthError(reason);
        setLoading(false);
        return;
      }
      
      // Store form data for payment processing
      const userData = {
        userId: user.uid,
        email: formData.email,
        phone: formData.phone,
        displayName: user.displayName || null,
        // Include additional user data for profile
        name: formData.name,
        surname: formData.surname,
        birthDate: formData.birthDate,
        address: formData.address,
        taxId: formData.taxId,
        instagram: formData.instagram,
        requests: formData.requests
      };
      
      // Store form data for payment
      setBookingFormData(userData);
      
      // If event requires payment, show payment modal
      if (event.paymentAmount > 0) {
        setShowBookingForm(false);
        setShowPaymentModal(true);
      } else {
        // For free events, complete booking directly
        const result = await bookEventSimple(event.id, userData);
        
        if (result.success) {
          setIsBooked(true);
          setBookingSuccess(true);
          setBookingStatus('confirmed');
          setShowBookingForm(false);
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
      
      // Ensure paymentDetails has all needed properties with fallbacks for missing values
      const sanitizedPaymentDetails = {
        paymentId: paymentData.paymentDetails?.paymentId || '',
        payerID: paymentData.paymentDetails?.payerID || null,  // Allow null/undefined here
        payerEmail: paymentData.paymentDetails?.payerEmail || '',
        status: paymentData.paymentDetails?.status || 'COMPLETED',
        amount: event.paymentAmount || 0,
        currency: event.paymentCurrency || 'EUR',
        createTime: paymentData.paymentDetails?.createTime || new Date().toISOString(),
        updateTime: paymentData.paymentDetails?.updateTime || new Date().toISOString(),
        orderId: paymentData.paymentDetails?.orderId || null
      };
      
      // Complete booking with payment details
      const result = await bookEventSimple(event.id, {
        ...bookingFormData,
        paymentDetails: sanitizedPaymentDetails
      });
      
      if (result && result.success) {
        setIsBooked(true);
        setBookingSuccess(true);
        setBookingStatus('confirmed');
        setShowPaymentModal(false);
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
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Get appropriate image source with fallback
  const getImageSource = () => {
    if (imageError) {
      return 'https://via.placeholder.com/600x400?text=No+Image+Available';
    }
    
    // Use base64 image if available
    if (event.imageBase64) {
      return event.imageBase64;
    }
    
    // Fall back to URL if provided
    if (event.image) {
      return event.image;
    }
    
    // Default fallback
    return 'https://via.placeholder.com/600x400?text=No+Image+Available';
  };
  
  // Determine if event is closed for booking but still active
  const isClosedForBooking = !isBookable && eventStatus === 'active';
  
  // Determine if event is fully booked
  const isFullyBooked = bookableReason === "No spots left";

  // Booking form state
  if (showBookingForm) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-4">
        <h3 className="text-xl font-bold mb-3">{event.title}</h3>
        {authError && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            {authError}
          </div>
        )}
        <BookingForm 
          onSubmit={handleFormSubmit} 
          onCancel={handleCancelForm}
          loading={loading}
          isFirstTime={isFirstTimeBooking}
          existingData={existingUserData}
          event={event}
        />
      </div>
    );
  }
  
  // Payment modal
  if (showPaymentModal) {
    return (
      <>
        <div className="bg-white rounded-lg shadow-md overflow-hidden p-4">
          <h3 className="text-xl font-bold mb-3">{event.title}</h3>
          <p className="text-center text-gray-600">
            Please complete the payment to confirm your booking.
          </p>
          {authError && (
            <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
              {authError}
            </div>
          )}
        </div>
        
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentCancel}
          event={event}
          userData={bookingFormData}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCancel={handlePaymentCancel}
        />
      </>
    );
  }
  
  // Default state with accordion
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300">
      <div className="cursor-pointer" onClick={toggleExpand}>
        <div className="md:flex">
          <div className="md:w-1/4">
            <img 
              src={getImageSource()}
              alt={event.title}
              className="h-40 w-full object-cover md:h-32"
              onError={handleImageError}
            />
          </div>
          <div className="p-4 md:w-3/4">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{event.title}</h3>
              <span className="text-blue-600">
                {isExpanded ? 
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                  </svg> : 
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                }
              </span>
            </div>
            
            <div className="flex gap-2 mb-2 flex-wrap">
              <span className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700">
                📅 {event.date}
              </span>
              <span className="inline-block bg-blue-200 rounded-full px-2 py-1 text-xs font-semibold text-blue-700">
                {event.type}
              </span>
              <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold
                ${eventStatus === 'active' ? 'bg-green-200 text-green-700' : 
                  eventStatus === 'upcoming' ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                {eventStatus === 'active' ? 'Active' : 
                 eventStatus === 'upcoming' ? 'Upcoming' : 'Past'}
              </span>
              {event.paymentAmount > 0 && (
                <span className="inline-block bg-yellow-200 rounded-full px-2 py-1 text-xs font-semibold text-yellow-700">
                  €{event.paymentAmount}
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600">
              {event.spotsLeft > 0 
                ? `${event.spotsLeft} spots left out of ${event.spots}` 
                : "No spots left"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Expanded content */}
      <div className={`px-4 pb-4 ${isExpanded ? 'block' : 'hidden'}`}>
        <hr className="my-3" />
        
        <div className="mb-2">
          <span className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 mr-2">
            🕒 {event.time}
          </span>
          <span className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700">
            📍 {event.location}
          </span>
          {event.paymentAmount > 0 && (
            <span className="inline-block bg-yellow-200 rounded-full px-2 py-1 text-xs font-semibold text-yellow-700 ml-2">
              Cost: €{event.paymentAmount}
            </span>
          )}
        </div>
        
        <p className="text-gray-700 mb-4 text-sm">{event.description}</p>
        
        {authError && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {authError}
          </div>
        )}
        
        {/* Cancelled booking notification */}
        {bookingStatus === 'cancelled' && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-sm">
            <p className="font-bold">Your previous booking was cancelled</p>
            <p className="mt-1">Your reservation was cancelled by the organizer. You can book again if you wish.</p>
          </div>
        )}
        
        {/* Fully Booked Message with contact info */}
        {isFullyBooked && bookingStatus !== 'cancelled' && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-sm">
            <p className="font-bold">This event is fully booked!</p>
            <p className="mt-1">If you'd like to be notified if a spot becomes available, please email:</p>
            <a href="mailto:urbanphotohunts@example.com" className="text-blue-600 hover:underline block mt-1">
              urbanphotohunts@example.com
            </a>
          </div>
        )}
        
        {/* Past event message */}
        {eventStatus === 'past' && (
          <div className="mb-4 p-3 bg-gray-100 text-gray-700 rounded text-sm">
            <p className="font-bold">This event has ended</p>
            <p className="mt-1">Please check our upcoming events.</p>
          </div>
        )}
        
        {/* If event is active but booking window closed */}
        {isClosedForBooking && bookingStatus !== 'cancelled' && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-sm">
            <p className="font-bold">Booking for this event is now closed</p>
            <p className="mt-1">Booking closes 1 hour after the event start time.</p>
          </div>
        )}
        
        {/* Book button with appropriate state */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleBookEvent();
          }}
          disabled={(isBooked && bookingStatus !== 'cancelled') || loading || (!isBookable && bookingStatus !== 'cancelled')}
          className={`w-full px-4 py-2 rounded font-bold text-white ${
            (isBooked && bookingStatus !== 'cancelled') || (bookingSuccess && bookingStatus !== 'cancelled')
              ? 'bg-green-500 cursor-not-allowed' 
              : (!isBookable && bookingStatus !== 'cancelled')
                ? 'bg-gray-400 cursor-not-allowed'
                : loading 
                  ? 'bg-gray-400 cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isBooked && bookingStatus !== 'cancelled'
            ? '✓ Booking Confirmed' 
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
                    : (event.paymentAmount > 0 
                      ? `Book Now` 
                      : 'Book Now') 
                  : 'Book'}
        </button>
      </div>
    </div>
  );
}

export default EventCard;
import { useState, useEffect } from 'react';
import { auth } from '../../firebase/config';
import { bookEventSimple, checkUserBooking } from '../../firebase/firestoreServices';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { createUserProfile } from '../../firebase/userServices';
import BookingForm from './BookingForm';

function EventCard({ event, user }) {
  const [isBooked, setIsBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check booking status when user or event changes
  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!user || !event.id) {
        setIsBooked(false);
        return;
      }
      
      try {
        const isAlreadyBooked = await checkUserBooking(user.uid, event.id);
        setIsBooked(isAlreadyBooked);
        
        if (isAlreadyBooked) {
          setBookingSuccess(true);
        }
      } catch (error) {
        console.error("Error checking booking status:", error);
      }
    };
    
    checkBookingStatus();
  }, [user, event.id]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create or update user profile in database
      await createUserProfile(result.user);
    } catch (error) {
      console.error("Google sign-in error:", error);
      // Handle authentication cancellation
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setAuthError("Authentication was cancelled. Please try again.");
      } else {
        setAuthError("Error signing in with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookEvent = async () => {
    if (!user) {
      // If no user is logged in, trigger Google sign-in
      await signInWithGoogle();
      return;
    }
    
    if (isBooked) {
      setAuthError("You've already booked this event!");
      return;
    }
    
    // Show the booking form
    setShowBookingForm(true);
    setAuthError(null);
  };
  
  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const userData = {
        userId: user.uid,
        email: formData.email,
        phone: formData.phone,
        displayName: user.displayName || null
      };
      
      const result = await bookEventSimple(event.id, userData);
      
      if (result && result.success) {
        setIsBooked(true);
        setBookingSuccess(true);
        setShowBookingForm(false);
      } else {
        throw new Error("Unknown error during booking");
      }
    } catch (error) {
      console.error("Error booking event:", error);
      
      if (error.message.includes("No spots left")) {
        setAuthError("No spots left for this event.");
      } else if (error.message.includes("already booked")) {
        setIsBooked(true);
        setBookingSuccess(true);
        setShowBookingForm(false);
      } else {
        setAuthError("An error occurred during booking. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelForm = () => {
    setShowBookingForm(false);
    setAuthError(null);
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Success state
  if (bookingSuccess && !showBookingForm) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/4">
            <img 
              src={event.image} 
              alt={event.title}
              className="h-40 w-full object-cover md:h-full"
            />
          </div>
          <div className="p-4 md:w-3/4">
            <h3 className="text-xl font-bold mb-2">{event.title}</h3>
            
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700">
                📅 {event.date}
              </span>
              <span className="inline-block bg-blue-200 rounded-full px-2 py-1 text-xs font-semibold text-blue-700">
                {event.type}
              </span>
            </div>
            
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-3">
              <p className="font-bold">✓ Booking confirmed!</p>
              <p className="text-sm">We look forward to seeing you there!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
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
        />
      </div>
    );
  }
  
  // Default state with accordion
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300">
      <div className="cursor-pointer" onClick={toggleExpand}>
        <div className="md:flex">
          <div className="md:w-1/4">
            <img 
              src={event.image} 
              alt={event.title}
              className="h-40 w-full object-cover md:h-32"
            />
          </div>
          <div className="p-4 md:w-3/4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold">{event.title}</h3>
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
            
            <div className="flex gap-2 mb-2">
              <span className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700">
                📅 {event.date}
              </span>
              <span className="inline-block bg-blue-200 rounded-full px-2 py-1 text-xs font-semibold text-blue-700">
                {event.type}
              </span>
            </div>
            
            <p className="text-sm text-gray-600">
              {event.spotsLeft} spots left out of {event.spots}
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
        </div>
        
        <p className="text-gray-700 mb-4 text-sm">{event.description}</p>
        
        {authError && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {authError}
          </div>
        )}
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleBookEvent();
          }}
          disabled={isBooked || loading}
          className={`w-full px-4 py-2 rounded font-bold text-white ${
            isBooked 
              ? 'bg-green-500 cursor-not-allowed' 
              : loading 
                ? 'bg-gray-400 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isBooked 
            ? '✓ Booked' 
            : loading 
              ? 'Processing...' 
              : user ? 'Book Now (Free)' : 'Partecipa'}
        </button>
      </div>
    </div>
  );
}

export default EventCard;
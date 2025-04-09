import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

function EventCard({ event, user }) {
  const [isBooked, setIsBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!user) {
        setIsBooked(false);
        return;
      }
      
      try {
        console.log("Checking booking status for user:", user.uid);
        const eventRef = doc(db, 'events', 'current-event');
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          console.log("Event data:", eventData);
          setIsBooked(eventData.attendees && eventData.attendees.includes(user.uid));
        } else {
          console.error("Event document does not exist!");
        }
      } catch (error) {
        console.error("Error checking booking status:", error);
      }
    };
    
    checkBookingStatus();
  }, [user]);
  
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // After successful login, the auth state will change and trigger the useEffect
    } catch (error) {
      console.error("Google sign-in error:", error);
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookEvent = async () => {
    console.log("Book button clicked, user:", user);
    
    if (!user) {
      console.log("No user, initiating Google sign-in");
      await signInWithGoogle();
      return;
    }
    
    if (isBooked) {
      console.log("Event already booked");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Attempting to book event");
      const eventRef = doc(db, 'events', 'current-event');
      
      // First check if the document exists
      const eventDoc = await getDoc(eventRef);
      if (!eventDoc.exists()) {
        console.error("Event document doesn't exist!");
        setLoading(false);
        return;
      }
      
      const eventData = eventDoc.data();
      console.log("Current event data:", eventData);
      
      await updateDoc(eventRef, {
        attendees: arrayUnion(user.uid),
        spotsLeft: (eventData.spotsLeft || 0) - 1
      });
      
      console.log("Event booked successfully");
      setIsBooked(true);
    } catch (error) {
      console.error("Error booking event:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="md:flex">
        <div className="md:w-1/3">
          <img 
            src={event.image} 
            alt={event.title}
            className="h-64 w-full object-cover md:h-full"
          />
        </div>
        <div className="p-6 md:w-2/3">
          <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
          
          <div className="mb-4 flex flex-wrap gap-3">
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
              📅 {event.date}
            </span>
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
              🕒 {event.time}
            </span>
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
              📍 {event.location}
            </span>
          </div>
          
          <p className="text-gray-700 mb-4">{event.description}</p>
          
          <div className="mb-4 text-sm">
            <p className="font-semibold">
              {event.spotsLeft} spots left out of {event.spots}
            </p>
          </div>
          
          {authError && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {authError}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={handleBookEvent}
              disabled={isBooked || loading}
              className={`px-4 py-2 rounded font-bold text-white ${
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
                  : user ? 'Book Now (Free)' : 'Sign in & Book (Free)'}
            </button>
            
            {!user && (
              <button 
                onClick={signInWithGoogle}
                disabled={loading}
                className="px-4 py-2 rounded font-bold text-white bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    fill="#ffffff"
                    d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1272727,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
                  />
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
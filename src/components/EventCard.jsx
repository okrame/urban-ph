import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, arrayUnion } from '../firebase/firestore';

function EventCard({ event, user, openAuthModal }) {
  const [isBooked, setIsBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!user) {
        setIsBooked(false);
        return;
      }
      
      try {
        const eventRef = doc(db, 'events', 'current-event');
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          setIsBooked(eventData.attendees && eventData.attendees.includes(user.uid));
        }
      } catch (error) {
        console.error("Error checking booking status:", error);
      }
    };
    
    checkBookingStatus();
  }, [user]);
  
  const handleBookEvent = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    
    if (isBooked) return;
    
    setLoading(true);
    try {
      const eventRef = doc(db, 'events', 'current-event');
      await updateDoc(eventRef, {
        attendees: arrayUnion(user.uid),
        spotsLeft: event.spotsLeft - 1
      });
      
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
                : 'Book Now (Free)'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
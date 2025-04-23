import { useState, useEffect } from 'react';
import { getActiveEvents, getActiveEventsByType } from '../../firebase/firestoreServices';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';
import EventCard from '../components/EventCard';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'hunt', 'workshop', 'exhibition'
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Add a listener for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    // Cleanup the listener when component unmounts
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let eventsList;
        if (filter === 'all') {
          eventsList = await getActiveEvents();
        } else {
          eventsList = await getActiveEventsByType(filter);
        }
        setEvents(eventsList);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [filter]);

  // Function to handle authentication needs
  const handleAuthNeeded = (event) => {
    setSelectedEvent(event);
    setShowAuthModal(true);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar 
        user={user} 
        onSignInClick={() => setShowAuthModal(true)}
      />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        event={selectedEvent}
      />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Upcoming Events</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            All Events
          </button>
          <button 
            onClick={() => setFilter('hunt')}
            className={`px-4 py-2 rounded-full ${
              filter === 'hunt' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Photo Hunts
          </button>
          <button 
            onClick={() => setFilter('workshop')}
            className={`px-4 py-2 rounded-full ${
              filter === 'workshop' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Workshops
          </button>
          <button 
            onClick={() => setFilter('exhibition')}
            className={`px-4 py-2 rounded-full ${
              filter === 'exhibition' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Exhibitions
          </button>
        </div>
        
        {/* Events list */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse text-xl">Loading events...</div>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-8 max-w-6xl mx-auto">
            {events.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                user={user}
                onAuthNeeded={() => handleAuthNeeded(event)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-lg shadow max-w-md mx-auto">
            <p className="text-gray-600">
              No {filter !== 'all' ? filter : ''} events available at the moment.
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View all events
              </button>
            )}
          </div>
        )}
      </div>
      
      <footer className="bg-gray-800 text-white text-center py-6 mt-12">
        <p>© {new Date().getFullYear()} Urban Photo Hunts. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default EventsPage;
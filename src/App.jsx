import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EventCard from './components/EventCard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, setupFirebase } from '../firebase/config';
import { getActiveEvents } from '../firebase/firestoreServices';
import { createUserProfile } from '../firebase/userServices';
import AuthModal from './components/AuthModal';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);


  useEffect(() => {
    console.log("App component mounted");
    
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    if (isGitHubPages) {
      console.log("Running on GitHub Pages");
    }
    
    // Initialize Firebase data (only run once)
    setupFirebase().catch(err => {
      console.error("Failed to initialize database:", err);
    });
    
    // Load events
    const loadEvents = async () => {
      try {
        const eventsData = await getActiveEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser ? "User logged in" : "No user");
      
      if (currentUser) {
        // Create/update user profile when user logs in
        try {
          await createUserProfile(currentUser);
        } catch (error) {
          console.error("Error creating user profile:", error);
        }
      }
      
      setUser(currentUser);
      setLoading(false);
    });

    loadEvents();
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl">Loading Urban Photo Hunts...</p>
        </div>
      </div>
    );
  }

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
      
      <main>
        <Hero />
        
        <section id="current-events-section" className="py-16 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Current Events</h2>
          
          {events.length > 0 ? (
            <div className="space-y-8">
              {events.slice(0, 3).map(event => (
                <EventCard 
                  key={event.id}
                  event={event} 
                  user={user}
                  onAuthNeeded={() => {
                    setSelectedEvent(event);
                    setShowAuthModal(true);
                  }}
                />
              ))}
              
              {events.length > 3 && (
                <div className="text-center mt-8">
                  <Link 
                    to="/events" 
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    View all {events.length} events
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow">
              <p className="text-gray-600">No events available at the moment. Check back soon!</p>
            </div>
          )}
        </section>
      </main>
      
      <footer className="bg-gray-800 text-white text-center py-6">
        <p>© {new Date().getFullYear()} Urban Photo Hunts. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
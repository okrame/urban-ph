import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EventCard from './components/EventCard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { initializeDatabase } from '../firebase/initDB';
import { getActiveEvents } from '../firebase/firestoreServices';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    console.log("App component mounted");
    
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    if (isGitHubPages) {
      console.log("Running on GitHub Pages");
    }
    
    // Initialize Firebase data (only run once)
    initializeDatabase().catch(err => {
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser ? "User logged in" : "No user");
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
          <p className="text-xl">Loading Urban Photo Hunts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      
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
                />
              ))}
              
              {events.length > 3 && (
                <div className="text-center mt-8">
                  <Link to="/events" className="text-blue-600 hover:text-blue-800 font-semibold">
                    View all {events.length} events →
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
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from './components/Hero';
import Info from './components/Info';
import EventCard from './components/EventCard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, setupFirebase } from '../firebase/config';
import { getActiveEvents } from '../firebase/firestoreServices';
import { createUserProfile } from '../firebase/userServices';
import { bookEventSimple } from '../firebase/firestoreServices';
import AuthModal from './components/AuthModal';
import { EventCardPositionProvider } from './contexts/EventCardPositionContext';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [paymentNotification, setPaymentNotification] = useState(null);

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
    
    // Handle PayPal redirect
    const handlePayPalRedirect = async () => {
      // Parse the URL parameters from hash 
      // Since we're using hash router, we need to check the hash part
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const urlParams = new URLSearchParams(hashParts[1]);
        
        // Check for payment status
        const paymentSuccess = urlParams.get('payment-success');
        const paymentCancelled = urlParams.get('payment-cancelled');
        const orderId = urlParams.get('order_id');
        
        // Successful payment
        if (paymentSuccess === 'true') {
          console.log("Payment success detected in URL");
          
          // Get the stored booking data
          const pendingBookingJSON = localStorage.getItem('pendingBooking');
          if (pendingBookingJSON) {
            const pendingBooking = JSON.parse(pendingBookingJSON);
            
            // Check if orderId matches (for security)
            if (orderId && pendingBooking.orderId !== orderId) {
              console.warn("Order ID mismatch, possible tampering attempt");
              setPaymentNotification({
                type: 'error',
                message: 'Payment verification failed. Please contact support.'
              });
              return;
            }
            
            // Ensure we have a user logged in
            if (user) {
              setLoading(true);
              
              try {
                // Create the payment details object
                const paymentDetails = {
                  // IMPORTANT: Explicitly set status to COMPLETED
                  status: 'COMPLETED', 
                  paymentId: urlParams.get('tx') || orderId || 'DIRECT_PAYMENT',
                  payerID: urlParams.get('st') || 'UNKNOWN',
                  payerEmail: pendingBooking.userData.email || '',
                  amount: pendingBooking.amount,
                  currency: 'EUR',
                  createTime: new Date().toISOString(),
                  updateTime: new Date().toISOString(),
                  orderId: orderId
                };
                
                // Process the booking payment
                const { processBookingPayment } = await import('../firebase/paypalServices');
                if (typeof processBookingPayment === 'function') {
                  await processBookingPayment(pendingBooking, paymentDetails);
                  
                  // Show success message
                  setPaymentNotification({
                    type: 'success',
                    message: 'Payment received! Your booking is confirmed.'
                  });
                } else {
                  // Fallback to direct booking with completed status
                  const { bookEventSimple } = await import('../firebase/firestoreServices');
                  await bookEventSimple(pendingBooking.eventId, {
                    ...pendingBooking.userData,
                    paymentDetails: {
                      ...paymentDetails,
                      status: 'COMPLETED' // Ensure status is COMPLETED
                    }
                  });
                  
                  // Show success message
                  setPaymentNotification({
                    type: 'success',
                    message: 'Payment received! Your booking is confirmed.'
                  });
                }
                
                // Clean up
                localStorage.removeItem('pendingBooking');
                
                // Reload events to show updated booking status
                loadEvents();
              } catch (error) {
                console.error("Error completing booking after payment:", error);
                setPaymentNotification({
                  type: 'warning',
                  message: 'Payment received but booking confirmation is pending. We will email you once confirmed.'
                });
              } finally {
                setLoading(false);
              }
            } else {
              // User not logged in - store notification to show after login
              setPaymentNotification({
                type: 'warning',
                message: 'Please log in to complete your booking.'
              });
            }
          } else {
            console.warn("No pending booking found in localStorage");
            setPaymentNotification({
              type: 'warning',
              message: 'Payment received but booking details are missing. Please contact support.'
            });
          }
        } 
        // Cancelled payment
        else if (paymentCancelled === 'true') {
          console.log("Payment cancellation detected in URL");
          // Handle cancelled payment
          setPaymentNotification({
            type: 'info',
            message: 'Payment was cancelled.'
          });
          
          localStorage.removeItem('pendingBooking');
        }
        
        // Remove query parameters from URL
        const baseHash = window.location.hash.split('?')[0];
        window.history.replaceState({}, document.title, window.location.pathname + baseHash);
      }
    };
    
    // Handle scroll to events if needed
    const checkScrollToEvents = () => {
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const urlParams = new URLSearchParams(hashParts[1]);
        if (urlParams.get('scrollToEvents') === 'true') {
          // Delay the scroll slightly to ensure the page is fully rendered
          setTimeout(() => {
            const eventsSection = document.getElementById('current-events-section');
            if (eventsSection) {
              eventsSection.scrollIntoView({ behavior: 'smooth' });
            }
          }, 400);
        }
      }
    };
    
    // Only run these when the user is set (logged in or not)
    if (!loading) {
      handlePayPalRedirect();
      checkScrollToEvents();
    }
    
    return () => unsubscribe();
  }, [user, loading]); // Depend on user and loading to run after auth is determined

  // Auto-hide payment notification after 5 seconds
  useEffect(() => {
    if (paymentNotification) {
      const timer = setTimeout(() => {
        setPaymentNotification(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [paymentNotification]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center #A1B4A4">
      <div className="text-center">
  <svg
    className="animate-spin h-10 w-10 mx-auto mb-4"
    style={{ color: '#FFFADE' }}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
    className="opacity-25"
    cx="12"
    cy="12"
    r="10"
    stroke="currentColor"
    strokeWidth="4"
    ></circle>
    <path
    className="opacity-75"
    fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
        <p className="text-xl" style={{ color: '#FFFADE' }}>...</p>
      </div>
      </div>
    );
  }

  return (
    // WRAP EVERYTHING WITH THE PROVIDER:
    <EventCardPositionProvider>
      <div className="min-h-screen bg-gray-100">
        {/* Hero section with integrated navigation */}
        <Hero 
          user={user} 
          onSignInClick={() => setShowAuthModal(true)}
        />
        
        {/* Info section with animated squares */}
        <Info />
        
        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          event={selectedEvent}
        />
        
        {/* Payment notification */}
        {paymentNotification && (
          <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-md shadow-md ${
            paymentNotification.type === 'success' ? 'bg-green-100 text-green-800' :
            paymentNotification.type === 'error' ? 'bg-red-100 text-red-800' :
            paymentNotification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <div className="flex items-center">
              {paymentNotification.type === 'success' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {paymentNotification.type === 'error' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {paymentNotification.type === 'warning' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {paymentNotification.type === 'info' && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span>{paymentNotification.message}</span>
              <button 
                className="ml-4 text-gray-500 hover:text-gray-700" 
                onClick={() => setPaymentNotification(null)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <main>
        <section id="current-events-section" className="pb-16 max-w-6xl mx-auto">
            {/* <h2 className="text-3xl font-bold text-center mb-12">.Events</h2> */}
            
            {events.length > 0 ? (
              <div className="space-y-0">
                {events.slice(0, 3).map((event, index) => (
                  <EventCard 
                    key={event.id}
                    event={event} 
                    user={user}
                    onAuthNeeded={() => {
                      setSelectedEvent(event);
                      setShowAuthModal(true);
                    }}
                    index={index}
                    // No onPositionUpdate prop needed - uses context
                  />
                ))}
                
                {events.length > 3 && (
                  <div className="text-center mt-8 pt-8">
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
    </EventCardPositionProvider>
  );
}

export default App;
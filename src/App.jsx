import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from './components/Hero';
import Info from './components/Info';
import AboutUs from './components/AboutUs';
import EventCard from './components/EventCard';
import ContactForm from "./components/ContactForm";
import { onAuthStateChanged } from 'firebase/auth';
import { auth, setupFirebase } from '../firebase/config';
import { getActiveEvents, getEventById, getPastEvents } from '../firebase/firestoreServices';
import { createUserProfile } from '../firebase/userServices';
import { bookEventSimple } from '../firebase/firestoreServices';
import AuthModal from './components/AuthModal';
import { EventCardPositionProvider, useEventCardPosition } from './contexts/EventCardPositionContext';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [paymentNotification, setPaymentNotification] = useState(null);
  const [authModalCloseCounter, setAuthModalCloseCounter] = useState(0);
  const [verticalLinePosition, setVerticalLinePosition] = useState(30);
  const [specificEvent, setSpecificEvent] = useState(null);
  const [showingPastEvents, setShowingPastEvents] = useState(false);
  const [pastEventsLoading, setPastEventsLoading] = useState(false);



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
        let eventsData;
        if (showingPastEvents) {
          setPastEventsLoading(true);
          eventsData = await getPastEvents();
        } else {
          eventsData = await getActiveEvents();
        }

        setEvents(eventsData);

        // Se non ci sono eventi attivi, carica l'evento specifico
        if (eventsData.length === 0 && !showingPastEvents) {
          const specificEventData = await getEventById('Xx35S2HvQhoCW3eLzfCM');
          setSpecificEvent(specificEventData);
        } else {
          setSpecificEvent(null);
        }
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        if (showingPastEvents) {
          setPastEventsLoading(false); // Fine loading
        }
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
      //const hashParts = window.location.hash.split('?');
      //if (hashParts.length > 1) {
      //const urlParams = new URLSearchParams(hashParts[1]);

      // Parse from search (BrowserRouter)
      const urlParams = new URLSearchParams(window.location.search);
      if ([...urlParams.keys()].length > 0) {


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
        //const baseHash = window.location.hash.split('?')[0];
        //window.history.replaceState({}, document.title, window.location.pathname + baseHash);
        //window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        //window.history.replaceState(null, '', window.location.pathname);

        // Only strip PayPal-related params, keep others like ?open= & ?name=
        const allParams = new URLSearchParams(window.location.search);
        const ppKeys = ['payment-success', 'payment-cancelled', 'order_id', 'tx', 'st'];
        const hasPayPalParams = ppKeys.some(k => allParams.has(k));
        if (hasPayPalParams) {
          ppKeys.forEach(k => allParams.delete(k));
          const search = allParams.toString();
          const nextUrl = window.location.pathname + (search ? `?${search}` : '') + window.location.hash;
          window.history.replaceState(null, '', nextUrl);
        }

      }
    };

    // Handle scroll to events if needed
    const checkScrollToEvents = () => {

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('scrollToEvents') === 'true') {
        setTimeout(() => {
          const eventsSection = document.getElementById('current-events-section');
          if (eventsSection) {
            eventsSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 400);
      }
      if (urlParams.get('scrollToAbout') === 'true') {
        setTimeout(() => {
          const aboutSection = document.querySelector('[data-section="about-us"]');
          if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 400);

      }
    };

    // Only run these when the user is set (logged in or not)
    if (!loading) {
      handlePayPalRedirect();
      checkScrollToEvents();
    }

    return () => unsubscribe();
  }, [user, loading, showingPastEvents]); // Depend on user and loading to run after auth is determined

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
      <div className="flex items-center justify-center" style={{ minHeight: 'var(--stable-viewport-height)', backgroundColor: '#A1B4A4' }}>
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
          <p className="text-xl" style={{ color: '#4A7E74' }}>...</p>
        </div>
      </div>
    );
  }

  return (
    // WRAP EVERYTHING WITH THE PROVIDER:
    <EventCardPositionProvider>
      <div className="bg-white" style={{ minHeight: 'var(--stable-viewport-height)' }}>
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
          onClose={() => {
            setShowAuthModal(false);
            setSelectedEvent(null);
            setAuthModalCloseCounter(prev => prev + 1);
          }}
          event={selectedEvent}
        />

        {/* Payment notification */}
        {paymentNotification && (
          <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-md shadow-md ${paymentNotification.type === 'success' ? 'bg-green-100 text-green-800' :
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

        <EventsSection
          events={events}
          specificEvent={specificEvent}
          user={user}
          setSelectedEvent={setSelectedEvent}
          setShowAuthModal={setShowAuthModal}
          authModalCloseCounter={authModalCloseCounter}
          onVerticalLinePositionChange={setVerticalLinePosition}
          showingPastEvents={showingPastEvents}
          setShowingPastEvents={setShowingPastEvents}
          setPastEventsLoading={setPastEventsLoading}
        />

        {/* about us with animated squares */}
        <AboutUs verticalLinePosition={verticalLinePosition} />

        <ContactForm />

        <footer className="bg-gray-800 text-white text-center py-6">
          <p>© {new Date().getFullYear()} Urban Photo Hunts. All rights reserved.</p>
        </footer>
      </div>
    </EventCardPositionProvider>
  );
}

function EventsSection({ events, specificEvent, user, setSelectedEvent, setShowAuthModal, authModalCloseCounter, onVerticalLinePositionChange, showingPastEvents, setShowingPastEvents, pastEventsLoading }) {
  const { eventCardPosition, isPositionReady } = useEventCardPosition();

  const [showAllEvents, setShowAllEvents] = useState(false);


  const calculateVerticalLinePosition = () => {
    // Se ci sono eventi normali, usa la logica esistente
    if (events.length > 0) {
      const displayedEvents = showAllEvents ? events : events.slice(0, 3);
      const lastEventIndex = displayedEvents.length - 1;
      const isLastEventImageLeft = lastEventIndex % 2 === 0;
      return isLastEventImageLeft ? 30 : 70;
    }

    // Se c'è solo l'evento specifico, considera l'index 0 (immagine a destra)
    if (specificEvent) {
      return 30; // index 0 = immagine a destra, quindi linea a sx (30%)
    }

    // Fallback se non ci sono eventi
    return 30;
  };

  useEffect(() => {
    const newPosition = calculateVerticalLinePosition();
    onVerticalLinePositionChange?.(newPosition);
  }, [events, showAllEvents, onVerticalLinePositionChange]);


  // Custom breakpoint detection - hide extensions earlier than mobile
  const [shouldShowExtensions, setShouldShowExtensions] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const checkSizes = () => {
      setShouldShowExtensions(window.innerWidth >= 1100);
      setIsMobile(window.innerWidth < 768);
    };
    checkSizes();
    window.addEventListener('resize', checkSizes);
    return () => window.removeEventListener('resize', checkSizes);
  }, []);



  return (
    <main>
      <section id="current-events-section" className="pb-16">
        <div className="max-w-6xl mx-auto px-4">

          {showingPastEvents && events.length > 0 && (
            <div className="mb-6 flex justify-start">
              <button
                onClick={() => setShowingPastEvents(false)}
                className="inline-flex items-center text-black hover:text-green-800 font-medium transition-colors rounded-md px-2 py-1"
              >
                <svg
                  className="mr-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Close past events
              </button>
            </div>
          )}

          {events.length > 0 ? (
            <div className="space-y-0 relative">
              {/* CAMBIA QUESTA LINEA: */}
              {(showAllEvents ? events : events.slice(0, 3)).map((event, index, array) => (
                <div key={event.id} className="relative">
                  <EventCard
                    event={event}
                    user={user}
                    onAuthNeeded={() => {
                      setSelectedEvent(event);
                      setShowAuthModal(true);
                    }}
                    index={index}
                    isLastEvent={index === array.length - 1}
                    authModalCloseCounter={authModalCloseCounter}
                  />

                  {/* Estensioni per l'ultima card - SOLO SU DESKTOP CON BREAKPOINT PERSONALIZZATO */}
                  {index === array.length - 1 &&
                    isPositionReady &&
                    eventCardPosition.width > 0 && (
                      <>
                        {/* Estensioni orizzontali SOLO se shouldShowExtensions è true */}
                        {shouldShowExtensions && (
                          <>
                            {/* Per card con immagine a sinistra (index dispari) - linea verso sinistra */}
                            {index % 2 === 1 && (
                              <div
                                className="absolute bottom-0 left-0 h-0.5 bg-black z-10"
                                style={{
                                  width: `${eventCardPosition.width * 0.50}px`,
                                  transform: 'translateX(-100%)'
                                }}
                              ></div>
                            )}

                            {/* Per card con immagine a destra (index pari) - linea verso destra */}
                            {index % 2 === 0 && (
                              <div
                                className="absolute bottom-0 right-0 h-0.5 bg-black z-10"
                                style={{
                                  width: `${eventCardPosition.width * 0.50}px`,
                                  transform: 'translateX(100%)'
                                }}
                              ></div>
                            )}
                          </>
                        )}

                        {/* Vertical line from separation point - SOLO se non mobile */}
                        {!isMobile && (
                          <>
                            <div
                              className="absolute bg-black z-10"
                              style={{
                                width: '2px',
                                height: '400px', // Adjust this value as needed
                                left: index % 2 === 0
                                  ? `${eventCardPosition.width * 0.30}px`
                                  : `${eventCardPosition.width * 0.70}px`,
                                top: '150%',
                                marginTop: '0px'
                              }}
                            ></div>
                            <svg
                              className="absolute z-50"
                              style={{
                                left: index % 2 === 0
                                  ? `${eventCardPosition.width * 0.30}px`
                                  : `${eventCardPosition.width * 0.70}px`,
                                top: 'calc(100% + 16px)',
                                pointerEvents: 'none',
                              }}
                              width="2"
                              height="400"
                            >
                            </svg>
                          </>
                        )}
                      </>
                    )}
                </div>
              ))}

              {events.length > 3 && (
                <div
                  className={`mt-8 pt-8 flex 
      ${
                    // calcola il lato: sx se ultimo evento pari, dx se dispari
                    ((showAllEvents ? events : events.slice(0, 3)).length - 1) % 2 === 0
                      ? 'justify-start' // ultimo evento pari → sx
                      : 'justify-end'   // ultimo evento dispari → dx
                    }`}
                >
                  <button
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    className="inline-flex items-center text-black hover:text-green-800 font-medium transition-colors rounded-md px-2 py-1"
                  >
                    {showAllEvents ? (
                      <>
                        Show fewer events
                        <svg
                          className="ml-2 w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 15l7-7 7 7"
                          />
                        </svg>

                      </>
                    ) : (
                      <>
                        View all {events.length} events
                        <svg
                          className="ml-2 w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>

                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : specificEvent ? (
            <div className="space-y-8">
              <div className="relative">
                <EventCard
                  key={specificEvent.id}
                  event={specificEvent}
                  user={user}
                  onAuthNeeded={() => {
                    setSelectedEvent(specificEvent);
                    setShowAuthModal(true);
                  }}
                  index={0}
                  isLastEvent={true}
                  authModalCloseCounter={authModalCloseCounter}
                />

                {/* Vertical line per evento specifico - SOLO se non mobile */}
                {!isMobile && isPositionReady && eventCardPosition.width > 0 && (
                  <>
                    {/* Estensioni orizzontali SOLO se shouldShowExtensions è true */}
                    {shouldShowExtensions && (
                      <div
                        className="absolute bottom-0 right-0 h-0.5 bg-black z-10"
                        style={{
                          width: `${eventCardPosition.width * 0.50}px`,
                          transform: 'translateX(100%)'
                        }}
                      ></div>
                    )}

                    {/* Vertical line dall'evento specifico */}
                    <div
                      className="absolute bg-black z-10"
                      style={{
                        width: '2px',
                        height: '350px',
                        left: `${eventCardPosition.width * 0.30}px`, // index 0 = immagine a destra
                        top: '150%',
                        marginTop: '5px'
                      }}
                    ></div>
                  </>
                )}
              </div>

              <div className="pt-2 flex justify-start">
                <button
                  onClick={() => setShowingPastEvents(true)}
                  disabled={pastEventsLoading}
                  className={`inline-flex items-center font-medium transition-colors rounded-md px-2 py-1 ${pastEventsLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-black hover:text-green-800'
                    }`}
                >
                  {pastEventsLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading past events...
                    </>
                  ) : (
                    <>
                      View all past events
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow">
              <p className="text-gray-600">Loading...</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
import { useState, useEffect } from 'react';
import {
  getEventsStats,
  getEventBookings,
  determineEventStatus,
  getEventBookingsCount
} from '../../firebase/firestoreServices';
import {
  createNewEvent,
  deleteEvent
} from '../../firebase/adminServices';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, collection, query, where, getDocs, updateDoc, serverTimestamp, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import Navbar from '../components/Navbar';
import EventForm from '../components/EventForm';
import UsersDatabase from '../components/UsersDatabase';
import PaymentsView from '../components/PaymentsView';

function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [syncingStatuses, setSyncingStatuses] = useState(false); // New state for sync loading
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'create' or 'db' or 'payments'
  const [eventsTab, setEventsTab] = useState('active'); // 'active', 'upcoming', or 'past'
  // Track attendance locally (not persisted to Firebase)
  const [attendance, setAttendance] = useState({});
  // Track expanded request text fields
  const [expandedRequests, setExpandedRequests] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const isUserAdmin = userDoc.exists() && userDoc.data().role === 'admin';
        console.log("AdminPanel - isUserAdmin:", isUserAdmin);
        setIsAdmin(isUserAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;

      setLoading(true);
      try {
        // Load statistics
        const statsData = await getEventsStats();
        setStats(statsData);

        // Load all event types
        await fetchAllEventTypes();
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // Auto-sync all event statuses when needed
  const syncAllEventStatuses = async () => {
    setSyncingStatuses(true);
    try {
      // Get all events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const updatePromises = [];

      eventsSnapshot.forEach(eventDoc => {
        const eventData = eventDoc.data();
        const actualStatus = determineEventStatus(eventData.date, eventData.time);
        
        // Only update if status has changed
        if (actualStatus !== eventData.status) {
          const updatePromise = updateDoc(eventDoc.ref, {
            status: actualStatus,
            updatedAt: serverTimestamp()
          });
          updatePromises.push(updatePromise);
          
          console.log(`Syncing event ${eventDoc.id}: ${eventData.status} → ${actualStatus}`);
        }
      });

      // Wait for all updates to complete
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Synced ${updatePromises.length} event statuses`);
      } else {
        console.log('All event statuses are already up to date');
      }

      // Refresh event lists after sync
      await fetchAllEventTypes();
      
    } catch (error) {
      console.error('Error syncing event statuses:', error);
    } finally {
      setSyncingStatuses(false);
    }
  };

  // Fetch all event types and categorize by actual status
  const fetchAllEventTypes = async () => {
    try {
      // Fetch all events
      const eventsSnapshot = await getDocs(collection(db, 'events'));

      const active = [];
      const upcoming = [];
      const past = [];

      // Process each event and categorize by actual status
      eventsSnapshot.forEach(doc => {
        const eventData = doc.data();
        const event = { id: doc.id, ...eventData };

        // Calculate actual status based on date/time
        const actualStatus = determineEventStatus(eventData.date, eventData.time);
        event.actualStatus = actualStatus;

        // Add to appropriate array based on actual status
        if (actualStatus === 'active') {
          active.push(event);
        } else if (actualStatus === 'upcoming') {
          upcoming.push(event);
        } else if (actualStatus === 'past') {
          past.push(event);
        }
      });

      // Sort events by date
      const sortByDate = (a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      };

      setActiveEvents(active.sort(sortByDate));
      setUpcomingEvents(upcoming.sort(sortByDate));
      setPastEvents(past.sort(sortByDate));

      // If there's a selected event, refresh its data to ensure UI consistency
      if (selectedEvent) {
        const updatedEvent = [...active, ...upcoming, ...past].find(e => e.id === selectedEvent.id);
        if (updatedEvent) {
          setSelectedEvent(updatedEvent);
        }
      }
    } catch (error) {
      console.error('Error fetching events by type:', error);
    }
  };

  // Enhanced tab switching with auto-sync
  const handleEventsTabChange = async (newTab) => {
    setEventsTab(newTab);
    setSelectedEvent(null);
    setBookings([]);

    // Auto-sync statuses when switching tabs
    await syncAllEventStatuses();
  };

  // Load bookings for a specific event
  const handleEventSelect = async (eventId) => {
    setLoading(true);
    try {
      let event;
      // Find the event in the appropriate array based on the current tab
      if (eventsTab === 'active') {
        event = activeEvents.find(e => e.id === eventId);
      } else if (eventsTab === 'upcoming') {
        event = upcomingEvents.find(e => e.id === eventId);
      } else {
        event = pastEvents.find(e => e.id === eventId);
      }

      // If event not found in current tab, check all tabs
      // This helps when an event changes category and we need to re-select it
      if (!event) {
        event = [...activeEvents, ...upcomingEvents, ...pastEvents].find(e => e.id === eventId);

        // If found in a different tab, switch to that tab
        if (event) {
          if (activeEvents.some(e => e.id === eventId)) {
            setEventsTab('active');
          } else if (upcomingEvents.some(e => e.id === eventId)) {
            setEventsTab('upcoming');
          } else if (pastEvents.some(e => e.id === eventId)) {
            setEventsTab('past');
          }
        }
      }

      if (event) {
        setSelectedEvent(event);

        // Get bookings with full user details
        const bookingsData = await getEventBookings(eventId);

        // Enrich bookings with user profile data to get real name
        const enrichedBookings = await Promise.all(bookingsData.map(async (booking) => {
          const userRef = doc(db, 'users', booking.userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.exists() ? userDoc.data() : {};

          // Get the real name from user profile (collected during first booking)
          const userFullName = userData.name && userData.surname
            ? `${userData.name} ${userData.surname}`
            : null;

          return {
            ...booking,
            userFullName,
            // Add the specificRequest field from booking data
            specificRequest: booking.specificRequest || ''
          };
        }));

        setBookings(enrichedBookings);
      } else {
        console.error('Event not found in any category');
        setSelectedEvent(null);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching event bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete an event
  const handleDeleteEvent = async (eventId, e) => {
    e.stopPropagation(); // Prevent event propagation to parent

    if (!confirm('Are you sure you want to delete this event? This will also remove all bookings.')) {
      return;
    }

    try {
      await deleteEvent(eventId);
      // Refresh all event lists
      await fetchAllEventTypes();

      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(null);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Error deleting event: ${error.message}`);
    }
  };

  // Delete a booking (attendee)
  const handleDeleteBooking = async (booking, e) => {
    e.preventDefault();
    
    if (!confirm(`Are you sure you want to remove ${booking.userFullName || booking.email} from this event?`)) {
      return;
    }
    
    if (!selectedEvent || !booking.userId) {
      alert('Missing event or user information');
      return;
    }
    
    setDeleteLoading(booking.id);
    
    try {
      // 1. Remove user from event's attendees array
      const eventRef = doc(db, 'events', selectedEvent.id);
      await updateDoc(eventRef, {
        attendees: arrayRemove(booking.userId),
        // Increase available spots by 1
        spotsLeft: (selectedEvent.spotsLeft || 0) + 1
      });
      
      // 2. Update user's eventsBooked array to remove this event
      const userRef = doc(db, 'users', booking.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          eventsBooked: arrayRemove(selectedEvent.id)
        });
      }
      
      // 3. Set booking status to 'cancelled'
      // We don't actually delete the booking record for audit purposes
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      
      // 4. Remove from local attendance tracking
      if (attendance[booking.id]) {
        const newAttendance = {...attendance};
        delete newAttendance[booking.id];
        setAttendance(newAttendance);
      }
      
      // 5. Update UI
      // Remove booking from the list
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      
      // 6. Refresh event data
      await fetchAllEventTypes();
      if (selectedEvent) {
        // Re-fetch specific event data
        const eventRef = doc(db, 'events', selectedEvent.id);
        const eventDoc = await getDoc(eventRef);
        if (eventDoc.exists()) {
          const updatedEventData = eventDoc.data();
          setSelectedEvent({
            id: selectedEvent.id,
            ...updatedEventData,
            actualStatus: determineEventStatus(updatedEventData.date, updatedEventData.time)
          });
        }
        
        // Re-fetch bookings to sync bookings list with DB
        await handleEventSelect(selectedEvent.id); 
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert(`Error removing attendee: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle attendance check
  const handleAttendanceCheck = (bookingId, checked) => {
    setAttendance(prev => ({
      ...prev,
      [bookingId]: checked
    }));
  };

  // Toggle expanded request text
  const toggleRequestExpand = (bookingId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  // Render request text with show more functionality
  const renderRequestText = (bookingId, text) => {
    if (!text) return 'None';
    
    const isExpanded = expandedRequests[bookingId];
    const isLong = text.length > 25;
    
    if (isLong && !isExpanded) {
      return (
        <div>
          {text.substring(0, 25)}...
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleRequestExpand(bookingId);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 ml-1 underline"
          >
            Show more
          </button>
        </div>
      );
    } else if (isLong && isExpanded) {
      return (
        <div>
          {text}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleRequestExpand(bookingId);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 ml-1 underline"
          >
            Show less
          </button>
        </div>
      );
    }
    
    return text;
  };

  // Edit an event
  const handleEditEvent = (event, e) => {
    e.stopPropagation(); // Prevent event propagation to parent
    setEditingEvent(event);
    setActiveTab('create');
  };

  // Handle successful form submission
  const handleFormSuccess = async () => {
    try {
      // Refresh all event lists
      await fetchAllEventTypes();

      // If we were editing an event that was selected, reload that event's data
      if (editingEvent && selectedEvent && editingEvent.id === selectedEvent.id) {
        await handleEventSelect(editingEvent.id);
      }

      // Reset form state
      setShowForm(false);
      setEditingEvent(null);
      setActiveTab('events');
    } catch (error) {
      console.error('Error in form success handler:', error);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
    setActiveTab('events');
  };

  // Get current events based on selected tab
  const getCurrentEvents = () => {
    switch (eventsTab) {
      case 'active':
        return activeEvents;
      case 'upcoming':
        return upcomingEvents;
      case 'past':
        return pastEvents;
      default:
        return activeEvents;
    }
  };

  // Determine status label style based on status
  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
          <p className="mb-8">You need to be logged in as an admin to access this page.</p>
          {!user && (
            <p>Please sign in to continue.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Panel</h1>

        {/* Main Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 mr-2 ${activeTab === 'events'
              ? 'border-b-2 border-blue-500 font-bold'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('events')}
          >
            Manage Events
          </button>

          <button
            className={`px-4 py-2 ${activeTab === 'database'
              ? 'border-b-2 border-blue-500 font-bold'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('database')}
          >
            Database
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'payments'
              ? 'border-b-2 border-blue-500 font-bold'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
        </div>

        {activeTab === 'payments' ? (
          <PaymentsView eventId={selectedEvent?.id} />
        ) : activeTab === 'create' ? (
          <EventForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            initialValues={editingEvent || {}}
          />
        ) : activeTab === 'database' ? (
          <UsersDatabase />
        ) : (
          <>
            {/* Event Type Tabs with sync indicator */}
            <div className="flex mb-6 border-b items-center">
              <button
                className={`px-4 py-2 ${eventsTab === 'active'
                  ? 'border-b-2 border-green-500 font-semibold text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => handleEventsTabChange('active')}
                disabled={syncingStatuses}
              >
                Active Events ({activeEvents.length})
              </button>
              <button
                className={`px-4 py-2 ${eventsTab === 'upcoming'
                  ? 'border-b-2 border-blue-500 font-semibold text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => handleEventsTabChange('upcoming')}
                disabled={syncingStatuses}
              >
                Upcoming Events ({upcomingEvents.length})
              </button>
              <button
                className={`px-4 py-2 ${eventsTab === 'past'
                  ? 'border-b-2 border-gray-500 font-semibold text-gray-700'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => handleEventsTabChange('past')}
                disabled={syncingStatuses}
              >
                Past Events ({pastEvents.length})
              </button>

              {/* Sync indicator */}
              {syncingStatuses && (
                <div className="ml-4 flex items-center text-sm text-blue-600">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing statuses...
                </div>
              )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Events list */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                      {eventsTab === 'active' ? 'Active Events' :
                        eventsTab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
                    </h2>
                    <button
                      onClick={() => {
                        setEditingEvent(null);
                        setActiveTab('create');
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      + New Event
                    </button>
                  </div>

                  {loading ? (
                    <p className="text-center py-4">Loading...</p>
                  ) : getCurrentEvents().length > 0 ? (
                    <div className="space-y-4">
                      {getCurrentEvents().map(event => (
                        <div
                          key={event.id}
                          className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${selectedEvent && selectedEvent.id === event.id ? 'bg-blue-50 border-blue-500' : ''
                            }`}
                          onClick={() => handleEventSelect(event.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{event.title}</h3>
                            <div className="space-x-1 flex flex-wrap justify-end">
                              <button
                                onClick={(e) => handleEditEvent(event, e)}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 mb-1"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => handleDeleteEvent(event.id, e)}
                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 mb-1"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{event.date} | {event.type}</p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-sm">Spots: {event.spotsLeft || 0}/{event.spots}</p>
                            {/* Status badge */}
                            <span className={`inline-block text-xs px-2 py-1 rounded-full ${getStatusStyle(event.status)}`}>
                              {event.status}
                            </span>
                          </div>
                          {event.status !== event.actualStatus && (
                            <div className="mt-1 p-1 bg-yellow-50 text-yellow-700 text-xs rounded">
                              Will sync to: {event.actualStatus}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4">
                      No {eventsTab} events found.
                    </p>
                  )}
                </div>
              </div>

              {/* Bookings details for selected event */}
              <div className="lg:w-2/3">
                {selectedEvent ? (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-xl font-bold mb-4">
                      Bookings for {selectedEvent.title}
                    </h2>

                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium">Event Date: <span className="text-gray-700">{selectedEvent.date}</span></p>
                        <p className="text-sm font-medium">Time: <span className="text-gray-700">{selectedEvent.time}</span></p>
                        <p className="text-sm font-medium">Type: <span className="text-gray-700">{selectedEvent.type}</span></p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium">Total Spots: <span className="text-gray-700">{selectedEvent.spots}</span></p>
                        <p className="text-sm font-medium">Available Spots: <span className="text-gray-700">{selectedEvent.spotsLeft || 0}</span></p>
                        <p className="text-sm font-medium">Actual Status: <span className={`font-semibold ${selectedEvent.actualStatus === 'active' ? 'text-green-700' :
                          selectedEvent.actualStatus === 'upcoming' ? 'text-blue-700' : 'text-gray-700'
                          }`}>{selectedEvent.actualStatus}</span></p>
                      </div>
                    </div>

                    {bookings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specific Request</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {bookings.map(booking => (
                              <tr key={booking.id} className={attendance[booking.id] ? "bg-green-50" : ""}>
                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={!!attendance[booking.id]} 
                                    onChange={(e) => handleAttendanceCheck(booking.id, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  {booking.userFullName || booking.displayName || 'N/A'}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">{booking.email}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{booking.phone}</td>
                                <td className="px-4 py-2 max-w-xs overflow-hidden">
                                  <div className="text-sm text-gray-700">
                                    {renderRequestText(booking.id, booking.specificRequest)}
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${booking.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  {booking.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                  <button
                                    onClick={(e) => handleDeleteBooking(booking, e)}
                                    disabled={deleteLoading === booking.id}
                                    className={`text-red-600 hover:text-red-900 focus:outline-none ${deleteLoading === booking.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Remove attendee"
                                  >
                                    {deleteLoading === booking.id ? (
                                      <svg className="animate-spin h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="text-xs text-gray-500 mt-4 bg-blue-50 p-2 rounded">
                          <p>✓ <strong>Attendance tracking:</strong> Checking the attendance box is for your record only and won't be saved to the database.</p>
                          <p>✓ <strong>Remove attendee:</strong> Clicking the trash icon will permanently remove the attendee from this event and free up a spot.</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center py-4">No bookings found for this event.</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600">Select an event to view bookings</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="bg-gray-800 text-white text-center py-6 mt-12">
        <p>© {new Date().getFullYear()} Urban Photo Hunts. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AdminPanel;
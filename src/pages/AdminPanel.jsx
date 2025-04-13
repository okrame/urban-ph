import { useState, useEffect } from 'react';
import { 
  getEventsStats, 
  getActiveEvents,
  getEventBookings 
} from '../../firebase/firestoreServices';
import { 
  createNewEvent, 
  deleteEvent 
} from '../../firebase/adminServices';
import { archiveEvent } from '../../firebase/firestoreServices';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import Navbar from '../components/Navbar';
import EventForm from '../components/EventForm';

function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'create'
  const [eventsTab, setEventsTab] = useState('active'); // 'active', 'upcoming', or 'past'
  
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
  
  // Fetch all event types
  const fetchAllEventTypes = async () => {
    try {
      // Fetch active events
      const activeEventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'active')
      );
      const activeEventsSnapshot = await getDocs(activeEventsQuery);
      const activeEventsData = [];
      activeEventsSnapshot.forEach(doc => {
        activeEventsData.push({ id: doc.id, ...doc.data() });
      });
      setActiveEvents(activeEventsData);
      
      // Fetch upcoming events
      const upcomingEventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'upcoming')
      );
      const upcomingEventsSnapshot = await getDocs(upcomingEventsQuery);
      const upcomingEventsData = [];
      upcomingEventsSnapshot.forEach(doc => {
        upcomingEventsData.push({ id: doc.id, ...doc.data() });
      });
      setUpcomingEvents(upcomingEventsData);
      
      // Fetch past events
      const pastEventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'past')
      );
      const pastEventsSnapshot = await getDocs(pastEventsQuery);
      const pastEventsData = [];
      pastEventsSnapshot.forEach(doc => {
        pastEventsData.push({ id: doc.id, ...doc.data() });
      });
      setPastEvents(pastEventsData);
    } catch (error) {
      console.error('Error fetching events by type:', error);
    }
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
      
      setSelectedEvent(event);
      
      const bookingsData = await getEventBookings(eventId);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching event bookings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Archive an event (set as "past")
  const handleArchiveEvent = async (eventId, e) => {
    e.stopPropagation(); // Prevent event propagation to parent
    
    if (!confirm('Are you sure you want to archive this event?')) {
      return;
    }
    
    try {
      await archiveEvent(eventId);
      // Refresh all event lists
      await fetchAllEventTypes();
      
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(null);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error archiving event:', error);
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
  
  // Edit an event
  const handleEditEvent = (event, e) => {
    e.stopPropagation(); // Prevent event propagation to parent
    setEditingEvent(event);
    setActiveTab('create');
  };
  
  // Handle successful form submission
  const handleFormSuccess = () => {
    // Refresh all event lists
    fetchAllEventTypes();
    
    // Reset form state
    setShowForm(false);
    setEditingEvent(null);
    setActiveTab('events');
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
        
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Active Events</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Past Events</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.past}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Upcoming Events</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.upcoming}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Total Events</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        )}
        
        {/* Main Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 mr-2 ${
              activeTab === 'events' 
                ? 'border-b-2 border-blue-500 font-bold' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('events')}
          >
            Manage Events
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'create' 
                ? 'border-b-2 border-blue-500 font-bold' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setEditingEvent(null);
              setActiveTab('create');
            }}
          >
            Create New Event
          </button>
        </div>
        
        {activeTab === 'create' ? (
          <EventForm 
            onSuccess={handleFormSuccess} 
            onCancel={handleFormCancel}
            initialValues={editingEvent || {}}
          />
        ) : (
          <>
            {/* Event Type Tabs */}
            <div className="flex mb-6 border-b">
              <button
                className={`px-4 py-2 ${
                  eventsTab === 'active' 
                    ? 'border-b-2 border-green-500 font-semibold text-green-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => {
                  setEventsTab('active');
                  setSelectedEvent(null);
                  setBookings([]);
                }}
              >
                Active Events ({activeEvents.length})
              </button>
              <button
                className={`px-4 py-2 ${
                  eventsTab === 'upcoming' 
                    ? 'border-b-2 border-blue-500 font-semibold text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => {
                  setEventsTab('upcoming');
                  setSelectedEvent(null);
                  setBookings([]);
                }}
              >
                Upcoming Events ({upcomingEvents.length})
              </button>
              <button
                className={`px-4 py-2 ${
                  eventsTab === 'past' 
                    ? 'border-b-2 border-gray-500 font-semibold text-gray-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => {
                  setEventsTab('past');
                  setSelectedEvent(null);
                  setBookings([]);
                }}
              >
                Past Events ({pastEvents.length})
              </button>
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
                          className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                            selectedEvent && selectedEvent.id === event.id ? 'bg-blue-50 border-blue-500' : ''
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
                              {eventsTab === 'active' && (
                                <button 
                                  onClick={(e) => handleArchiveEvent(event.id, e)}
                                  className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 mb-1"
                                >
                                  Archive
                                </button>
                              )}
                              <button 
                                onClick={(e) => handleDeleteEvent(event.id, e)}
                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 mb-1"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{event.date} | {event.type}</p>
                          <p className="text-sm">Spots: {event.spotsLeft || 0}/{event.spots}</p>
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
                    
                    {bookings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {bookings.map(booking => (
                              <tr key={booking.id}>
                                <td className="px-4 py-2 whitespace-nowrap">{booking.displayName || 'N/A'}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{booking.email}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{booking.phone}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    booking.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  {booking.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
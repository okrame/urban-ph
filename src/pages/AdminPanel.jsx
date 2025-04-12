import { useState, useEffect } from 'react';
import { 
  getEventsStats, 
  getActiveEvents, 
  getEventBookings, 
  archiveEvent 
} from '../../firebase/firestoreServices';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';
import Navbar from '../components/Navbar';

function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // In a real app, you'd check if the user is an admin
      // For now, we'll just assume they are if they're logged in
      setIsAdmin(!!currentUser);
    });
    
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;
      
      setLoading(true);
      try {
        // Load statistics and active events
        const [statsData, eventsData] = await Promise.all([
          getEventsStats(),
          getActiveEvents()
        ]);
        
        setStats(statsData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAdmin]);
  
  // Load bookings for a specific event
  const handleEventSelect = async (eventId) => {
    setLoading(true);
    try {
      const event = events.find(e => e.id === eventId);
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
      // Update the active events list
      const updatedEvents = events.filter(e => e.id !== eventId);
      setEvents(updatedEvents);
      
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(null);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error archiving event:', error);
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
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Active events list */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-bold mb-4">Active Events</h2>
              
              {loading ? (
                <p className="text-center py-4">Loading...</p>
              ) : events.length > 0 ? (
                <div className="space-y-4">
                  {events.map(event => (
                    <div 
                      key={event.id} 
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedEvent && selectedEvent.id === event.id ? 'bg-blue-50 border-blue-500' : ''
                      }`}
                      onClick={() => handleEventSelect(event.id)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{event.title}</h3>
                        <button 
                          onClick={(e) => handleArchiveEvent(event.id, e)}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                        >
                          Archive
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{event.date} | {event.type}</p>
                      <p className="text-sm">Spots: {event.spotsLeft}/{event.spots}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4">No active events found.</p>
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
      </div>
      
      <footer className="bg-gray-800 text-white text-center py-6 mt-12">
        <p>© {new Date().getFullYear()} Urban Photo Hunts. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AdminPanel;
import { 
    doc, 
    getDoc, 
    updateDoc, 
    collection, 
    serverTimestamp,
    addDoc,
    query, 
    where, 
    getDocs, 
    arrayUnion
  } from 'firebase/firestore';
  import { db } from './config';
  
  // Get all active events (status = "active")
  export const getActiveEvents = async () => {
    try {
      // Using simple query without orderBy to avoid index requirements initially
      const eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(eventsQuery);
      const events = [];
      
      snapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort the events in-memory by date
      events.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });
      
      return events;
    } catch (error) {
      console.error("Error fetching active events:", error);
      return []; // Return empty array instead of throwing
    }
  };
  
  // Get active events filtered by type
  export const getActiveEventsByType = async (type) => {
    try {
      // Using simple query without orderBy to avoid index requirements initially
      const eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'active'),
        where('type', '==', type)
      );
      
      const snapshot = await getDocs(eventsQuery);
      const events = [];
      
      snapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort the events in-memory by date
      events.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });
      
      return events;
    } catch (error) {
      console.error(`Error fetching active events of type ${type}:`, error);
      return []; // Return empty array instead of throwing
    }
  };
  
  // Check if user is already booked for an event
  export const checkUserBooking = async (userId, eventId) => {
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        where('eventId', '==', eventId)
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      return !bookingsSnapshot.empty;
    } catch (error) {
      console.error("Error checking user booking status:", error);
      return false; // Default to not booked if there's an error
    }
  };
  
  // Book event and save user contact information
  export const bookEvent = async (eventId, userData) => {
    try {
      // 1. Get event information
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }
      
      const eventData = eventDoc.data();
      
      // Check if there are spots available
      if (eventData.spotsLeft <= 0) {
        throw new Error("No spots left for this event");
      }
      
      // 2. Create a booking record
      await addDoc(collection(db, 'bookings'), {
        userId: userData.userId,
        eventId: eventId,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        contactInfo: {
          email: userData.email,
          phone: userData.phone,
          displayName: userData.displayName
        }
      });
      
      // 3. Update event spots count
      await updateDoc(eventRef, {
        spotsLeft: eventData.spotsLeft - 1,
        attendees: arrayUnion(userData.userId)
      });
      
      return true;
    } catch (error) {
      console.error("Error booking event:", error);
      throw error;
    }
  };
  
  // Get user contact information if available
  export const getUserContactInfo = async (userId) => {
    try {
      const userQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', userId)
      );
      
      const bookingsSnapshot = await getDocs(userQuery);
      
      if (!bookingsSnapshot.empty) {
        // Return contact info from the most recent booking
        // Sort in-memory since we're avoiding orderBy to prevent index errors
        const bookings = [];
        bookingsSnapshot.forEach(doc => bookings.push(doc.data()));
        
        // Sort by createdAt timestamp if available
        bookings.sort((a, b) => {
          const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
        
        return bookings[0].contactInfo;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user contact info:", error);
      return null;
    }
  };
  
  // Get all attendees for an event
  export const getEventAttendees = async (eventId) => {
    try {
      const attendeesQuery = query(
        collection(db, 'bookings'), 
        where('eventId', '==', eventId)
      );
      
      const attendeesSnapshot = await getDocs(attendeesQuery);
      const attendees = [];
      
      attendeesSnapshot.forEach((doc) => {
        attendees.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return attendees;
    } catch (error) {
      console.error("Error fetching event attendees:", error);
      return []; // Return empty array instead of throwing
    }
  };
  
  // Functions for admin panel
  export const getEventsStats = async () => {
    try {
      // Simple queries to avoid index issues
      const activeQuery = query(collection(db, 'events'), where('status', '==', 'active'));
      const pastQuery = query(collection(db, 'events'), where('status', '==', 'past'));
      const upcomingQuery = query(collection(db, 'events'), where('status', '==', 'upcoming'));
      
      const [activeSnapshot, pastSnapshot, upcomingSnapshot] = await Promise.all([
        getDocs(activeQuery),
        getDocs(pastQuery),
        getDocs(upcomingQuery)
      ]);
      
      return {
        active: activeSnapshot.size,
        past: pastSnapshot.size,
        upcoming: upcomingSnapshot.size,
        total: activeSnapshot.size + pastSnapshot.size + upcomingSnapshot.size
      };
    } catch (error) {
      console.error("Error fetching events stats:", error);
      return {
        active: 0,
        past: 0,
        upcoming: 0,
        total: 0
      };
    }
  };
  
  // Get bookings for a specific event
  export const getEventBookings = async (eventId) => {
    try {
      const bookingsQuery = query(collection(db, 'bookings'), where('eventId', '==', eventId));
      const snapshot = await getDocs(bookingsQuery);
      
      const bookings = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          email: data.contactInfo?.email || 'N/A',
          phone: data.contactInfo?.phone || 'N/A',
          displayName: data.contactInfo?.displayName || 'N/A',
          status: data.status,
          createdAt: data.createdAt
        });
      });
      
      return bookings;
    } catch (error) {
      console.error("Error fetching event bookings:", error);
      return [];
    }
  };
  
  // Archive event (set status to "past")
  export const archiveEvent = async (eventId) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        status: 'past',
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error archiving event:", error);
      throw error;
    }
  };
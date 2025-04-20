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
  arrayUnion,
  runTransaction
} from 'firebase/firestore';
import { db } from './config';

// Helper function to determine event status based on date and time
export const determineEventStatus = (eventDate, eventTime) => {
  const now = new Date();
  
  // Parse eventDate (Format: "Month DD, YYYY")
  const dateParts = eventDate.match(/(\w+)\s+(\d+),\s+(\d+)/);
  if (!dateParts) return 'unknown';
  
  const month = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    .indexOf(dateParts[1].toLowerCase());
  const day = parseInt(dateParts[2], 10);
  const year = parseInt(dateParts[3], 10);
  
  // Parse start time from eventTime (Format: "H:MM AM/PM - H:MM AM/PM")
  const timeParts = eventTime.split('-')[0].trim().match(/(\d+):(\d+)\s*([AP]M)/i);
  if (!timeParts) return 'unknown';
  
  let hour = parseInt(timeParts[1], 10);
  const minute = parseInt(timeParts[2], 10);
  const isPM = timeParts[3].toUpperCase() === 'PM';
  
  // Convert to 24-hour format
  if (isPM && hour < 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  
  // Create event start date object
  const eventStartDate = new Date(year, month, day, hour, minute);
  
  // Create event end time (adding 1 hour to start time for booking cutoff)
  const eventCutoffDate = new Date(eventStartDate);
  eventCutoffDate.setHours(eventCutoffDate.getHours() + 1);
  
  // Determine status
  if (now > eventCutoffDate) {
    return 'past';
  } else if (now >= eventStartDate && now <= eventCutoffDate) {
    return 'active';
  } else {
    return 'upcoming';
  }
};

// Get all active events (status = "active" or upcoming with available spots)
export const getActiveEvents = async () => {
  try {
    // First get all events with status "active" or "upcoming"
    const eventsQuery = query(
      collection(db, 'events'),
      where('status', 'in', ['active', 'upcoming'])
    );
    
    const snapshot = await getDocs(eventsQuery);
    const events = [];
    
    snapshot.forEach(doc => {
      const eventData = doc.data();
      
      // Calculate the actual status based on date/time
      const actualStatus = determineEventStatus(eventData.date, eventData.time);
      
      // Only include if actually upcoming or active based on date
      if (actualStatus === 'upcoming' || actualStatus === 'active') {
        events.push({
          id: doc.id,
          ...eventData,
          actualStatus // Add the calculated status
        });
      }
    });
    
    // Sort the events by date
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
      where('status', 'in', ['active', 'upcoming']),
      where('type', '==', type)
    );
    
    const snapshot = await getDocs(eventsQuery);
    const events = [];
    
    snapshot.forEach(doc => {
      const eventData = doc.data();
      
      // Calculate the actual status based on date/time
      const actualStatus = determineEventStatus(eventData.date, eventData.time);
      
      // Only include if actually upcoming or active based on date
      if (actualStatus === 'upcoming' || actualStatus === 'active') {
        events.push({
          id: doc.id,
          ...eventData,
          actualStatus // Add the calculated status
        });
      }
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
    if (!userId || !eventId) {
      return false;
    }
    
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

// Check if event is bookable (has spots and within time window)
export const isEventBookable = async (eventId) => {
  try {
    if (!eventId) return { bookable: false, reason: "Invalid event ID" };
    
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      return { bookable: false, reason: "Event not found" };
    }
    
    const eventData = eventDoc.data();
    
    // Check if there are available spots
    if (eventData.spotsLeft <= 0) {
      return { bookable: false, reason: "No spots left" };
    }
    
    // Check if event is within booking window
    const actualStatus = determineEventStatus(eventData.date, eventData.time);
    if (actualStatus === 'past') {
      return { bookable: false, reason: "Booking closed" };
    }
    
    return { bookable: true };
  } catch (error) {
    console.error("Error checking if event is bookable:", error);
    return { bookable: false, reason: "Error checking event status" };
  }
};

// Book event and save user contact information (versione corretta con transaction)
export const bookEvent = async (eventId, userData) => {
  try {
    // 0. Verify if the user has already booked this event
    const isAlreadyBooked = await checkUserBooking(userData.userId, eventId);
    if (isAlreadyBooked) {
      console.log("User has already booked this event");
      return { success: true, message: "You have already booked this event" };
    }
    
    // Check if event is bookable
    const bookableStatus = await isEventBookable(eventId);
    if (!bookableStatus.bookable) {
      return { success: false, message: bookableStatus.reason };
    }
    
    // 1. Prepare booking data
    const bookingData = {
      userId: userData.userId,
      eventId: eventId,
      status: 'confirmed',
      createdAt: serverTimestamp(),
      contactInfo: {
        email: userData.email,
        phone: userData.phone,
        displayName: userData.displayName
      }
    };
    
    // 2. Use transaction for atomicity
    return await runTransaction(db, async (transaction) => {
      // All reads first
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await transaction.get(eventRef);
      
      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }
      
      const eventData = eventDoc.data();
      
      // Check event status again
      const actualStatus = determineEventStatus(eventData.date, eventData.time);
      if (actualStatus === 'past') {
        throw new Error("Booking is closed for this event");
      }
      
      // Check if there are spots available
      if (eventData.spotsLeft <= 0) {
        throw new Error("No spots left for this event");
      }
      
      // Get user data (reading)
      const userRef = doc(db, 'users', userData.userId);
      const userDoc = await transaction.get(userRef);
      
      // All writes next
      // Create booking
      const bookingRef = doc(collection(db, 'bookings'));
      transaction.set(bookingRef, bookingData);
      
      // Update available spots in the event
      transaction.update(eventRef, {
        spotsLeft: eventData.spotsLeft - 1,
        attendees: arrayUnion(userData.userId)
      });
      
      // Update user record if it exists
      if (userDoc.exists()) {
        transaction.update(userRef, {
          eventsBooked: arrayUnion(eventId),
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true, message: "Booking completed successfully" };
    });
  } catch (error) {
    console.error("Error booking event:", error);
    throw error;
  }
};

// Simplified version without transactions (if transactions continue to cause problems)
export const bookEventSimple = async (eventId, userData) => {
  try {
    // 1. Check if the user has already booked this event
    const isAlreadyBooked = await checkUserBooking(userData.userId, eventId);
    if (isAlreadyBooked) {
      return { success: true, message: "You have already booked this event" };
    }
    
    // 2. Check if event is bookable
    const bookableStatus = await isEventBookable(eventId);
    if (!bookableStatus.bookable) {
      return { success: false, message: bookableStatus.reason };
    }
    
    // 3. Get information about the event
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error("Event not found");
    }
    
    const eventData = eventDoc.data();
    
    // Check availability and status again
    if (eventData.spotsLeft <= 0) {
      throw new Error("No spots left for this event");
    }
    
    const actualStatus = determineEventStatus(eventData.date, eventData.time);
    if (actualStatus === 'past') {
      throw new Error("Booking is closed for this event");
    }
    
    // 4. Create the booking
    const newBooking = {
      userId: userData.userId,
      eventId: eventId,
      status: 'confirmed',
      createdAt: serverTimestamp(),
      contactInfo: {
        email: userData.email,
        phone: userData.phone,
        displayName: userData.displayName
      }
    };
    
    await addDoc(collection(db, 'bookings'), newBooking);
    
    // 5. Update available spots count in the event
    await updateDoc(eventRef, {
      spotsLeft: eventData.spotsLeft - 1,
      attendees: arrayUnion(userData.userId)
    });
    
    // 6. Update user profile (optional)
    try {
      const userRef = doc(db, 'users', userData.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          eventsBooked: arrayUnion(eventId),
          updatedAt: serverTimestamp()
        });
      }
    } catch (userErr) {
      console.warn("Could not update user profile:", userErr);
      // Don't block booking if user update fails
    }
    
    return { success: true, message: "Booking completed successfully" };
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
    // Get all events
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    
    let active = 0;
    let past = 0;
    let upcoming = 0;
    
    // Categorize each event based on its actual status
    eventsSnapshot.forEach(doc => {
      const eventData = doc.data();
      const actualStatus = determineEventStatus(eventData.date, eventData.time);
      
      if (actualStatus === 'active') {
        active++;
      } else if (actualStatus === 'past') {
        past++;
      } else if (actualStatus === 'upcoming') {
        upcoming++;
      }
    });
    
    return {
      active,
      past,
      upcoming,
      total: active + past + upcoming
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

// Update event status based on date/time
export const updateEventStatus = async (eventId) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error("Event not found");
    }
    
    const eventData = eventDoc.data();
    const actualStatus = determineEventStatus(eventData.date, eventData.time);
    
    // Only update if status has changed
    if (actualStatus !== eventData.status) {
      await updateDoc(eventRef, {
        status: actualStatus,
        updatedAt: serverTimestamp()
      });
    }
    
    return actualStatus;
  } catch (error) {
    console.error("Error updating event status:", error);
    throw error;
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

// Get total count of bookings for an event
export const getEventBookingsCount = async (eventId) => {
  try {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('eventId', '==', eventId)
    );
    
    const snapshot = await getDocs(bookingsQuery);
    return snapshot.size;
  } catch (error) {
    console.error("Error counting event bookings:", error);
    return 0;
  }
};
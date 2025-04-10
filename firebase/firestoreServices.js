import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    arrayUnion, 
    collection, 
    query, 
    where, 
    getDocs 
  } from 'firebase/firestore';
  import { db } from './config';
  
  // Get current event data
  export const getCurrentEvent = async () => {
    try {
      const eventRef = doc(db, 'events', 'current-event');
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        return eventDoc.data();
      } else {
        console.error("Current event not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching current event:", error);
      throw error;
    }
  };
  
  // Check if user is already booked for an event
  export const checkUserBooking = async (userId, eventId = 'current-event') => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        return eventData.attendees && eventData.attendees.includes(userId);
      }
      return false;
    } catch (error) {
      console.error("Error checking user booking status:", error);
      throw error;
    }
  };
  
  // Book event and save user contact information
  export const bookEvent = async (userId, eventId, contactInfo) => {
    try {
      // 1. Get current event
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
      
      // 2. Add user to event attendees and update spots
      await updateDoc(eventRef, {
        attendees: arrayUnion(userId),
        spotsLeft: eventData.spotsLeft - 1
      });
      
      // 3. Save contact information to attendees collection
      await setDoc(doc(db, 'attendees', userId), {
        userId,
        eventId,
        email: contactInfo.email,
        phone: contactInfo.phone,
        registeredAt: new Date(),
        // Add any additional user info you want to store
        displayName: contactInfo.displayName || null
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
      const userRef = doc(db, 'attendees', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user contact info:", error);
      return null;
    }
  };
  
  // Get all attendees for an event
  export const getEventAttendees = async (eventId = 'current-event') => {
    try {
      const attendeesQuery = query(
        collection(db, 'attendees'), 
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
      throw error;
    }
  };
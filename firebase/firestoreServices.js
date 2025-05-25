import { 
  collection, 
  doc, 
  addDoc,
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,  
  serverTimestamp,
  arrayUnion 
} from 'firebase/firestore';
import { db } from './config';

// Maximum image size for base64 encoding (3MB)
const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB in bytes

// Convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    // Check file size
    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error(`File size exceeds maximum allowed (${MAX_IMAGE_SIZE / (1024 * 1024)}MB)`));
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Compress image if needed (reduces quality to fit size limit)
export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    // If file is already small enough, return as is
    if (file.size <= MAX_IMAGE_SIZE) {
      resolve(file);
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate scale factor to reduce size while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Start with original dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image at current quality
        ctx.drawImage(img, 0, 0, width, height);
        
        // Reduce quality until we're under the size limit
        let quality = 0.9; // Start with 90% quality
        let dataUrl;
        
        // Try progressively lower quality until we get under the limit
        while (quality > 0.1) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Rough estimate of size (base64 string length * 0.75 is approximate size in bytes)
          const estimatedSize = dataUrl.length * 0.75;
          
          if (estimatedSize <= MAX_IMAGE_SIZE) {
            break;
          }
          
          // Reduce quality for next attempt
          quality -= 0.1;
        }
        
        // If we couldn't get under the size limit with quality adjustments, 
        // try reducing dimensions
        if (quality <= 0.1) {
          // Try again with reduced dimensions
          const scaleFactor = Math.sqrt(MAX_IMAGE_SIZE / file.size) * 0.9; // 10% margin
          width = Math.floor(width * scaleFactor);
          height = Math.floor(height * scaleFactor);
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Use moderate quality
        }
        
        // Convert base64 to a Blob
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            // Create a new File object
            const compressedFile = new File(
              [blob], 
              file.name, 
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            resolve(compressedFile);
          })
          .catch(reject);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

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

// Check if user is already booked for an event, with optional status info
export const checkUserBooking = async (userId, eventId, includeStatus = false) => {
  try {
    if (!userId || !eventId) {
      return includeStatus ? { isBooked: false, status: 'none', bookingId: null } : false;
    }
    
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', userId),
      where('eventId', '==', eventId)
    );
    
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    if (bookingsSnapshot.empty) {
      return includeStatus ? { isBooked: false, status: 'none', bookingId: null } : false;
    }
    
    // If includeStatus is true, return the booking status as well
    if (includeStatus) {
      const bookingDoc = bookingsSnapshot.docs[0];
      const bookingData = bookingDoc.data();
      
      return {
        isBooked: true,
        status: bookingData.status || 'confirmed',
        bookingId: bookingDoc.id
      };
    }
    
    return true; // User has a booking
  } catch (error) {
    console.error("Error checking user booking status:", error);
    return includeStatus ? { isBooked: false, status: 'error', bookingId: null } : false;
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

// Create a booking with improved payment handling or reactivate if cancelled
export const bookEventSimple = async (eventId, userData) => {
  try {
    // 1. Check if the user already has a booking for this event
    const bookingCheck = await checkUserBooking(userData.userId, eventId, true);
    const { isBooked, status, bookingId: existingBookingId } = bookingCheck;
    
    // If booking exists but was cancelled, reactivate it instead of creating a new one
    if (isBooked && status === 'cancelled' && existingBookingId) {
      console.log("Reactivating cancelled booking:", existingBookingId);
      
      // Update the existing booking
      const bookingRef = doc(db, 'bookings', existingBookingId);
      await updateDoc(bookingRef, {
        status: 'confirmed',
        paymentStatus: userData.paymentDetails ? 'COMPLETED' : 'NOT_REQUIRED',
        updatedAt: serverTimestamp(),
        // Update contact info if provided
        contactInfo: {
          email: userData.email || '',
          phone: userData.phone || '',
          displayName: userData.displayName || ''
        },
        // Update specific request if provided
        ...(userData.requests && { specificRequest: userData.requests }),
        // Add payment details if provided
        ...(userData.paymentDetails && { payment: {
          id: userData.paymentDetails.paymentId || null,
          amount: userData.paymentDetails.amount || 0,
          currency: userData.paymentDetails.currency || 'EUR',
          status: userData.paymentDetails.status || 'PENDING',
          payer: {
            id: userData.paymentDetails.payerID || null,
            email: userData.paymentDetails.payerEmail || ''
          },
          createdAt: userData.paymentDetails.createTime || new Date().toISOString(),
          updatedAt: userData.paymentDetails.updateTime || new Date().toISOString(),
          orderId: userData.paymentDetails.orderId || null
        }}),
        reactivatedAt: serverTimestamp()
      });
      
      // Update event's attendees and available spots
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        // Only add to attendees if not already there
        const attendees = eventData.attendees || [];
        if (!attendees.includes(userData.userId)) {
          await updateDoc(eventRef, {
            attendees: arrayUnion(userData.userId),
            spotsLeft: Math.max(0, (eventData.spotsLeft || 0) - 1)
          });
        }
      }
      
      // Update user eventsBooked array
      try {
        const userRef = doc(db, 'users', userData.userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Only add event if not already in eventsBooked
          const eventsBooked = userData.eventsBooked || [];
          if (!eventsBooked.includes(eventId)) {
            await updateDoc(userRef, {
              eventsBooked: arrayUnion(eventId),
              updatedAt: serverTimestamp()
            });
          }
        }
      } catch (userErr) {
        console.warn("Could not update user profile:", userErr);
      }
      
      return { 
        success: true, 
        message: "Booking reactivated successfully",
        bookingId: existingBookingId,
        requiresPayment: false,
        status: 'confirmed'
      };
    }
    
    // Regular flow for new bookings
    if (isBooked && status !== 'cancelled') {
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
    
    // Check if payment is already completed
    const paymentCompleted = userData.paymentDetails && 
                            (userData.paymentDetails.status === 'COMPLETED' || 
                             userData.paymentDetails.status === 'completed');
    
    // 4. Create the booking with payment details - safely handling undefined values
    const newBooking = {
      userId: userData.userId,
      eventId: eventId,
      // If payment is required but not yet completed, set status to payment-pending
      // Otherwise, set to confirmed
      status: (eventData.paymentAmount > 0 && !paymentCompleted) ? 'payment-pending' : 'confirmed',
      // Same logic for payment status
      paymentStatus: (eventData.paymentAmount > 0 && !paymentCompleted) ? 'PENDING' : 
                    (eventData.paymentAmount > 0) ? 'COMPLETED' : 'NOT_REQUIRED',
      createdAt: serverTimestamp(),
      contactInfo: {
        email: userData.email || '',
        phone: userData.phone || '',
        displayName: userData.displayName || ''
      },
      // Include optional specific request if provided
      specificRequest: userData.requests || null,
    };
    
    // Safely add payment information if it exists
    if (userData.paymentDetails) {
      // Create a sanitized payment object with proper null checks
      const payment = {
        id: userData.paymentDetails.paymentId || null,
        amount: userData.paymentDetails.amount || 0,
        currency: userData.paymentDetails.currency || 'EUR',
        status: userData.paymentDetails.status || 'PENDING',
        payer: {
          // Only include id if it exists
          ...(userData.paymentDetails.payerID && { id: userData.paymentDetails.payerID }),
          email: userData.paymentDetails.payerEmail || ''
        },
        createdAt: userData.paymentDetails.createTime || new Date().toISOString(),
        updatedAt: userData.paymentDetails.updateTime || new Date().toISOString(),
        orderId: userData.paymentDetails.orderId || null
      };
      
      // Add the payment object to the booking
      newBooking.payment = payment;
    }
    
    const bookingRef = await addDoc(collection(db, 'bookings'), newBooking);
    const newBookingId = bookingRef.id;
    
    // 5. If payment details exist, create separate payment record linked to this booking
    if (userData.paymentDetails && userData.paymentDetails.paymentId) {
      try {
        const paymentRecord = {
          paymentId: userData.paymentDetails.paymentId,
          amount: userData.paymentDetails.amount || eventData.paymentAmount || 0,
          currency: userData.paymentDetails.currency || 'EUR',
          status: userData.paymentDetails.status || 'PENDING',
          eventId: eventId,
          userId: userData.userId,
          bookingId: newBookingId, // This is the important link
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          orderId: userData.paymentDetails.orderId || null,
          payerEmail: userData.email || userData.paymentDetails.payerEmail || '',
          payerId: userData.paymentDetails.payerID || null
        };
        
        await addDoc(collection(db, 'payments'), paymentRecord);
        console.log("Created payment record linked to booking:", newBookingId);
      } catch (err) {
        console.warn("Error creating payment record:", err);
        // Don't block the booking creation if payment record fails
      }
    }
    
    // 6. Update available spots count in the event - only reduce if payment not required or already completed
    // FIX: Use paymentCompleted variable here to ensure consistency
    if (newBooking.status === 'confirmed' || paymentCompleted) {
      await updateDoc(eventRef, {
        spotsLeft: eventData.spotsLeft - 1,
        attendees: arrayUnion(userData.userId),
        // Also remove from pendingBookings if it was there
        ...(eventData.pendingBookings?.includes(newBookingId) 
          ? { pendingBookings: arrayRemove(newBookingId) } 
          : {})
      });
    } else {
      // For pending payments, don't reduce the available spots yet
      console.log("Payment is pending - not reducing available spots yet");
      
      // But we should still add a "pendingBookings" array to track these
      await updateDoc(eventRef, {
        pendingBookings: arrayUnion(newBookingId)
      });
    }
    
    // 7. Update user profile with all the new fields
    try {
      const userRef = doc(db, 'users', userData.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userUpdates = {
          // FIX: Only add event to eventsBooked array if payment is completed or not required
          // Use paymentCompleted variable for consistency
          ...(newBooking.status === 'confirmed' || paymentCompleted
              ? { 
                  eventsBooked: arrayUnion(eventId),
                  // Also remove from pendingBookings if payment is completed
                  ...(userDoc.data().pendingBookings?.includes(newBookingId) 
                    ? { pendingBookings: arrayRemove(newBookingId) } 
                    : {})
                } 
              : { pendingBookings: arrayUnion(newBookingId) }),
          updatedAt: serverTimestamp()
        };
        
        // Add user personal data if provided (only first time)
        if (userData.name) userUpdates.name = userData.name;
        if (userData.surname) userUpdates.surname = userData.surname;
        if (userData.birthDate) userUpdates.birthDate = userData.birthDate;
        if (userData.address) userUpdates.address = userData.address;
        if (userData.taxId) userUpdates.taxId = userData.taxId;
        if (userData.instagram) userUpdates.instagram = userData.instagram;
        
        await updateDoc(userRef, userUpdates);
      }
    } catch (userErr) {
      console.warn("Could not update user profile:", userErr);
      // Don't block booking if user update fails
    }
    
    return { 
      success: true, 
      message: "Booking created successfully",
      bookingId: newBookingId,
      requiresPayment: eventData.paymentAmount > 0 && !paymentCompleted,
      status: newBooking.status
    };
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
      
      // Only include active bookings (not cancelled)
      if (data.status !== 'cancelled') {
        bookings.push({
          id: doc.id,
          userId: data.userId, // Include userId to fetch user profile data
          email: data.contactInfo?.email || 'N/A',
          phone: data.contactInfo?.phone || 'N/A',
          displayName: data.contactInfo?.displayName || 'N/A',
          status: data.status,
          paymentStatus: data.paymentStatus || 'N/A',
          createdAt: data.createdAt,
          specificRequest: data.specificRequest || ''
        });
      }
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
      // Rimuoviamo il filtro status per evitare l'indice composito
    );
    
    const snapshot = await getDocs(bookingsQuery);
    
    // Filtra in memoria solo i booking non cancellati
    let count = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status !== 'cancelled') {
        count++;
      }
    });
    
    return count;
  } catch (error) {
    console.error("Error counting event bookings:", error);
    return 0;
  }
};
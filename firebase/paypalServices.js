import { db } from './config';
import { 
  collection, 
  addDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

import { bookEventSimple } from './firestoreServices';

// Store payment information in Firestore
export const savePaymentRecord = async (paymentData) => {
  try {
    // Build payment object with optional fields properly handled
    const payment = {
      paymentId: paymentData.paymentId || paymentData.id || 'DIRECT_PAYMENT',
      payerId: paymentData.payerId || 'UNKNOWN',
      amount: paymentData.amount,
      currency: paymentData.currency || 'EUR',
      status: paymentData.status || 'COMPLETED',
      eventId: paymentData.eventId,
      userId: paymentData.userId,
      // Only include bookingId if it's provided and not undefined
      ...(paymentData.bookingId && { bookingId: paymentData.bookingId }),
      // Only include orderId if it's provided and not undefined
      ...(paymentData.orderId && { orderId: paymentData.orderId }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      payerEmail: paymentData.payerEmail || '',
      // Store details if available, otherwise use an empty object
      fullDetails: paymentData.fullDetails || {}
    };

    // Create a dedicated payment record
    const paymentRef = await addDoc(collection(db, 'payments'), payment);
    console.log("Payment record saved with ID:", paymentRef.id);
    return paymentRef.id;
  } catch (error) {
    console.error('Error saving payment record:', error);
    throw error;
  }
};

// Update payment status (e.g., when receiving webhook from PayPal)
export const updatePaymentStatus = async (paymentId, newStatus, details = {}) => {
  try {
    // Find payment by PayPal payment ID
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('paymentId', '==', paymentId)
    );
    
    const snapshot = await getDocs(paymentsQuery);
    
    if (snapshot.empty) {
      console.log(`Payment with ID ${paymentId} not found, checking order ID...`);
      
      // Try finding by order ID if available
      if (details.orderId) {
        const orderQuery = query(
          collection(db, 'payments'),
          where('orderId', '==', details.orderId)
        );
        
        const orderSnapshot = await getDocs(orderQuery);
        
        if (!orderSnapshot.empty) {
          const paymentDoc = orderSnapshot.docs[0];
          
          // Update payment with real PayPal ID and status
          await updateDoc(doc(db, 'payments', paymentDoc.id), {
            paymentId: paymentId, // Update with real PayPal transaction ID
            status: newStatus,
            updatedAt: serverTimestamp(),
            updateDetails: details
          });
          
          console.log(`Updated payment by order ID: ${details.orderId}`);
          
          // Update booking if needed
          await updateRelatedBooking(paymentDoc.data(), newStatus, details);
          
          return true;
        }
      }
      
      // No matching payment found - create a new record
      console.log(`Creating new payment record for ${paymentId}`);
      
      await addDoc(collection(db, 'payments'), {
        paymentId: paymentId,
        status: newStatus,
        updateDetails: details,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: 'webhook'
      });
      
      return true;
    }
    
    // Update existing payment found by payment ID
    const paymentDoc = snapshot.docs[0];
    
    await updateDoc(doc(db, 'payments', paymentDoc.id), {
      status: newStatus,
      updatedAt: serverTimestamp(),
      updateDetails: details
    });
    
    // Update any related booking
    await updateRelatedBooking(paymentDoc.data(), newStatus, details);
    
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Helper function to update related booking
async function updateRelatedBooking(paymentData, newStatus, details) {
  try {
    // Check if we have booking ID
    if (paymentData.bookingId) {
      const bookingRef = doc(db, 'bookings', paymentData.bookingId);
      const bookingDoc = await getDoc(bookingRef);
      
      if (bookingDoc.exists()) {
        await updateDoc(bookingRef, {
          paymentStatus: newStatus,
          updatedAt: serverTimestamp(),
          paymentDetails: details
        });
        
        console.log(`Updated booking ${paymentData.bookingId} payment status to ${newStatus}`);
        return true;
      }
    }
    
    // If no booking ID or booking not found, try to find by event and user
    if (paymentData.eventId && paymentData.userId) {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('eventId', '==', paymentData.eventId),
        where('userId', '==', paymentData.userId)
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      if (!bookingsSnapshot.empty) {
        // Update the first matching booking
        const bookingDoc = bookingsSnapshot.docs[0];
        
        await updateDoc(bookingDoc.ref, {
          paymentStatus: newStatus,
          updatedAt: serverTimestamp(),
          paymentDetails: details
        });
        
        console.log(`Updated booking ${bookingDoc.id} by event/user match`);
        
        // Also update the payment record with the booking ID
        if (paymentData.id) {
          await updateDoc(doc(db, 'payments', paymentData.id), {
            bookingId: bookingDoc.id
          });
        }
        
        return true;
      }
    }
    
    console.log('No matching booking found to update');
    return false;
  } catch (error) {
    console.error('Error updating related booking:', error);
    throw error;
  }
}

// Get all payments for an event
export const getEventPayments = async (eventId) => {
  try {
    const payments = [];
    
    // Check both payments collection and bookings with payment
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('eventId', '==', eventId)
    );
    
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    paymentsSnapshot.forEach(doc => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Also look for bookings with payment data for this event
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('eventId', '==', eventId)
    );
    
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      if (booking.payment) {
        payments.push({
          id: doc.id,
          paymentId: booking.payment.id || 'N/A',
          amount: booking.payment.amount || 0,
          currency: booking.payment.currency || 'EUR',
          status: booking.payment.status || 'PENDING',
          eventId: booking.eventId,
          userId: booking.userId,
          createdAt: booking.payment.createdAt || booking.createdAt,
          bookingId: doc.id,
          payerEmail: booking.contactInfo?.email || ''
        });
      }
    });
    
    return payments;
  } catch (error) {
    console.error('Error fetching event payments:', error);
    throw error;
  }
};

// Get all payments for a user
export const getUserPayments = async (userId) => {
  try {
    const payments = [];
    
    // Check both payments collection and bookings with payment
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('userId', '==', userId)
    );
    
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    paymentsSnapshot.forEach(doc => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Also look for bookings with payment data
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', userId)
    );
    
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      if (booking.payment) {
        payments.push({
          id: doc.id,
          paymentId: booking.payment.id || 'N/A',
          amount: booking.payment.amount || 0,
          currency: booking.payment.currency || 'EUR',
          status: booking.payment.status || 'PENDING',
          eventId: booking.eventId,
          userId: booking.userId,
          createdAt: booking.payment.createdAt || booking.createdAt,
          bookingId: doc.id
        });
      }
    });
    
    return payments;
  } catch (error) {
    console.error('Error fetching user payments:', error);
    throw error;
  }
};

// Process a new booking payment (after PayPal redirect)
export const processBookingPayment = async (bookingData, paymentDetails) => {
  try {
    // Create booking with payment details
    const bookingResult = await bookEventSimple(bookingData.eventId, {
      ...bookingData.userData,
      paymentDetails
    });
    
    // Get the booking ID if available
    const bookingId = bookingResult?.bookingId;
    
    // Save standalone payment record
    await savePaymentRecord({
      paymentId: paymentDetails.paymentId,
      payerId: paymentDetails.payerId,
      amount: bookingData.amount,
      currency: 'EUR',
      status: paymentDetails.status,
      eventId: bookingData.eventId,
      userId: bookingData.userData.userId,
      payerEmail: bookingData.userData.email,
      orderId: paymentDetails.orderId || bookingData.orderId,
      // Only include bookingId if it's available
      ...(bookingId && { bookingId }),
      fullDetails: paymentDetails
    });
    
    return bookingResult;
  } catch (error) {
    console.error('Error processing booking payment:', error);
    throw error;
  }
};

// Verify payment with PayPal
export const verifyPayment = async (paymentId, amount, currency) => {
  try {
    // Find payment by ID
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('paymentId', '==', paymentId)
    );
    
    const snapshot = await getDocs(paymentsQuery);
    
    if (snapshot.empty) {
      return { verified: false, reason: 'Payment not found' };
    }
    
    const payment = snapshot.docs[0].data();
    
    // Check payment amount and currency if provided
    if (amount && currency) {
      if (
        payment.amount === amount &&
        payment.currency === currency &&
        (payment.status === 'COMPLETED' || payment.status === 'completed')
      ) {
        return { verified: true, paymentData: payment };
      } else {
        return { 
          verified: false, 
          reason: 'Payment details mismatch or payment not completed',
          expected: { amount, currency, status: 'COMPLETED' },
          actual: { amount: payment.amount, currency: payment.currency, status: payment.status }
        };
      }
    } else {
      // Just check if it's completed
      if (payment.status === 'COMPLETED' || payment.status === 'completed') {
        return { verified: true, paymentData: payment };
      } else {
        return { verified: false, reason: `Payment status is ${payment.status}` };
      }
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};
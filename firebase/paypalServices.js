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
    const payment = {
      paymentId: paymentData.paymentId || paymentData.id || 'DIRECT_PAYMENT',
      payerId: paymentData.payerId || 'UNKNOWN',
      amount: paymentData.amount,
      currency: paymentData.currency || 'EUR',
      status: paymentData.status || 'COMPLETED',
      eventId: paymentData.eventId,
      userId: paymentData.userId,
      bookingId: paymentData.bookingId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      payerEmail: paymentData.payerEmail || '',
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
      throw new Error(`Payment with ID ${paymentId} not found`);
    }
    
    const paymentDoc = snapshot.docs[0];
    
    // Update payment status
    await updateDoc(doc(db, 'payments', paymentDoc.id), {
      status: newStatus,
      updatedAt: serverTimestamp(),
      updateDetails: details
    });
    
    // If payment was completed, also update booking status
    if (newStatus === 'COMPLETED' && paymentDoc.data().bookingId) {
      const bookingRef = doc(db, 'bookings', paymentDoc.data().bookingId);
      await updateDoc(bookingRef, {
        paymentStatus: 'COMPLETED',
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

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

// Verify payment with PayPal (can be implemented when needed for security)
export const verifyPayment = async (paymentId, amount, currency) => {
  // This would normally call PayPal's verify API
  // For simplicity, we're just doing a basic check here
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('paymentId', '==', paymentId)
    );
    
    const snapshot = await getDocs(paymentsQuery);
    
    if (snapshot.empty) {
      return { verified: false, reason: 'Payment not found' };
    }
    
    const payment = snapshot.docs[0].data();
    
    // Check payment amount and currency
    if (
      payment.amount === amount &&
      payment.currency === currency &&
      payment.status === 'COMPLETED'
    ) {
      return { verified: true };
    } else {
      return { 
        verified: false, 
        reason: 'Payment details mismatch or payment not completed',
        expected: { amount, currency, status: 'COMPLETED' },
        actual: { amount: payment.amount, currency: payment.currency, status: payment.status }
      };
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
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
      fullDetails: paymentDetails
    });
    
    return bookingResult;
  } catch (error) {
    console.error('Error processing booking payment:', error);
    throw error;
  }
};
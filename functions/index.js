// functions/index.js - Updated for better payment handling
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { defineString } = require("firebase-functions/params");
const { verifyWebhook } = require('./webhookVerification');
const { createOrUpdateEventSheet } = require('./googleSheetsService');

// Define parameters for configuration
const paypalWebhookId = defineString("PAYPAL_WEBHOOK_ID");
const paypalSandbox = defineString("PAYPAL_SANDBOX", { default: "true" });

// Initialize Firebase
initializeApp();

// PayPal webhook handler
exports.paypalWebhook = onRequest(
  {
    // Configure function settings
    region: "us-central1",
    cors: true, // Enable CORS
    maxInstances: 10, // Maximum concurrent instances
  },
  async (req, res) => {
    try {
      // Log webhook data for debugging
      console.log("Received webhook request with headers:", JSON.stringify(req.headers));
      console.log("Webhook body summary:", summarizeWebhookBody(req.body));
      
      // Get PayPal webhook signature from headers
      const transmissionId = req.headers["paypal-transmission-id"];
      const timestamp = req.headers["paypal-transmission-time"];
      const webhookSignature = req.headers["paypal-transmission-sig"];
      const certUrl = req.headers["paypal-cert-url"];
      
      // For validation request, just return success
      if (req.body && req.body.event_type === "VALIDATION") {
        console.log("Received validation request from PayPal");
        return res.status(200).json({
          verification_status: "SUCCESS"
        });
      }
      
      // Process webhook
      if (req.body && req.body.event_type) {
        const webhookEvent = req.body;
        console.log(`Received PayPal webhook: ${webhookEvent.event_type}`);
        
        // Optional: Verify webhook signature with PayPal
        if (transmissionId && timestamp && webhookSignature && certUrl) {
          try {
            const verificationResult = await verifyWebhook(req, paypalWebhookId.value());
            if (!verificationResult.verified) {
              console.warn("Webhook verification failed:", verificationResult.message);
              // During development, continue processing unverified webhooks
              // In production, you should reject unverified webhooks
            }
          } catch (verifyError) {
            console.error("Error verifying webhook:", verifyError);
            // Continue for development
          }
        }
        
        // Store the webhook event for reference
        try {
          const db = getFirestore();
          await db.collection("paypal_webhooks").add({
            event_type: webhookEvent.event_type,
            event_id: webhookEvent.id,
            resource_type: webhookEvent.resource_type,
            summary: summarizeWebhookBody(webhookEvent),
            receivedAt: new Date(),
            headers: req.headers,
            processed: false
          });
          console.log("Webhook metadata stored in Firestore");
        } catch (dbError) {
          console.error("Error storing webhook metadata:", dbError);
          // Continue processing regardless
        }
        
        // Process different event types
        switch (webhookEvent.event_type) {
          case "PAYMENT.CAPTURE.COMPLETED":
            await handlePaymentCompleted(webhookEvent);
            break;
          
          case "PAYMENT.CAPTURE.DENIED":
          case "PAYMENT.CAPTURE.REVERSED":
          case "PAYMENT.CAPTURE.REFUNDED":
            await handlePaymentFailed(webhookEvent);
            break;
            
          default:
            console.log(`Unhandled event type: ${webhookEvent.event_type}`);
        }
      }
      
      // Acknowledge receipt of the event
      return res.status(200).send("Webhook received successfully");
    } catch (error) {
      console.error("Error processing webhook:", error);
      // Still return 200 to prevent PayPal from retrying
      return res.status(200).send("Webhook acknowledged with errors");
    }
  }
);

exports.syncEventToSheetsManual = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    try {
      const { eventId } = request.data;
      
      if (!eventId) {
        throw new Error('eventId is required');
      }

      console.log(`Manual sync requested for event: ${eventId}`);
      
      const db = getFirestore();
      
      // Get event data
      const eventDoc = await db.collection('events').doc(eventId).get();
      
      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      
      // SIMPLIFIED APPROACH: Get all bookings for this event without status filter
      // This avoids the composite index requirement
      const bookingsSnapshot = await db.collection('bookings')
        .where('eventId', '==', eventId)
        .get();

      const bookings = [];
      
      // Process each booking document
      for (const bookingDoc of bookingsSnapshot.docs) {
        const booking = bookingDoc.data();
        
        // Filter out cancelled bookings in code instead of query
        if (booking.status === 'cancelled') {
          continue;
        }
        
        // Get user profile data - FIXED: Use .exists instead of .exists()
        const userDoc = await db.collection('users').doc(booking.userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        const userFullName = userData.name && userData.surname
          ? `${userData.name} ${userData.surname}`
          : null;

        bookings.push({
          id: bookingDoc.id,
          ...booking,
          userFullName,
          email: booking.contactInfo?.email || 'N/A',
          phone: booking.contactInfo?.phone || 'N/A',
          displayName: booking.contactInfo?.displayName || 'N/A',
          birthDate: userData.birthDate || 'N/A',
          address: userData.address || 'N/A', 
          taxId: userData.taxId || 'N/A',
          instagram: userData.instagram || 'N/A'
        });
      }

      // Sort bookings by creation date
      bookings.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
        return timeA - timeB;
      });

      // Update Google Sheet
      const result = await createOrUpdateEventSheet({
        id: eventId,
        title: eventData.title,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        venueName: eventData.venueName,
        spots: eventData.spots,
        spotsLeft: eventData.spotsLeft
      }, bookings);

      console.log(`Manual sync completed: ${result.sheetTitle} with ${result.bookingsCount} bookings`);
      
      return {
        success: true,
        message: `Successfully synced ${result.bookingsCount} bookings to sheet "${result.sheetTitle}"`,
        sheetTitle: result.sheetTitle,
        bookingsCount: result.bookingsCount
      };
      
    } catch (error) {
      console.error('Error in manual sync:', error);
      throw new Error(`Sync failed: ${error.message}`);
    }
  }
);

// Create a summary of the webhook body to avoid overly large logs
function summarizeWebhookBody(body) {
  if (!body) return "Empty body";
  
  const summary = {
    event_type: body.event_type,
    event_id: body.id,
    resource_type: body.resource_type,
    resource_id: body.resource?.id,
    create_time: body.create_time,
  };
  
  // Add payment-specific fields if available
  if (body.resource) {
    if (body.resource.status) summary.status = body.resource.status;
    if (body.resource.amount) summary.amount = body.resource.amount;
    if (body.resource.custom_id) summary.custom_id = body.resource.custom_id;
    if (body.resource.invoice_id) summary.invoice_id = body.resource.invoice_id;
  }
  
  return summary;
}

// Handle successful payment
async function handlePaymentCompleted(event) {
  try {
    const db = getFirestore();
    const paymentData = event.resource;
    
    // Extract key information
    const transactionId = paymentData.id;
    const status = paymentData.status;
    const customId = paymentData.custom_id || ""; // This might be the userId
    const invoiceId = paymentData.invoice_id || ""; // This might contain the orderId
    
    console.log(`Processing completed payment: ${transactionId}, Invoice: ${invoiceId}, Custom: ${customId}`);
    
    // Try to find an order ID in the invoice field
    let orderId = null;
    if (invoiceId && invoiceId.startsWith('order_')) {
      orderId = invoiceId;
    }
    
    // First, try to find the payment by transactionId
    const paymentsQuery = db.collection("payments").where("paymentId", "==", transactionId);
    const paymentsSnapshot = await paymentsQuery.get();
    
    if (!paymentsSnapshot.empty) {
      // Update existing payment record
      const paymentDoc = paymentsSnapshot.docs[0];
      await paymentDoc.ref.update({
        status: "COMPLETED",
        updatedAt: new Date(),
        webhookDetails: summarizeWebhookBody(event)
      });
      
      console.log(`Updated payment status for ${transactionId} to COMPLETED`);
      
      // Update related booking if it exists
      const paymentData = paymentDoc.data();
      if (paymentData.bookingId) {
        await updateBookingStatus(db, paymentData.bookingId, "COMPLETED");
      } else if (paymentData.eventId && paymentData.userId) {
        // Try to find the booking by event and user
        await updateBookingByEventAndUser(db, paymentData.eventId, paymentData.userId, "COMPLETED");
      }
      
      return true;
    }
    
    // If not found by transaction ID, try by orderId if available
    if (orderId) {
      const orderQuery = db.collection("payments").where("orderId", "==", orderId);
      const orderSnapshot = await orderQuery.get();
      
      if (!orderSnapshot.empty) {
        // Update payment with real PayPal transaction ID
        const paymentDoc = orderSnapshot.docs[0];
        await paymentDoc.ref.update({
          paymentId: transactionId,
          status: "COMPLETED",
          updatedAt: new Date(),
          webhookDetails: summarizeWebhookBody(event)
        });
        
        console.log(`Updated payment by orderId ${orderId} to COMPLETED with transaction ID ${transactionId}`);
        
        // Update related booking if it exists
        const paymentData = paymentDoc.data();
        if (paymentData.bookingId) {
          await updateBookingStatus(db, paymentData.bookingId, "COMPLETED");
        } else if (paymentData.eventId && paymentData.userId) {
          // Try to find the booking by event and user
          await updateBookingByEventAndUser(db, paymentData.eventId, paymentData.userId, "COMPLETED");
        }
        
        return true;
      }
    }
    
    // Payment not found - create a new entry
    await db.collection("payments").add({
      paymentId: transactionId,
      orderId: orderId,
      status: "COMPLETED",
      amount: paymentData.amount ? parseFloat(paymentData.amount.value) : 0,
      currency: paymentData.amount ? paymentData.amount.currency_code : "EUR",
      custom_id: customId,
      createdAt: new Date(),
      updatedAt: new Date(),
      webhookDetails: summarizeWebhookBody(event),
      source: "webhook"
    });
    
    console.log(`Created new payment record for ${transactionId} from webhook`);
    return true;
  } catch (error) {
    console.error("Error handling payment completion:", error);
    throw error;
  }
}

// Handle failed or reversed payment
async function handlePaymentFailed(event) {
  try {
    const db = getFirestore();
    const paymentData = event.resource;
    const transactionId = paymentData.id;
    
    // Determine the appropriate status
    let newStatus = "FAILED";
    if (event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
      newStatus = "REFUNDED";
    } else if (event.event_type === "PAYMENT.CAPTURE.REVERSED") {
      newStatus = "REVERSED";
    }
    
    console.log(`Processing failed payment: ${transactionId} with status ${newStatus}`);
    
    // Find and update any related payment records
    const paymentsQuery = db.collection("payments").where("paymentId", "==", transactionId);
    const paymentsSnapshot = await paymentsQuery.get();
    
    if (!paymentsSnapshot.empty) {
      // Update existing payment record
      const paymentDoc = paymentsSnapshot.docs[0];
      await paymentDoc.ref.update({
        status: newStatus,
        updatedAt: new Date(),
        webhookDetails: summarizeWebhookBody(event)
      });
      
      // If the payment has a booking ID, update that too
      const paymentData = paymentDoc.data();
      if (paymentData.bookingId) {
        await updateBookingStatus(db, paymentData.bookingId, newStatus);
      } else if (paymentData.eventId && paymentData.userId) {
        // Try to find the booking by event and user
        await updateBookingByEventAndUser(db, paymentData.eventId, paymentData.userId, newStatus);
      }
      
      console.log(`Updated payment status for ${transactionId} to ${newStatus}`);
    } else {
      // Payment record not found - create a new one
      await db.collection("payments").add({
        paymentId: transactionId,
        status: newStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        webhookDetails: summarizeWebhookBody(event),
        source: "webhook"
      });
      
      console.log(`Created new payment record for ${transactionId} with status ${newStatus}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}

// Helper function to update booking status
async function updateBookingStatus(db, bookingId, status) {
  try {
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingDoc = await bookingRef.get();
    
    if (bookingDoc.exists) {
      const bookingData = bookingDoc.data();
      
      // Update booking status and payment status
      await bookingRef.update({
        paymentStatus: status,
        // If payment is now completed, also change the main status to confirmed
        ...(status === "COMPLETED" && bookingData.status === "payment-pending" 
            ? { status: "confirmed" } 
            : {}),
        updatedAt: new Date()
      });
      
      console.log(`Updated booking ${bookingId} payment status to ${status}`);
      
      // If payment is completed, also update event and user collections
      if (status === "COMPLETED" && bookingData.eventId && bookingData.userId) {
        // 1. Update the event (add user to attendees, decrease spots, remove from pendingBookings)
        try {
          const eventRef = db.collection("events").doc(bookingData.eventId);
          const eventDoc = await eventRef.get();
          
          if (eventDoc.exists) {
            const eventData = eventDoc.data();
            const attendees = eventData.attendees || [];
            const pendingBookings = eventData.pendingBookings || [];
            
            // Only update if needed
            if (!attendees.includes(bookingData.userId) || pendingBookings.includes(bookingId)) {
              // Prepare update data
              const updateData = {};
              
              // Add user to attendees if not already there
              if (!attendees.includes(bookingData.userId)) {
                updateData.attendees = [...attendees, bookingData.userId];
                updateData.spotsLeft = Math.max(0, (eventData.spotsLeft || 0) - 1);
              }
              
              // Remove booking from pendingBookings if it's there
              if (pendingBookings.includes(bookingId)) {
                updateData.pendingBookings = pendingBookings.filter(id => id !== bookingId);
              }
              
              // Only update if we have changes
              if (Object.keys(updateData).length > 0) {
                await eventRef.update(updateData);
                console.log(`Updated event ${bookingData.eventId} for booking ${bookingId}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error updating event for booking ${bookingId}:`, error);
        }
        
        // 2. Update the user (add event to eventsBooked, remove from pendingBookings)
        try {
          const userRef = db.collection("users").doc(bookingData.userId);
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            const eventsBooked = userData.eventsBooked || [];
            const pendingBookings = userData.pendingBookings || [];
            
            // Only update if needed
            if (!eventsBooked.includes(bookingData.eventId) || pendingBookings.includes(bookingId)) {
              // Prepare update data
              const updateData = {
                updatedAt: new Date()
              };
              
              // Add event to eventsBooked if not already there
              if (!eventsBooked.includes(bookingData.eventId)) {
                updateData.eventsBooked = [...eventsBooked, bookingData.eventId];
              }
              
              // Remove booking from pendingBookings if it's there
              if (pendingBookings.includes(bookingId)) {
                updateData.pendingBookings = pendingBookings.filter(id => id !== bookingId);
              }
              
              // Only update if we have changes
              if (Object.keys(updateData).length > 1) { // > 1 because updatedAt is always there
                await userRef.update(updateData);
                console.log(`Updated user ${bookingData.userId} for booking ${bookingId}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error updating user for booking ${bookingId}:`, error);
        }
      }
      
      return true;
    } else {
      console.log(`Booking ${bookingId} not found`);
      return false;
    }
  } catch (error) {
    console.error("Error updating booking status:", error);
    return false;
  }
}


// Helper function to find booking by event and user
async function updateBookingByEventAndUser(db, eventId, userId, status) {
  try {
    if (!eventId || !userId) {
      console.log("Missing eventId or userId for booking lookup");
      return false;
    }
    
    const bookingsQuery = db.collection("bookings")
      .where("eventId", "==", eventId)
      .where("userId", "==", userId);
    
    const bookingsSnapshot = await bookingsQuery.get();
    
    if (!bookingsSnapshot.empty) {
      // Update the first matching booking
      const bookingDoc = bookingsSnapshot.docs[0];
      const bookingData = bookingDoc.data();
      
      // Update booking status
      const updateData = {
        paymentStatus: status,
        updatedAt: new Date()
      };
      
      // If payment is now completed, also change the main status to confirmed
      if (status === "COMPLETED" && bookingData.status === "payment-pending") {
        updateData.status = "confirmed";
      }
      
      await bookingDoc.ref.update(updateData);
      
      console.log(`Updated booking ${bookingDoc.id} by event/user match to status ${status}`);
      
      // If payment is completed, also update event and user collections
      if (status === "COMPLETED") {
        // 1. Update the event (add user to attendees, decrease spots, remove from pendingBookings)
        try {
          const eventRef = db.collection("events").doc(eventId);
          const eventDoc = await eventRef.get();
          
          if (eventDoc.exists) {
            const eventData = eventDoc.data();
            const attendees = eventData.attendees || [];
            const pendingBookings = eventData.pendingBookings || [];
            
            // Only update if needed
            if (!attendees.includes(userId) || pendingBookings.includes(bookingDoc.id)) {
              // Prepare update data
              const updateData = {};
              
              // Add user to attendees if not already there
              if (!attendees.includes(userId)) {
                updateData.attendees = [...attendees, userId];
                updateData.spotsLeft = Math.max(0, (eventData.spotsLeft || 0) - 1);
              }
              
              // Remove booking from pendingBookings if it's there
              if (pendingBookings.includes(bookingDoc.id)) {
                updateData.pendingBookings = pendingBookings.filter(id => id !== bookingDoc.id);
              }
              
              // Only update if we have changes
              if (Object.keys(updateData).length > 0) {
                await eventRef.update(updateData);
                console.log(`Updated event ${eventId} for booking ${bookingDoc.id}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error updating event for booking ${bookingDoc.id}:`, error);
        }
        
        // 2. Update the user (add event to eventsBooked, remove from pendingBookings)
        try {
          const userRef = db.collection("users").doc(userId);
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            const eventsBooked = userData.eventsBooked || [];
            const pendingBookings = userData.pendingBookings || [];
            
            // Only update if needed
            if (!eventsBooked.includes(eventId) || pendingBookings.includes(bookingDoc.id)) {
              // Prepare update data
              const updateData = {
                updatedAt: new Date()
              };
              
              // Add event to eventsBooked if not already there
              if (!eventsBooked.includes(eventId)) {
                updateData.eventsBooked = [...eventsBooked, eventId];
              }
              
              // Remove booking from pendingBookings if it's there
              if (pendingBookings.includes(bookingDoc.id)) {
                updateData.pendingBookings = pendingBookings.filter(id => id !== bookingDoc.id);
              }
              
              // Only update if we have changes
              if (Object.keys(updateData).length > 1) { // > 1 because updatedAt is always there
                await userRef.update(updateData);
                console.log(`Updated user ${userId} for booking ${bookingDoc.id}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error updating user for booking ${bookingDoc.id}:`, error);
        }
      }
      
      return true;
    } else {
      console.log(`No booking found for eventId=${eventId}, userId=${userId}`);
      return false;
    }
  } catch (error) {
    console.error("Error updating booking by event and user:", error);
    return false;
  }
}
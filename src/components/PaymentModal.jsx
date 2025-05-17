import { useState } from 'react';

function PaymentModal({ isOpen, onClose, event, userData, onPaymentSuccess, onPaymentCancel }) {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState(null);

  // Safe fallback for amount
  const amount = event?.paymentAmount !== undefined && event?.paymentAmount !== null
    ? event.paymentAmount
    : 10;

  if (!isOpen) return null;

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    position: 'relative'
  };

  const handlePayNowClick = async () => {
    try {
      // Validate amount
      const value = parseFloat(amount).toFixed(2);
      if (isNaN(value) || Number(value) <= 0) {
        setError("Invalid payment amount. Please contact support.");
        return;
      }

      setIsPaying(true);
      setError(null);

      // Store pending booking data in localStorage
      const bookingData = {
        userData,
        eventId: event.id,
        amount: value,
        eventTitle: event.title,
        timestamp: Date.now()
      };
      
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      
      // Create URL parameters for PayPal redirect
      const params = new URLSearchParams({
        // This is normally your PayPal business email or merchant ID
        // Replace with your actual PayPal business email in production
        business: 'urbanphotohunts.roma@gmail.com', 
        cmd: '_xclick',
        item_name: `Booking for ${event.title}`,
        item_number: event.id,
        amount: value,
        currency_code: 'EUR',
        // Include return URLs (must be absolute URLs)
        return: `${window.location.origin}${window.location.pathname}#/?payment-success=true`,
        cancel_return: `${window.location.origin}${window.location.pathname}#/?payment-cancelled=true`,
        // Include user ID in custom field for reference
        custom: userData.userId,
        // No shipping needed
        no_shipping: '1',
        // Don't show a note field
        no_note: '1'
      });
      
      // Redirect to PayPal
      // Use sandbox URL for testing, change to www.paypal.com for production
      window.location.href = `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
      
    } catch (error) {
      console.error("Payment error:", error);
      setError(`Payment setup failed: ${error.message || "Unknown error"}`);
      setIsPaying(false);
    }
  };

  return (
    <div style={modalStyle}>
      <div style={modalContentStyle}>
        <h2 className="text-xl font-bold mb-4">
          Payment for {event?.title}
        </h2>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4">
          <p className="mb-2"><strong>Event:</strong> {event?.title}</p>
          <p className="mb-2"><strong>Date:</strong> {event?.date}</p>
          <p className="mb-2"><strong>Time:</strong> {event?.time}</p>
          <p className="mb-2"><strong>Amount:</strong> €{amount}</p>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          {isPaying ? (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Redirecting to PayPal...</p>
            </div>
          ) : (
            <button
              onClick={handlePayNowClick}
              disabled={isPaying}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Pay with PayPal
            </button>
          )}
        </div>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Your payment is processed securely by PayPal</p>
          <p className="mt-1 text-xs">You will be redirected to PayPal to complete your payment</p>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
import { useState, useEffect, useRef } from 'react';

function PaymentModal({ isOpen, onClose, event, userData, onPaymentSuccess, onPaymentCancel }) {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const paypalButtonsRef = useRef(null);

  // Safe fallback for amount
  const amount = event?.paymentAmount !== undefined && event?.paymentAmount !== null
    ? event.paymentAmount
    : 10;

  if (!isOpen) return null;

  // Load PayPal JavaScript SDK
  useEffect(() => {
    // Clean up any existing PayPal button container
    if (paypalButtonsRef.current) {
      paypalButtonsRef.current.innerHTML = '';
    }

    if (!window.paypal && !document.querySelector('script[src*="paypal"]')) {
      const script = document.createElement('script');
      // Use your PayPal client ID from environment variables
      script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test'}&currency=EUR`;
      script.async = true;
      script.onload = () => setPaypalLoaded(true);
      document.body.appendChild(script);
      
      return () => {
        // Only remove if this component added it
        if (script.parentNode) {
          document.body.removeChild(script);
        }
      };
    } else if (window.paypal) {
      setPaypalLoaded(true);
    }
  }, [isOpen]);

  // Initialize PayPal buttons when SDK is loaded
  useEffect(() => {
    if (paypalLoaded && window.paypal && paypalButtonsRef.current) {
      // Clear previous buttons
      paypalButtonsRef.current.innerHTML = '';
      
      const orderId = `order_${Date.now()}_${event.id.substring(0, 8)}_${userData.userId.substring(0, 8)}`;
      
      // Store pending booking data
      const bookingData = {
        userData,
        eventId: event.id,
        amount: amount,
        eventTitle: event.title,
        timestamp: Date.now(),
        orderId
      };
      
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      
      // Render PayPal buttons
      window.paypal.Buttons({
        // Style the buttons
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay'
        },
        
        // Create order
        createOrder: function(data, actions) {
          return actions.order.create({
            purchase_units: [{
              description: `Booking for ${event.title}`,
              custom_id: userData.userId,
              invoice_id: orderId,
              amount: {
                value: amount.toString(),
                currency_code: 'EUR'
              }
            }]
          });
        },
        
        // Handle approval
        onApprove: function(data, actions) {
          setIsPaying(true);
          
          return actions.order.capture().then(function(details) {
            console.log('Payment approved:', details);
            
            // Create payment details object for passing to callbacks
            const paymentDetails = {
              paymentId: details.id,
              payerId: details.payer.payer_id,
              payerEmail: details.payer.email_address,
              status: 'COMPLETED',
              amount: amount,
              currency: 'EUR',
              createTime: details.create_time,
              updateTime: details.update_time,
              orderId: orderId
            };
            
            // Create payment record
            try {
              // Only try to save the payment record if needed, but don't wait for it
              import('../../firebase/paypalServices').then(({ savePaymentRecord }) => {
                savePaymentRecord({
                  paymentId: details.id,
                  payerId: details.payer.payer_id,
                  amount: amount,
                  currency: 'EUR',
                  status: 'COMPLETED',
                  eventId: event.id,
                  userId: userData.userId,
                  orderId: orderId,
                  payerEmail: details.payer.email_address || '',
                  // No bookingId at this point - it will be created in onPaymentSuccess
                  fullDetails: details
                }).catch(err => console.warn("Pre-creating payment record failed:", err));
              }).catch(err => console.warn("Could not import paypalServices:", err));
            } catch (error) {
              console.warn("Could not create preliminary payment record:", error);
              // Continue anyway since onPaymentSuccess will handle the main booking process
            }
            
            // Call success callback with payment details
            if (onPaymentSuccess) {
              onPaymentSuccess({
                paymentDetails
              });
            }
            
            setIsPaying(false);
          });
        },
        
        // Handle cancellation
        onCancel: function() {
          console.log('Payment cancelled by user');
          
          if (onPaymentCancel) {
            onPaymentCancel();
          }
        },
        
        // Handle errors
        onError: function(err) {
          console.error('PayPal payment error:', err);
          setError(`Payment error: ${err.message || 'Unknown error'}`);
        }
      }).render(paypalButtonsRef.current);
    }
  }, [paypalLoaded, event, userData, amount, onPaymentSuccess, onPaymentCancel]);

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

        {isPaying ? (
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Processing payment...</p>
          </div>
        ) : (
          <div id="paypal-button-container" ref={paypalButtonsRef} className="mb-4"></div>
        )}

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Your payment is processed securely by PayPal</p>
          <p className="mt-1 text-xs">You can pay with PayPal or credit card without a PayPal account</p>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
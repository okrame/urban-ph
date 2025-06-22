// Utility functions for booking celebrations and visual states

/**
 * Get CSS classes for event card based on booking status
 * @param {boolean} isBooked - Whether the event is booked
 * @param {string} bookingStatus - Current booking status
 * @param {boolean} showModal - Whether any modal is currently showing
 * @returns {string} CSS classes string
 */
export const getEventCardClasses = (isBooked, bookingStatus, showModal = false) => {
  let baseClasses = "bg-white overflow-hidden transition-all duration-700 ease-in-out";
  
  const isEventBooked = isBooked && bookingStatus !== 'cancelled';
  const shouldShowBookedState = isEventBooked && !showModal;
  
  if (shouldShowBookedState) {
    // Apply reduced opacity and saturation for booked events
    baseClasses += " opacity-60 saturate-50 grayscale-[0.2]";
  }
  
  return baseClasses;
};

/**
 * Get animation props for event card based on booking status
 * @param {boolean} isBooked - Whether the event is booked
 * @param {string} bookingStatus - Current booking status
 * @param {boolean} showModal - Whether any modal is currently showing
 * @returns {object} Motion animation props
 */
export const getEventCardAnimationProps = (isBooked, bookingStatus, showModal = false) => {
  const isEventBooked = isBooked && bookingStatus !== 'cancelled';
  const shouldShowBookedState = isEventBooked && !showModal;
  
  return {
    initial: { opacity: shouldShowBookedState ? 0.6 : 1 },
    animate: { 
      opacity: shouldShowBookedState ? 0.6 : 1,
      filter: shouldShowBookedState 
        ? "saturate(0.5) grayscale(0.2)" 
        : "saturate(1) grayscale(0)"
    },
    transition: { duration: 0.7, ease: "easeInOut" }
  };
};

/**
 * Create a celebration trigger function
 * @param {function} setShowCelebration - State setter for showing celebration
 * @param {function} setCelebrationMessage - State setter for celebration message
 * @returns {function} Trigger function that accepts a message
 */
export const createCelebrationTrigger = (setShowCelebration, setCelebrationMessage) => {
  return (message = 'Success!') => {
    setCelebrationMessage(message);
    setShowCelebration(true);
  };
};

/**
 * Different celebration messages for different booking scenarios
 */
export const CELEBRATION_MESSAGES = {
  BOOKING_CONFIRMED: 'Booking Confirmed!',
  PAYMENT_SUCCESSFUL: 'Payment Successful!',
  MEMBERSHIP_RENEWED: 'Membership Renewed!',
  EVENT_REGISTERED: 'Successfully Registered!',
  WAITLIST_JOINED: 'Added to Waitlist!',
  BOOKING_UPDATED: 'Booking Updated!'
};

/**
 * Get appropriate celebration message based on context
 * @param {boolean} hasPayment - Whether payment was involved
 * @param {boolean} isMembership - Whether this is a membership action
 * @param {boolean} isWaitlist - Whether user joined waitlist
 * @returns {string} Appropriate celebration message
 */
export const getCelebrationMessage = (hasPayment = false, isMembership = false, isWaitlist = false) => {
  if (isWaitlist) return CELEBRATION_MESSAGES.WAITLIST_JOINED;
  if (isMembership) return CELEBRATION_MESSAGES.MEMBERSHIP_RENEWED;
  if (hasPayment) return CELEBRATION_MESSAGES.PAYMENT_SUCCESSFUL;
  return CELEBRATION_MESSAGES.BOOKING_CONFIRMED;
};

/**
 * Custom hook for managing celebration state
 * @returns {object} Celebration state and handlers
 */
export const useCelebration = () => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  
  const triggerCelebration = createCelebrationTrigger(setShowCelebration, setCelebrationMessage);
  
  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    setCelebrationMessage('');
  };
  
  return {
    showCelebration,
    celebrationMessage,
    triggerCelebration,
    handleCelebrationComplete
  };
};

/**
 * Debounced celebration trigger to prevent multiple rapid celebrations
 * @param {function} triggerFn - The celebration trigger function
 * @param {number} delay - Delay in milliseconds (default: 1000)
 * @returns {function} Debounced trigger function
 */
export const createDebouncedCelebration = (triggerFn, delay = 1000) => {
  let timeoutId;
  
  return (message) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      triggerFn(message);
    }, delay);
  };
};
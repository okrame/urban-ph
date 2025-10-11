// hooks/useEventCardState.js
import { useState, useEffect, useRef } from 'react';
import { 
  checkUserBooking, 
  determineEventStatus, 
  isEventBookable, 
  getUserContactInfo,
  checkUserBookingRequirements 
} from '../../firebase/firestoreServices';
import { getUserProfile } from '../../firebase/userServices';

export const useEventCardState = (event, user) => {
  // Booking states
  const [isBooked, setIsBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('none');
  
  // Event states
  const [eventStatus, setEventStatus] = useState('');
  const [isBookable, setIsBookable] = useState(true);
  const [bookableReason, setBookableReason] = useState('');
  
  // UI states
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // User & payment states
  const [userMembershipStatus, setUserMembershipStatus] = useState(null);
  const [applicablePrice, setApplicablePrice] = useState(0);
  const [bookingFormData, setBookingFormData] = useState(null);
  const [isFirstTimeBooking, setIsFirstTimeBooking] = useState(false);
  const [existingUserData, setExistingUserData] = useState({});
  
  // Animation states
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [cardVisible, setCardVisible] = useState(false);
  const [roughAnimationsReady, setRoughAnimationsReady] = useState(false);
  const [annotationTrigger, setAnnotationTrigger] = useState(0);
  const [allowRoughAnimations, setAllowRoughAnimations] = useState(true);
  const [bookingJustCompleted, setBookingJustCompleted] = useState(false);
  const [layoutStable, setLayoutStable] = useState(true);
  
  // Auth states
  const [prevUserState, setPrevUserState] = useState(null);
  const [authRequested, setAuthRequested] = useState(false);
  
  // Layout states
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef(null);
  const cardRef = useRef(null);

  // Effect to check booking status
  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!user || !event.id) {
        setIsBooked(false);
        setBookingSuccess(false);
        setBookingStatus('none');
        return;
      }

      try {
        const { isBooked: hasBooking, status } = await checkUserBooking(user.uid, event.id, true);

        if (hasBooking && status !== 'cancelled') {
          setIsBooked(true);
          setBookingSuccess(true);
          setBookingStatus(status || 'confirmed');
        } else {
          setIsBooked(false);
          setBookingSuccess(false);
          setBookingStatus(status || 'none');
        }
      } catch (error) {
        console.error("Error checking booking status:", error);
        setIsBooked(false);
        setBookingSuccess(false);
        setBookingStatus('none');
      }
    };

    checkBookingStatus();
  }, [user, event.id]);

  // Effect to check event status and bookability
  useEffect(() => {
    if (event) {
      const status = determineEventStatus(event.date, event.time);
      setEventStatus(status);
      setImageError(false);

      const checkBookability = async () => {
        try {
          const { bookable, reason } = await isEventBookable(event.id);
          setIsBookable(bookable);
          setBookableReason(reason || '');
        } catch (error) {
          console.error("Error checking event bookability:", error);
          setIsBookable(false);
          setBookableReason("Error checking event status");
        }
      };

      checkBookability();
    }
  }, [event]);

  // Effect to check membership status and pricing
  useEffect(() => {
    const checkMembershipStatus = async () => {
      if (user && event) {
        try {
          const userProfile = await getUserProfile(user.uid);
          const isMember = userProfile?.currentYearMember || false;
          setUserMembershipStatus(isMember);

          const isPaidEvent = event.memberPrice !== null && event.nonMemberPrice !== null;

          if (isPaidEvent) {
            setApplicablePrice(isMember ? event.memberPrice : event.nonMemberPrice);
          } else if (event.paymentAmount) {
            setApplicablePrice(event.paymentAmount);
          } else {
            setApplicablePrice(0);
          }
        } catch (error) {
          console.error('Error checking membership status:', error);
          setUserMembershipStatus(false);
          const isPaidEvent = event.memberPrice !== null && event.nonMemberPrice !== null;
          setApplicablePrice(isPaidEvent ? event.nonMemberPrice : (event.paymentAmount || 0));
        }
      } else {
        setUserMembershipStatus(null);
        const isPaidEvent = event.memberPrice !== null && event.nonMemberPrice !== null;
        setApplicablePrice(isPaidEvent ? event.nonMemberPrice : (event.paymentAmount || 0));
      }
    };

    checkMembershipStatus();
  }, [user, event]);

  // Reset states when user changes
  useEffect(() => {
    setIsBooked(false);
    setBookingSuccess(false);
    setAuthError(null);
    setShowBookingForm(false);
    setShowPaymentModal(false);
    setBookingStatus('none');
  }, [user]);

  // Effect to measure content height - wait for images to load
  useEffect(() => {
    if (showFullDescription && contentRef.current) {
      // Reset layout stable state when expanding
      setLayoutStable(false);
      
      const measureHeight = () => {
        const height = contentRef.current.scrollHeight;
        setContentHeight(height);
        // Mark layout as stable after measurement
        setTimeout(() => setLayoutStable(true), 150);
      };
      
      // Wait for all images in the content to load
      const images = contentRef.current.querySelectorAll('img');
      
      if (images.length > 0) {
        let loadedCount = 0;
        const totalImages = images.length;
        
        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            // All images loaded, measure final height
            setTimeout(measureHeight, 50);
          }
        };
        
        images.forEach(img => {
          if (img.complete) {
            checkAllLoaded();
          } else {
            img.addEventListener('load', checkAllLoaded);
            img.addEventListener('error', checkAllLoaded);
          }
        });
      } else {
        // No images, measure immediately and mark as stable
        measureHeight();
      }
    } else {
      setContentHeight(0);
      setLayoutStable(true); // Reset to stable when collapsed
    }
  }, [showFullDescription, event.description]);

  return {
    // States
    isBooked, setIsBooked,
    loading, setLoading,
    showBookingForm, setShowBookingForm,
    showPaymentModal, setShowPaymentModal,
    authError, setAuthError,
    bookingSuccess, setBookingSuccess,
    bookingStatus, setBookingStatus,
    eventStatus,
    isBookable,
    bookableReason,
    showFullDescription, setShowFullDescription,
    imageError, setImageError,
    userMembershipStatus,
    applicablePrice,
    bookingFormData, setBookingFormData,
    isFirstTimeBooking, setIsFirstTimeBooking,
    existingUserData, setExistingUserData,
    shouldAnimate, setShouldAnimate,
    cardVisible, setCardVisible,
    roughAnimationsReady, setRoughAnimationsReady,
    annotationTrigger, setAnnotationTrigger,
    allowRoughAnimations, setAllowRoughAnimations,
    bookingJustCompleted, setBookingJustCompleted,
    prevUserState, setPrevUserState,
    authRequested, setAuthRequested,
    contentHeight,
    layoutStable,
    
    // Refs
    contentRef,
    cardRef
  };
};
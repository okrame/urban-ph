// hooks/useEventCardHandlers.js
import { bookEventSimple, isEventBookable, getUserContactInfo } from '../../firebase/firestoreServices';

export const useEventCardHandlers = ({
  event,
  user,
  onAuthNeeded,
  isBookable,
  bookableReason,
  isBooked,
  bookingStatus,
  applicablePrice,
  bookingFormData, // Add this parameter
  setLoading,
  setAuthError,
  setAuthRequested,
  setIsFirstTimeBooking,
  setExistingUserData,
  setShowBookingForm,
  setBookingFormData,
  setShowPaymentModal,
  setIsBooked,
  setBookingSuccess,
  setBookingStatus,
  setShouldAnimate,
  setAllowRoughAnimations,
  setBookingJustCompleted,
  setAnnotationTrigger,
  setImageError
}) => {

  const handleBookEvent = async () => {
    setAuthError(null);

    if (!isBookable) {
      setAuthError(bookableReason);
      return;
    }

    if (!user) {
      if (onAuthNeeded) {
        setAuthRequested(true);
        onAuthNeeded();
      }
      return;
    }

    if (isBooked && bookingStatus !== 'cancelled') {
      setAuthError("You've already booked this event!");
      return;
    }

    try {
      setLoading(true);

      const { checkUserBookingRequirements } = await import('../../firebase/firestoreServices');
      const requirements = await checkUserBookingRequirements(user.uid);

      setIsFirstTimeBooking(requirements.needsPersonalDetails);

      if (requirements.needsPersonalDetails) {
        if (requirements.isFirstTime) {
          setExistingUserData(requirements.existingData || {});
        } else {
          setExistingUserData({
            ...requirements.existingData,
            email: requirements.existingData.email || user.email || '',
            phone: ''
          });

          const contactInfo = await getUserContactInfo(user.uid);
          if (contactInfo) {
            setExistingUserData(prev => ({
              ...prev,
              email: contactInfo.email || prev.email,
              phone: contactInfo.phone || ''
            }));
          }
        }
      } else {
        const contactInfo = await getUserContactInfo(user.uid);
        setExistingUserData({
          ...requirements.existingData,
          email: contactInfo?.email || requirements.existingData.email || user.email || '',
          phone: contactInfo?.phone || ''
        });
      }
    } catch (error) {
      console.error("Error checking booking requirements:", error);
      setAuthError("Error checking user information. Please try again.");
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }

    setShowBookingForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setAuthError(null);

    try {
      const { bookable, reason } = await isEventBookable(event.id);
      if (!bookable) {
        setAuthError(reason);
        setLoading(false);
        return { success: false, message: reason };
      }

      const userData = {
        userId: user.uid,
        email: formData.email,
        phone: formData.phone,
        displayName: user.displayName || null,
        name: formData.name,
        surname: formData.surname,
        birthDate: formData.birthDate,
        address: formData.address,
        taxId: formData.taxId,
        instagram: formData.instagram,
        requests: formData.requests
      };

      setBookingFormData(userData);

      const isPaidEvent = event.memberPrice !== null && event.nonMemberPrice !== null;
      const requiresPayment = isPaidEvent && applicablePrice > 0;

      if (requiresPayment) {
        setShowBookingForm(false);
        setShowPaymentModal(true);
        return { success: true, requiresPayment: true }; // Return success but payment required
      } else {
        const result = await bookEventSimple(event.id, userData);

        if (result.success) {
          setIsBooked(true);
          setBookingSuccess(true);
          setBookingStatus('confirmed');
          setShowBookingForm(false);
          setShouldAnimate(false);
          setAllowRoughAnimations(true);
          setBookingJustCompleted(true);

          setTimeout(() => {
            setBookingJustCompleted(false);
            setAnnotationTrigger(prev => prev + 1);
          }, 300);

          return { success: true, requiresPayment: false }; // Return success for celebration
        } else {
          setAuthError(result.message || "Booking failed. Please try again.");
          return { success: false, message: result.message || "Booking failed. Please try again." };
        }
      }
    } catch (error) {
      console.error("Error preparing for booking:", error);
      setAuthError("An error occurred. Please try again.");
      return { success: false, message: "An error occurred. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  // E aggiorna anche handlePaymentSuccess per restituire il risultato:

  const handlePaymentSuccess = async (paymentData) => {
    setLoading(true);
    setAuthError(null);

    try {
      console.log("Payment approved:", paymentData);

      // Check if we have booking form data
      if (!bookingFormData) {
        throw new Error("Booking form data is missing. Please try booking again.");
      }

      const sanitizedPaymentDetails = {
        paymentId: paymentData.paymentDetails?.paymentId || paymentData.id || '',
        payerID: paymentData.paymentDetails?.payerID || paymentData.payer?.payer_id || null,
        payerEmail: paymentData.paymentDetails?.payerEmail || paymentData.payer?.email_address || '',
        status: 'COMPLETED',
        amount: applicablePrice,
        currency: event.paymentCurrency || 'EUR',
        createTime: paymentData.paymentDetails?.createTime || paymentData.create_time || new Date().toISOString(),
        updateTime: paymentData.paymentDetails?.updateTime || paymentData.update_time || new Date().toISOString(),
        orderId: paymentData.paymentDetails?.orderId || paymentData.id || null
      };

      const result = await bookEventSimple(event.id, {
        ...bookingFormData,
        paymentDetails: sanitizedPaymentDetails
      });

      if (result && result.success) {
        setIsBooked(true);
        setBookingSuccess(true);
        setBookingStatus('confirmed');
        setShowPaymentModal(false);
        setShouldAnimate(false);
        setAllowRoughAnimations(true);
        setBookingJustCompleted(true);

        setTimeout(() => {
          setBookingJustCompleted(false);
          setAnnotationTrigger(prev => prev + 1);
        }, 500);

        return { success: true }; // Return success for celebration
      } else {
        throw new Error(result.message || "Unknown error during booking");
      }
    } catch (error) {
      console.error("Error completing booking:", error);
      setAuthError("An error occurred during booking. Please contact support with your payment ID.");
      return { success: false, message: "An error occurred during booking" };
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setAuthError("Payment was cancelled.");
  };

  const handleCancelForm = () => {
    setShowBookingForm(false);
    setAuthError(null);
    setShouldAnimate(false);
    setAllowRoughAnimations(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return {
    handleBookEvent,
    handleFormSubmit,
    handlePaymentSuccess,
    handlePaymentCancel,
    handleCancelForm,
    handleImageError
  };
};
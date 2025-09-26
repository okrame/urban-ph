import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useComponentText } from '../hooks/useText';


// Traduzioni del componente
const BOOKING_TRANSLATIONS = {
  // Titoli e intestazioni
  formTitleMembership: {
    it: "Iscrizione",
    en: "Membership for",
  },
  formTitleRenew: {
    it: "Rinnovo Iscrizione",
    en: "Renew Membership for",
  },
  formTitleEvent: {
    it: "Dettagli Evento",
    en: "Event Details",
  },
  formTitleBooking: {
    it: "Dettagli Prenotazione",
    en: "Booking Details",
  },

  // Messaggi introduttivi
  introWelcome: {
    it: "Benvenuto su Urban pH!",
    en: "Welcome to Urban pH!",
  },
  introRegister: {
    it: "Abbiamo bisogno di alcune info per registrarti per il {year}.",
    en: "We need some information to register you for {year}.",
  },
  introWelcomeBack: {
    it: "Bentornato, {email}!",
    en: "Welcome back, {email}!",
  },
  introConfirm: {
    it: "Conferma che i tuoi dati personali siano ancora corretti per {year}.",
    en: "Please confirm your personal details are still correct for {year}.",
  },
  introContact: {
    it: "Inserisci i tuoi contatti e eventuali richieste per questo evento.",
    en: "Please provide your contact details and any special requests for this event.",
  },
  introCheck: {
    it: "Controlla i tuoi dati di contatto per completare la prenotazione.",
    en: "Please check your contact details to complete your booking.",
  },

  // Avvisi prenotazione
  alreadyBookedTitle: {
    it: "⚠️ Ops! Hai già prenotato questo evento",
    en: "⚠️ Oops! It looks like you have already booked this one",
  },
  alreadyBookedDesc: {
    it: "Controlla la tua email per i dettagli di conferma. Per modifiche contattaci direttamente.",
    en: "Please check your email for confirmation details. If you need to make changes, please contact us directly.",
  },
  // Pagamenti
  paymentNotice: {
    it: "Pagamento richiesto: €{amount} {currency}",
    en: "Payment required: €{amount} {currency}",
  },
  paymentRedirect: {
    it: "Sarai reindirizzato a una pagina di pagamento sicura dopo aver completato questo modulo.",
    en: "You'll be redirected to a secure payment page after completing this form.",
  },

  // Campi form
  name: { it: "Nome *", en: "Name *" },
  surname: { it: "Cognome *", en: "Surname *" },
  birthDate: { it: "Data di nascita *", en: "Birth Date *" },
  birthDateMax: { it: "(devi avere 18+)", en: "(must be 18+)" },
  address: { it: "Indirizzo *", en: "Street Address *" },
  country: { it: "Paese *", en: "Country *" },
  taxId: { it: "Codice Fiscale *", en: "ID Number/Tax ID *" },
  email: { it: "Email *", en: "Email Address *" },
  phone: { it: "Telefono *", en: "Phone Number *" },
  instagram: { it: "Nome Instagram (opzionale)", en: "Instagram Name (optional)" },
  requests: { it: "Richieste specifiche (opzionale)", en: "Any Specific Request (optional)" },

  // Placeholder
  placeholderAddress: { it: "Via, numero civico, città, CAP", en: "Street, number, city, zip code" },
  placeholderTaxId: { it: "16 caratteri", en: "ID characters" },
  placeholderEmail: { it: "tua@email.com", en: "your@email.com" },
  placeholderPhone: { it: "+39 123 456 7890", en: "+39 123 456 7890" },
  placeholderInstagram: { it: "tuoinstagram", en: "yourinstagram" },
  placeholderRequests: { it: "Eventuali esigenze o richieste...", en: "Any special requirements or requests..." },

  selectCountry: { it: "Seleziona un paese", en: "Select a country" },

  // Errori validazione
  errorName: { it: "Il nome è obbligatorio", en: "Name is required" },
  errorSurname: { it: "Il cognome è obbligatorio", en: "Surname is required" },
  errorBirthDate: { it: "La data di nascita è obbligatoria", en: "Birth date is required" },
  errorAddress: { it: "L’indirizzo è obbligatorio", en: "Home address is required" },
  errorCountry: { it: "Il paese è obbligatorio", en: "Country is required" },
  errorTaxId: { it: "Inserisci un Codice Fiscale valido (16 caratteri)", en: "Valid ID Number/Tax ID is required" },
  errorEmail: { it: "Inserisci un’email valida", en: "Please enter a valid email address" },
  errorPhone: { it: "Inserisci un numero di telefono valido", en: "Please enter a valid phone number" },
  errorPhoneDigits: { it: "Il numero deve avere almeno 8 cifre", en: "Please enter a valid phone number with at least 8 digits" },
  errorBooked: {
    it: "Hai già prenotato questo evento. Controlla la tua email per la conferma.",
    en: "You have already booked this event. Please check your email for confirmation.",
  },
  errorTermsPrivacy: {
    it: "Devi accettare termini e privacy per procedere",
    en: "You must accept the terms and conditions and privacy policy to proceed",
  },

  // Termini e Privacy
  terms: {
    it: "Accetto i ",
    en: "I accept the "
  },
  termsLink: {
    it: "Termini e Condizioni",
    en: "Terms and Conditions"
  },
  privacy: {
    it: "Acconsento al trattamento dei miei dati personali secondo la ",
    en: "I consent to the processing of my personal data as per the "
  },
  privacyLink: {
    it: "Privacy Policy",
    en: "Privacy Policy"
  },

  // Bottoni
  back: { it: "← Indietro", en: "← Back" },
  cancel: { it: "Annulla", en: "Cancel" },
  next: { it: "Avanti →", en: "Next →" },
  holdOn: { it: "Un attimo...", en: "Hold on..." },
  wait: { it: "Attendi...", en: "Wait..." },
  continuePayment: { it: "Vai al Pagamento", en: "Continue to Payment" },
  confirmBooking: { it: "Conferma Prenotazione", en: "Confirm Booking" },
  pay: { it: "Paga", en: "Pay" },
  book: { it: "Prenota", en: "Book" },
};


function BookingForm({ onSubmit, onCancel, loading, isFirstTime = false, existingData = {}, event,
  isBooked = false, bookingStatus = null, userEmail = null, eventCardRef = null }) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);

  // Form state
  const [name, setName] = useState(existingData.name || '');
  const [surname, setSurname] = useState(existingData.surname || '');
  const [email, setEmail] = useState(existingData.email || '');
  const [phone, setPhone] = useState(existingData.phone || '');
  const [birthDate, setBirthDate] = useState(existingData.birthDate || '');
  const [address, setAddress] = useState(existingData.address || '');
  const [taxId, setTaxId] = useState(existingData.taxId || '');
  const [instagram, setInstagram] = useState(existingData.instagram || '');
  const [requests, setRequests] = useState('');
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [country, setCountry] = useState('');
  const { t } = useComponentText(BOOKING_TRANSLATIONS);

  // Determine if we need pagination (first time or confirmation)
  const needsPagination = isFirstTime;
  const totalPages = needsPagination ? 2 : 1;

  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
    'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
    'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
    'Congo (Congo-Brazzaville)', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
    'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar (Burma)',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
    'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
    'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen',
    'Zambia', 'Zimbabwe'
  ].sort();

  // Format current date for max date validation
  const today = new Date().toISOString().split('T')[0];
  // Calculate minimum date (must be at least 18 years old)
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  const minDate = new Date(eighteenYearsAgo).toISOString().split('T')[0];

  // Lock body scroll when modal opens and unlock when it closes
  useEffect(() => {

    const currentEventCardRef = eventCardRef?.current;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;

    // FORZARE scroll to top in modo sincrono e aggressivo
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Lock body scroll SENZA offset (così il contenuto resta in cima)
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '0px';
    document.body.style.left = '0';
    document.body.style.right = '0';

    return () => {
      // Restore body scroll
      document.body.style.overflow = originalStyle;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.left = '';
      document.body.style.right = '';

      // Su mobile, scrolla alla cima dell'evento specifico
      if (currentEventCardRef) {
        setTimeout(() => {
          currentEventCardRef.scrollIntoView({
            behavior: 'instant',
            block: 'start'
          });
        }, 0);
      }
    };
  }, [eventCardRef]);


  // Pre-fill form data from existing data and reset page on mount
  useEffect(() => {
    setCurrentPage(1);
    setError('');
    setName(existingData.name || '');
    setSurname(existingData.surname || '');
    setEmail(existingData.email || '');
    setPhone(existingData.phone || '');
    setBirthDate(existingData.birthDate || '');

    // Extract country from existing address if present
    const existingAddress = existingData.address || '';
    const lastComma = existingAddress.lastIndexOf(',');
    if (lastComma !== -1) {
      const possibleCountry = existingAddress.substring(lastComma + 1).trim();
      if (countries.includes(possibleCountry)) {
        setAddress(existingAddress.substring(0, lastComma).trim());
        setCountry(possibleCountry);
      } else {
        setAddress(existingAddress);
        setCountry('');
      }
    } else {
      setAddress(existingAddress);
      setCountry('');
    }

    setTaxId(existingData.taxId || '');
    setInstagram(existingData.instagram || '');
    setRequests('');
    setAcceptTerms(false);
    setAcceptPrivacy(false);
  }, [existingData]);

  const getIntroMessage = () => {
    const currentYear = new Date().getFullYear();
    const hasPersonalDetails = existingData.name && existingData.surname && existingData.taxId;

    if (needsPagination && currentPage === 1) {
      if (isFirstTime && !hasPersonalDetails) {
        return (
          <>
            <strong>{t('introWelcome')}</strong>
            <br />
            {t('introRegister').replace('{year}', currentYear)}
          </>
        );
      } else if (isFirstTime && hasPersonalDetails) {
        return (
          <>
            <strong>{t('introWelcomeBack').replace('{email}', userEmail || '')}</strong>
            <br />
            {t('introConfirm').replace('{year}', currentYear)}
          </>
        );
      }
    } else if (needsPagination && currentPage === 2) {
      return t('introContact');
    } else {
      return t('introCheck');
    }
  };

  const validateTaxId = (id) => {
    if (!id) return false;
    const value = id.toUpperCase().trim();

    // Italian Codice Fiscale (16 alphanumeric chars with encoded rules)
    const italian = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;

    // UK National Insurance Number (e.g. AB123456C)
    const ukNino = /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/i;

    // US SSN (e.g. 123-45-6789) or EIN (12-3456789)
    const usSsn = /^\d{3}-\d{2}-\d{4}$/;
    const usEin = /^\d{2}-\d{7}$/;

    // Germany Steuer-ID (11 digits)
    const german = /^\d{11}$/;

    // France Numéro fiscal (13 digits, sometimes 14)
    const french = /^\d{13,14}$/;

    // General fallback: allow alphanumeric 6–20 chars
    const generic = /^[A-Z0-9]{6,20}$/i;

    return (
      italian.test(value) ||
      ukNino.test(value) ||
      usSsn.test(value) ||
      usEin.test(value) ||
      german.test(value) ||
      french.test(value) ||
      generic.test(value) // fallback
    );
  };

  const getFormTitle = () => {
    const currentYear = new Date().getFullYear();
    const hasPersonalDetails = existingData.name && existingData.surname && existingData.taxId;

    if (needsPagination) {
      if (currentPage === 1) {
        if (isFirstTime && hasPersonalDetails) {
          return `${t('formTitleRenew')} ${currentYear}`;
        } else if (isFirstTime) {
          return `${t('formTitleMembership')} ${currentYear}`;
        }
      } else {
        return t('formTitleEvent');
      }
    } else {
      return t('formTitleBooking');
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email ? regex.test(email) : false;
  };

  const validatePhone = (phone) => {
    // Allow various formats but ensure it has at least 8 digits
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 8;
  };

  const handleTaxIdChange = (e) => {
    // Always convert to uppercase
    setTaxId(e.target.value.toUpperCase());
  };

  const validateCurrentPage = () => {

    setError('');

    if (currentPage === 1 && needsPagination) {
      // Page 1: Personal details validation
      if (!name.trim()) {
        setError(t('errorName'));
        return false;
      }
      if (!surname.trim()) {
        setError(t('errorSurname'));
        return false;
      }
      if (!birthDate) {
        setError(t('errorBirthDate'));
        return false;
      }
      if (!address.trim()) {
        setError(t('errorAddress'));
        return false;
      }
      if (!country) {
        setError(t('errorCountry'));
        return false;
      }
      if (!taxId.trim() || !validateTaxId(taxId)) {
        setError(t('errorTaxId'));
        return false;
      }
    } else {
      // Page 2 with pagination OR single page: Contact details validation
      if (!email.trim() || !validateEmail(email)) {
        setError(t('errorEmail'));
        return false;
      }
      if (!phone.trim() || !validatePhone(phone)) {
        setError(t('errorPhone'));
        return false;
      }

      // Validate personal details ONLY if single page for first time users
      if (!needsPagination && isFirstTime) {
        if (!name.trim()) {
          setError(t('errorName'));
          return false;
        }
        if (!surname.trim()) {
          setError(t('errorSurname'));
          return false;
        }
        if (!birthDate) {
          setError(t('errorBirthDate'));
          return false;
        }
        if (!address.trim()) {
          setError(t('errorAddress'));
          return false;
        }
        if (!country) {
          setError(t('errorCountry'));
          return false;
        }
        if (!taxId.trim() || !validateTaxId(taxId)) {
          setError(t('errorTaxId'));
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    setIsNavigating(true);
    if (validateCurrentPage()) {
      setCurrentPage(currentPage + 1);
      setTimeout(() => setIsNavigating(false), 100);
    } else {
      setIsNavigating(false);
    }
  };

  const handlePrevious = () => {
    setError('');
    setCurrentPage(currentPage - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isNavigating) {
      return;
    }

    if (isBooked && bookingStatus !== 'cancelled') {
      setError(t('errorBooked'));
      return;
    }

    if (!validateCurrentPage()) {
      return;
    }

    // Check terms and privacy ONLY on final submit
    if (!acceptTerms || !acceptPrivacy) {
      setError(t('errorTermsPrivacy'));
      return;
    }

    // Submit the form data
    onSubmit({
      email,
      phone,
      name,
      surname,
      birthDate,
      address: country ? `${address}, ${country}` : address,
      taxId,
      instagram,
      requests,
      acceptTerms,
      acceptPrivacy
    });
  };

  // Prevent backdrop scroll on touch devices
  const handleBackdropTouchMove = (e) => {
    // Non usare preventDefault - invece blocca con CSS overflow
    e.stopPropagation();
  };

  // Allow scroll only inside modal content
  const handleModalContentTouchMove = (e) => {
    e.stopPropagation();
  };
  const isMobile = window.innerWidth < 768;
  const isShowingWarningOnly = isBooked && bookingStatus !== 'cancelled';


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: isMobile ? 'flex-start' : 'center',
        overflowY: 'auto',
        // Conditional padding based on content type
        paddingTop: isMobile
          ? (isShowingWarningOnly ? '35vh' : '10vh')  // Warning più in basso su mobile
          : (isShowingWarningOnly ? '15vh' : '0'),    // Warning più in basso su desktop
        paddingBottom: isMobile ? '10vh' : '0',
        padding: isMobile ? `${isShowingWarningOnly ? '35vh' : '10vh'} 16px 10vh 16px` : '16px'
      }}
      onTouchMove={handleBackdropTouchMove}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full shadow-2xl flex flex-col"
        style={{
          maxHeight: isMobile ? '80vh' : '90vh',
          margin: isMobile ? '0 auto' : 'auto'
        }}
        onTouchMove={handleModalContentTouchMove}
      >
        <div className="p-6 flex-1 overflow-y-auto" style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          {/* Header with title and close button */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-xl">{getFormTitle()}</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              type="button"
            >
              ×
            </button>
          </div>

          {isBooked && bookingStatus !== 'cancelled' && (
            <div className="mb-4 p-3 bg-[#FFFADE] border border-[#FFFADE] rounded-md">
              <p className="text-green-900 font-medium">
                {t('alreadyBookedTitle')}
              </p>
              <p className="text-sm text-[#3c6c64] mt-1">
                {t('alreadyBookedDesc')}
              </p>
              {/* Add a close button and return early */}
              <div className="mt-3 text-center">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-[#3c6c64] text-white rounded hover:bg-amber-700 text-sm"
                >
                  Ok
                </button>
              </div>
            </div>
          )}

          {/* if already booked, don't show the rest */}
          {isBooked && bookingStatus !== 'cancelled' ? null : (
            <>

              {/* Page indicator for paginated forms */}
              {needsPagination && (
                <div className="flex justify-center mb-4">
                  <div className="px-3 py-1 bg-[#3c6c64] rounded-full text-sm font-medium text-white">
                    {currentPage}/{totalPages}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600 mb-4">
                {getIntroMessage()}
              </p>

              {/* Payment notice */}
              {event?.paymentAmount > 0 && currentPage === totalPages && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="font-medium text-blue-700">
                    {t('paymentNotice')
                      .replace('{amount}', event.paymentAmount)
                      .replace('{currency}', event.paymentCurrency || 'EUR')}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {t('paymentRedirect')}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Page 1: Personal Details (only for first time users with pagination) */}
                {(currentPage === 1 && needsPagination) && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="name">
                          {t('name')}
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                          placeholder="Raffaella"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="surname">
                          {t('surname')}
                        </label>
                        <input
                          type="text"
                          id="surname"
                          value={surname}
                          onChange={(e) => setSurname(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                          placeholder="Domini"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="birthDate">
                        {t('birthDate')} <span className="text-xs text-gray-500">{t('birthDateMax')}</span>
                      </label>
                      <input
                        type="date"
                        id="birthDate"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        required
                        max={minDate}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="address">
                        {t('address')}
                      </label>
                      <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        required
                        placeholder={t('placeholderAddress')}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="country">
                        {t('country')}
                      </label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        required
                      >
                        <option value="">{t('selectCountry')}</option>
                        {countries.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="taxId">
                        {t('taxId')}
                      </label>
                      <input
                        type="text"
                        id="taxId"
                        value={taxId}
                        onChange={handleTaxIdChange}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${taxId && !validateTaxId(taxId) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        required
                        maxLength={16}
                        placeholder={t('placeholderTaxId')}
                      />
                      {taxId && !validateTaxId(taxId) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid ID Number (Codice Fiscale, NINO, SSN, EIN, Steuer-ID, etc.)
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Page 2 or Single Page: Contact Details and Event Info */}
                {(currentPage === 2 || !needsPagination) && (
                  <>
                    {/* Show personal details on single page for first time users */}
                    {!needsPagination && isFirstTime && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="name-single">
                              {t('name')}
                            </label>
                            <input
                              type="text"
                              id="name-single"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                              placeholder="Raffaella"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="surname-single">
                              {t('surname')}
                            </label>
                            <input
                              type="text"
                              id="surname-single"
                              value={surname}
                              onChange={(e) => setSurname(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                              placeholder="Domini"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="birthDate-single">
                            {t('birthDate')} <span className="text-xs text-gray-500">{t('birthDateMax')}</span>
                          </label>
                          <input
                            type="date"
                            id="birthDate-single"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            required
                            max={minDate}
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="address-single">
                            {t('address')}
                          </label>
                          <input
                            type="text"
                            id="address-single"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            required
                            placeholder="Street, number, city, zip code"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="country-single">
                            {t('country')}
                          </label>
                          <select
                            id="country-single"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            required
                          >
                            <option value="">{t('selectCountry')}</option>
                            {countries.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="taxId-single">
                            {t('taxId')}
                          </label>
                          <input
                            type="text"
                            id="taxId-single"
                            value={taxId}
                            onChange={handleTaxIdChange}
                            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${taxId && !validateTaxId(taxId) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            required
                            maxLength={16}
                            placeholder={t('placeholderTaxId')}
                          />
                          {taxId && !validateTaxId(taxId) && (
                            <p className="text-xs text-red-500 mt-1">
                              Please enter a valid Italian Codice Fiscale (16 characters)
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="email">
                        {t('email')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${email && !validateEmail(email) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder={t('placeholderEmail')}
                        required
                      />
                      {email && !validateEmail(email) && (
                        <p className="text-xs text-red-500 mt-1">
                          {t('errorEmail')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="phone">
                        {t('phone')}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${phone && !validatePhone(phone) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="+39 123 456 7890"
                        required
                      />
                      {phone && !validatePhone(phone) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid phone number with at least 8 digits
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-sm" htmlFor="instagram">
                        {t('instagram')}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-base pointer-events-none z-10">@</span>
                        <input
                          type="text"
                          id="instagram"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                          placeholder={t('placeholderInstagram')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="requests">
                        {t('requests')}
                      </label>
                      <textarea
                        id="requests"
                        value={requests}
                        onChange={(e) => setRequests(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        rows="3"
                        placeholder={t('placeholderRequests')}
                      />
                    </div>

                    {/* Terms and Privacy Policy checkboxes */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="acceptTerms"
                          checked={acceptTerms}
                          onChange={() => setAcceptTerms(!acceptTerms)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                        />
                        <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                           {t('terms')} <a
                            href="src/assets/termsandco.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:underline cursor-pointer"
                          >
                            {t('termsLink')}
                          </a> *
                        </label>
                      </div>
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="acceptPrivacy"
                          checked={acceptPrivacy}
                          onChange={() => setAcceptPrivacy(!acceptPrivacy)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                        />
                        <label htmlFor="acceptPrivacy" className="ml-2 block text-sm text-gray-700">
                          {t('privacy')} <a
                            href="src/assets/termsandco.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:underline cursor-pointer"
                          >
                            {t('privacyLink')}
                          </a> *
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-4">
                  <div className="flex space-x-1 sm:space-x-2">
                    {needsPagination && currentPage > 1 && (
                      <button
                        type="button"
                        onClick={handlePrevious}
                        className="px-3 py-2 sm:px-3 sm:py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs sm:text-sm"
                      >
                        {t('back')}
                      </button>
                    )}
                  </div>

                  <div className="flex space-x-1 sm:space-x-2">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-3 py-2 sm:px-3 sm:py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs sm:text-sm"
                    >
                      {t('cancel')}
                    </button>

                    {needsPagination && currentPage < totalPages ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-3 py-2 sm:px-4 sm:py-1.5 bg-[#3c6c64] text-white rounded hover:bg-[#5f8c85] text-xs sm:text-sm"
                      >
                        {t('next')}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-3 py-2 sm:px-4 sm:py-1.5 bg-[#3c6c64]  text-white rounded font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 ${loading ? 'opacity-50 cursor-wait' : 'hover:bg-[#5f8c85]'
                          }`}
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size={12} color="#ffffff" className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{t('holdOn')}</span>
                            <span className="sm:hidden">{t('wait')}</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">
                              {event?.paymentAmount > 0 ? t('continuePayment') : t('confirmBooking')}
                            </span>
                            <span className="sm:hidden font-bold">
                              {event?.paymentAmount > 0 ? t('pay') : t('book')}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingForm;
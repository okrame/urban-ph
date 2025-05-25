import { useState, useEffect } from 'react';

function BookingForm({ onSubmit, onCancel, loading, isFirstTime = false, existingData = {}, event }) {
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

  // Format current date for max date validation
  const today = new Date().toISOString().split('T')[0];
  // Calculate minimum date (must be at least 18 years old)
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  const minDate = new Date(eighteenYearsAgo).toISOString().split('T')[0];

  // Pre-fill form data from existing data
  useEffect(() => {
    setName(existingData.name || '');
    setSurname(existingData.surname || '');
    setEmail(existingData.email || '');
    setPhone(existingData.phone || '');
    setBirthDate(existingData.birthDate || '');
    setAddress(existingData.address || '');
    setTaxId(existingData.taxId || '');
    setInstagram(existingData.instagram || '');
  }, [existingData]);

  const getIntroMessage = () => {
    const currentYear = new Date().getFullYear();
    const hasPersonalDetails = existingData.name && existingData.surname && existingData.taxId;

    if (isFirstTime && !hasPersonalDetails) {
      return `Welcome to Urban pH! We need some information to register you for ${currentYear}.`;
    } else if (isFirstTime && hasPersonalDetails) {
      return `Welcome back Urban pH! Please confirm your personal details are still correct for ${currentYear}.`;
    } else {
      return "Please check your contact details to complete your booking.";
    }
  };

  const validateTaxId = (id) => {
    // Italian Codice Fiscale validation - basic format check
    const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
    return id ? regex.test(id.toUpperCase()) : false;
  };

  const getFormTitle = () => {
    const currentYear = new Date().getFullYear();
    const hasPersonalDetails = existingData.name && existingData.surname && existingData.taxId;

    if (isFirstTime && hasPersonalDetails) {
      return `Confirm Membership for ${currentYear}`;
    } else if (isFirstTime) {
      return `Membership for ${currentYear}`;
    } else {
      return "Booking Details";
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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Reset previous errors
    setError('');

    // Basic validation
    if (!email.trim() || !validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!phone.trim() || !validatePhone(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    // Only validate these fields if it's the user's first time
    if (isFirstTime) {
      if (!name.trim()) {
        setError('Name is required');
        return;
      }

      if (!surname.trim()) {
        setError('Surname is required');
        return;
      }

      if (!birthDate) {
        setError('Birth date is required');
        return;
      }

      if (!address.trim()) {
        setError('Home address is required');
        return;
      }

      if (!taxId.trim() || !validateTaxId(taxId)) {
        setError('Valid Tax ID/Codice Fiscale is required (16 characters)');
        return;
      }
    }

    // Require terms acceptance
    if (!acceptTerms || !acceptPrivacy) {
      setError('You must accept the terms and conditions and privacy policy to proceed');
      return;
    }

    // Submit the form data
    onSubmit({
      email,
      phone,
      name,
      surname,
      birthDate,
      address,
      taxId,
      instagram,
      requests,
      acceptTerms,
      acceptPrivacy
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg max-w-md mx-auto">
      <h3 className="font-semibold text-lg mb-2">{getFormTitle()}</h3>

      <p className="text-sm text-gray-600 mb-3">
        {getIntroMessage()}
      </p>

      {event?.paymentAmount > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="font-medium text-blue-700">
            Payment required: €{event.paymentAmount} {event.paymentCurrency || 'EUR'}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            You'll be redirected to a secure payment page after completing this form.
          </p>
        </div>
      )}

      {/* Add a notice for year confirmations */}
      {isFirstTime && existingData.name && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Please review and update your information if needed.</strong>
            This helps us keep our records current and ensures we can contact you about events.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isFirstTime && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="name">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  required={isFirstTime}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="surname">
                  Surname *
                </label>
                <input
                  type="text"
                  id="surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  required={isFirstTime}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="birthDate">
                Birth Date * <span className="text-xs text-gray-500">(must be 18+)</span>
              </label>
              <input
                type="date"
                id="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                required={isFirstTime}
                max={minDate}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="address">
                Home Address *
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                required={isFirstTime}
                placeholder="Street, number, city, zip code"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="taxId">
                Tax ID/Codice Fiscale *
              </label>
              <input
                type="text"
                id="taxId"
                value={taxId}
                onChange={handleTaxIdChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${taxId && !validateTaxId(taxId) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                required={isFirstTime}
                maxLength={16}
                placeholder="16 characters"
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
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${email && !validateEmail(email) ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            placeholder="your@email.com"
            required
          />
          {email && !validateEmail(email) && (
            <p className="text-xs text-red-500 mt-1">
              Please enter a valid email address
            </p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="phone">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${phone && !validatePhone(phone) ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="instagram">
            Instagram Name (optional)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">@</span>
            <input
              type="text"
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full pl-7 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="yourinstagram"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="requests">
            Any Specific Request (optional)
          </label>
          <textarea
            id="requests"
            value={requests}
            onChange={(e) => setRequests(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            rows="3"
            placeholder="Any special requirements or requests..."
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
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
              I accept the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a> *
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="acceptPrivacy"
              checked={acceptPrivacy}
              onChange={() => setAcceptPrivacy(!acceptPrivacy)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="acceptPrivacy" className="ml-2 block text-sm text-gray-700">
              I consent to the processing of my personal data as per the <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> *
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-1.5 bg-blue-600 text-white rounded font-medium text-sm ${loading ? 'opacity-50 cursor-wait' : 'hover:bg-blue-700'
              }`}
          >
            {loading ? 'Processing...' : event?.paymentAmount > 0 ? 'Continue to Payment' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookingForm;
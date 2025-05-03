import { useState, useEffect } from 'react';

function BookingForm({ onSubmit, onCancel, loading, isFirstTime = false, existingData = {} }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

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
      
      if (!taxId.trim()) {
        setError('Tax ID/Codice Fiscale is required');
        return;
      }
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
      requests
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg max-w-md mx-auto">
      {isFirstTime ? (
        <p className="text-sm text-gray-600 mb-3">
          First time you're joining us for an event! We need some data to register you up.
        </p>
      ) : (
        <p className="text-sm text-gray-600 mb-3">
          Please provide your contact details to complete your booking.
        </p>
      )}
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {isFirstTime && (
          <>
            <div className="mb-3">
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
            
            <div className="mb-3">
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
            
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="birthDate">
                Birth Date *
              </label>
              <input
                type="date"
                id="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                required={isFirstTime}
              />
            </div>
            
            <div className="mb-3">
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
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="taxId">
                Tax ID/Codice Fiscale *
              </label>
              <input
                type="text"
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                required={isFirstTime}
                maxLength={16}
              />
            </div>
          </>
        )}
        
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="email">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="phone">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            placeholder="+1 (555) 123-4567"
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="instagram">
            Instagram Name (optional)
          </label>
          <input
            type="text"
            id="instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            placeholder="@yourinstagram"
          />
        </div>
        
        <div className="mb-4">
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
            className={`px-3 py-1.5 bg-blue-600 text-white rounded font-medium text-sm ${
              loading ? 'opacity-50 cursor-wait' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookingForm;
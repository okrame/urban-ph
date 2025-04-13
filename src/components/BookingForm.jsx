import { useState } from 'react';

function BookingForm({ onSubmit, onCancel, loading }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
    
    // Submit the form data
    onSubmit({ email, phone });
  };

  return (
    <div className="bg-white p-4 rounded-lg max-w-md mx-auto">
      <p className="text-sm text-gray-600 mb-3">Please provide your contact details to complete your booking.</p>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="email">
            Email Address
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
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="phone">
            Phone Number
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
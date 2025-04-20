import { useState, useEffect } from 'react';
import { createNewEvent } from '../../firebase/adminServices';
import { getEventBookingsCount, determineEventStatus } from '../../firebase/firestoreServices';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

function EventForm({ onSuccess, onCancel, initialValues = {} }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'hunt',
    date: '',
    time: '',
    location: '',
    description: '',
    spots: 10,
    image: '',
    status: 'active',
    ...initialValues
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingsCount, setBookingsCount] = useState(0);
  const [calculatedStatus, setCalculatedStatus] = useState('');

  useEffect(() => {
    // Update form when initialValues changes
    setFormData({
      title: '',
      type: 'hunt',
      date: '',
      time: '',
      location: '',
      description: '',
      spots: 10,
      image: '',
      status: 'active',
      ...initialValues
    });

    // If editing an existing event, fetch bookings count
    const fetchBookingsCount = async () => {
      if (initialValues.id) {
        try {
          const count = await getEventBookingsCount(initialValues.id);
          setBookingsCount(count);

          // Calculate actual status based on date/time
          if (initialValues.date && initialValues.time) {
            const status = determineEventStatus(initialValues.date, initialValues.time);
            setCalculatedStatus(status);
          }
        } catch (error) {
          console.error("Error fetching bookings count:", error);
        }
      } else {
        setBookingsCount(0);
        setCalculatedStatus('');
      }
    };

    fetchBookingsCount();
  }, [initialValues]);

  // Watch for date/time changes to update calculated status
  useEffect(() => {
    if (formData.date && formData.time) {
      const status = determineEventStatus(formData.date, formData.time);
      setCalculatedStatus(status);
    }
  }, [formData.date, formData.time]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for spots field
    if (name === 'spots') {
      const spotsValue = parseInt(value, 10);

      // When editing existing event, ensure spots is >= bookings count
      if (initialValues.id && spotsValue < bookingsCount) {
        setError(`Cannot set spots less than the number of current bookings (${bookingsCount})`);
        return;
      }

      setError(''); // Clear error if validation passes
    }

    setFormData({
      ...formData,
      [name]: name === 'spots' ? parseInt(value, 10) : value
    });
  };

  const validateDateFormat = (dateStr) => {
    // Format: Month DD, YYYY
    const dateRegex = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i;
    return dateRegex.test(dateStr);
  };

  const validateTimeFormat = (timeStr) => {
    // Format: H:MM AM/PM - H:MM AM/PM
    const timeRegex = /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/i;
    return timeRegex.test(timeStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate date and time formats
    if (!validateDateFormat(formData.date)) {
      setError('Date format must be "Month DD, YYYY" (e.g., "April 20, 2025")');
      setLoading(false);
      return;
    }

    if (!validateTimeFormat(formData.time)) {
      setError('Time format must be "H:MM AM/PM - H:MM AM/PM" (e.g., "6:00 PM - 9:00 PM")');
      setLoading(false);
      return;
    }

    // Ensure spots is at least equal to bookings count for existing events
    if (initialValues.id && formData.spots < bookingsCount) {
      setError(`Cannot set spots less than the number of current bookings (${bookingsCount})`);
      setLoading(false);
      return;
    }

    try {
      // Determine the actual status based on date/time
      const actualStatus = determineEventStatus(formData.date, formData.time);

      if (initialValues.id) {
        // Update existing event
        const eventRef = doc(db, 'events', initialValues.id);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
          throw new Error("Event not found");
        }

        // Keep existing spots availability data
        const currentData = eventDoc.data();

        // FIXED: Calculate spotsLeft correctly as total spots minus bookings
        // This ensures spotsLeft is always (total spots - bookings)
        const spotsLeft = formData.spots - bookingsCount;

        // Update event with new data but preserve some fields
        await updateDoc(eventRef, {
          ...formData,
          // Keep necessary fields from existing event
          status: actualStatus, // Override with calculated status
          spotsLeft: spotsLeft, // Correctly calculated available spots
          attendees: currentData.attendees || [],
          createdAt: currentData.createdAt,
          updatedAt: serverTimestamp()
        });

        console.log("Event updated successfully with status:", actualStatus);
      } else {
        // Create new event with calculated status
        await createNewEvent({
          ...formData,
          status: actualStatus, // Set the calculated status
          spotsLeft: formData.spots // Initialize spotsLeft equal to total spots (no bookings yet)
        });
        console.log("Event created successfully with status:", actualStatus);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving event:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">
        {initialValues.id ? 'Edit Event' : 'Create New Event'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Display calculated status message */}
      {calculatedStatus && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
          <p>This event will be saved with status: <strong>{calculatedStatus}</strong></p>
          <p className="text-sm mt-1">The status is automatically determined based on the date and time.</p>
        </div>
      )}

      {/* Display bookings info when editing */}
      {initialValues.id && bookingsCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
          <p>This event has <strong>{bookingsCount} bookings</strong>. The number of spots cannot be less than this.</p>
          {formData.spots > bookingsCount && (
            <p className="mt-1">After saving, there will be <strong>{formData.spots - bookingsCount} spots available</strong> for booking.</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="hunt">Photo Hunt</option>
              <option value="workshop">Workshop</option>
              <option value="exhibition">Exhibition</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date (format: Month DD, YYYY)
            </label>
            <input
              type="text"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${formData.date && !validateDateFormat(formData.date) ? 'border-red-500' : ''
                }`}
              placeholder="April 20, 2025"
              required
            />
            {formData.date && !validateDateFormat(formData.date) && (
              <p className="text-red-500 text-xs mt-1">
                Format must be "Month DD, YYYY", e.g., "April 20, 2025"
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time (format: H:MM AM/PM - H:MM AM/PM)
            </label>
            <input
              type="text"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${formData.time && !validateTimeFormat(formData.time) ? 'border-red-500' : ''
                }`}
              placeholder="6:00 PM - 9:00 PM"
              required
            />
            {formData.time && !validateTimeFormat(formData.time) && (
              <p className="text-red-500 text-xs mt-1">
                Format must be "H:MM AM/PM - H:MM AM/PM", e.g., "6:00 PM - 9:00 PM"
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Spots
            </label>
            <input
              type="number"
              name="spots"
              value={formData.spots}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min={initialValues.id ? bookingsCount : 1}
              required
            />
            {initialValues.id && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum: {bookingsCount} (current bookings)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status (Auto-determined)
            </label>
            <select
              name="status"
              value={calculatedStatus || formData.status}
              className="w-full p-2 border rounded bg-gray-100"
              disabled
              required
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="past">Past</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Status is automatically determined based on date and time
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="https://example.com/image.jpg"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="4"
            required
          ></textarea>
        </div>

        {formData.image && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image Preview
            </label>
            <img
              src={formData.image}
              alt="Event preview"
              className="h-40 object-cover rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
              }}
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Saving...' : initialValues.id ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EventForm;
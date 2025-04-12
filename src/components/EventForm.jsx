import { useState, useEffect } from 'react';
import { createNewEvent } from '../../firebase/adminServices';
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
  }, [initialValues]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'spots' ? parseInt(value, 10) : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (initialValues.id) {
        // Update existing event
        const eventRef = doc(db, 'events', initialValues.id);
        const eventDoc = await getDoc(eventRef);
        
        if (!eventDoc.exists()) {
          throw new Error("Event not found");
        }
        
        // Keep existing spots availability data
        const currentData = eventDoc.data();
        
        // Update event with new data but preserve some fields
        await updateDoc(eventRef, {
          ...formData,
          // Keep these fields from the existing event
          spotsLeft: currentData.spotsLeft,
          attendees: currentData.attendees || [],
          createdAt: currentData.createdAt,
          updatedAt: serverTimestamp()
        });
        
        console.log("Event updated successfully");
      } else {
        // Create new event
        await createNewEvent(formData);
        console.log("Event created successfully");
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
              className="w-full p-2 border rounded"
              placeholder="April 20, 2025"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="text"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="6:00 PM - 9:00 PM"
              required
            />
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
              Available Spots
            </label>
            <input
              type="number"
              name="spots"
              value={formData.spots}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
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
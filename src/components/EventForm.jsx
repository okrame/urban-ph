// src/components/EventForm.jsx
import { useState, useEffect, useRef } from 'react';
import { createNewEvent } from '../../firebase/adminServices';
import { getEventBookingsCount, determineEventStatus } from '../../firebase/firestoreServices';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ImageUploader from './ImageUploader';
import EmojiPicker from 'emoji-picker-react';
import MDEditor from '@uiw/react-md-editor';

function EventForm({ onSuccess, onCancel, initialValues = {} }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'hunt',
    date: '',
    time: '',
    location: '',
    venueName: '', // New field for custom venue name
    description: '',
    spots: 10,
    image: '',
    secondaryImage: '',
    status: 'active',
    // Updated payment fields for member pricing
    isPaid: initialValues.memberPrice !== undefined || initialValues.nonMemberPrice !== undefined ? true : false,
    memberPrice: initialValues.memberPrice !== undefined ? initialValues.memberPrice : 0,
    nonMemberPrice: initialValues.nonMemberPrice !== undefined ? initialValues.nonMemberPrice : 0,
    paymentCurrency: initialValues.paymentCurrency || 'EUR',
    ...initialValues
  });

  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(-1);
  const locationInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Date picker related state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Time picker related state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showStartAmPm, setShowStartAmPm] = useState('AM');
  const [showEndAmPm, setShowEndAmPm] = useState('AM');

  // Emoji picker related state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const descriptionRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const mdEditorRef = useRef(null);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingsCount, setBookingsCount] = useState(0);
  const [calculatedStatus, setCalculatedStatus] = useState('');
  const [isImageChanged, setIsImageChanged] = useState(false);

  // Image state for Storage
  const [imageUrl, setImageUrl] = useState(initialValues.image || '');
  const [secondaryImageUrl, setSecondaryImageUrl] = useState(initialValues.secondaryImage || '');

  // Location search function
  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    setLocationLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=IT`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();

      // Format suggestions for better display
      const suggestions = data.map(item => ({
        display_name: item.display_name,
        formatted: formatLocationDisplay(item),
        lat: item.lat,
        lon: item.lon,
        raw: item
      }));

      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(suggestions.length > 0);
      setSelectedLocationIndex(-1);
    } catch (error) {
      console.error('Error searching locations:', error);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    } finally {
      setLocationLoading(false);
    }
  };

  // Format location display for better readability
  const formatLocationDisplay = (location) => {
    const address = location.address || {};
    const parts = [];

    // Add specific place name if available
    if (address.amenity || address.shop || address.tourism) {
      parts.push(address.amenity || address.shop || address.tourism);
    }

    // Add street address
    if (address.house_number && address.road) {
      parts.push(`${address.road} ${address.house_number}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    // Add neighborhood/suburb
    if (address.suburb || address.neighbourhood) {
      parts.push(address.suburb || address.neighbourhood);
    }

    // Add city
    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village);
    }

    // Add province/state
    if (address.province || address.state) {
      parts.push(address.province || address.state);
    }

    return parts.slice(0, 3).join(', ') || location.display_name;
  };

  // Handle location input change with debouncing
  const handleLocationChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, location: value });

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300); // 300ms delay
  };

  // Handle location suggestion selection
  const handleLocationSelect = (suggestion) => {
    setFormData({
      ...formData,
      location: suggestion.formatted,
      venueName: extractVenueName(suggestion) // Auto-populate venue name from suggestion
    });
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    setSelectedLocationIndex(-1);

    // Focus back to input
    if (locationInputRef.current) {
      locationInputRef.current.focus();
    }
  };

  // Extract venue name from OpenStreetMap suggestion
  const extractVenueName = (suggestion) => {
    const address = suggestion.raw.address || {};

    // Priority order for venue names
    if (address.amenity) return address.amenity;
    if (address.shop) return address.shop;
    if (address.tourism) return address.tourism;
    if (address.leisure) return address.leisure;
    if (address.historic) return address.historic;
    if (address.building && address.building !== 'yes') return address.building;

    // If no specific venue name, use the formatted address
    return suggestion.formatted;
  };

  // Handle keyboard navigation for location suggestions
  const handleLocationKeyDown = (e) => {
    if (!showLocationSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedLocationIndex(prev =>
          prev < locationSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedLocationIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedLocationIndex >= 0 && locationSuggestions[selectedLocationIndex]) {
          handleLocationSelect(locationSuggestions[selectedLocationIndex]);
        }
        break;
      case 'Escape':
        setShowLocationSuggestions(false);
        setSelectedLocationIndex(-1);
        break;
    }
  };

  // Handle clicks outside location suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !locationInputRef.current.contains(event.target)
      ) {
        setShowLocationSuggestions(false);
        setSelectedLocationIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse and set initial date/time values
  useEffect(() => {
    // Update form when initialValues changes
    setFormData({
      title: '',
      type: 'hunt',
      date: '',
      time: '',
      location: '',
      venueName: '',
      description: '',
      spots: 10,
      image: '',
      secondaryImage: '',
      status: 'active',
      // Initialize payment fields with member pricing
      isPaid: initialValues.memberPrice !== undefined || initialValues.nonMemberPrice !== undefined ? true : false,
      memberPrice: initialValues.memberPrice !== undefined ? initialValues.memberPrice : 0,
      nonMemberPrice: initialValues.nonMemberPrice !== undefined ? initialValues.nonMemberPrice : 0,
      paymentCurrency: initialValues.paymentCurrency || 'EUR',
      ...initialValues
    });

    // Parse the date from initialValues if available
    if (initialValues.date) {
      const dateParts = initialValues.date.match(/(\w+)\s+(\d+),\s+(\d+)/);
      if (dateParts) {
        const month = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
          .indexOf(dateParts[1].toLowerCase());
        const day = parseInt(dateParts[2], 10);
        const year = parseInt(dateParts[3], 10);
        const dateObj = new Date(year, month, day);
        setSelectedDate(dateObj);
      }
    }

    // Parse the time from initialValues if available
    parseTimeFromInitialValues();

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

    // Reset image change tracking when form is initialized/reset
    setIsImageChanged(false);
    setImageUrl(initialValues.image || '');
  }, [initialValues]);

  // Handle clicking outside of emoji picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Watch for date/time changes to update calculated status
  useEffect(() => {
    if (formData.date && formData.time) {
      const status = determineEventStatus(formData.date, formData.time);
      setCalculatedStatus(status);
    }
  }, [formData.date, formData.time]);

  // Format date for display in the required format
  const formatDateForDisplay = (date) => {
    if (!date) return '';

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month} ${day}, ${year}`;
  };

  // Format time for display in the required format
  const formatTimeForDisplay = () => {
    if (!startTime || !endTime) return '';
    return `${startTime} ${showStartAmPm} - ${endTime} ${showEndAmPm}`;
  };

  // Update date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      date: formatDateForDisplay(date)
    });
    setShowDatePicker(false);
  };

  // Update time selection
  const handleTimeChange = () => {
    const formattedTime = formatTimeForDisplay();
    setFormData({
      ...formData,
      time: formattedTime
    });
  };

  // Helper function to parse time from initialValues
  const parseTimeFromInitialValues = () => {
    if (initialValues.time) {
      // Format: "H:MM AM/PM - H:MM AM/PM"
      const timeParts = initialValues.time.split('-');
      if (timeParts.length === 2) {
        const startPart = timeParts[0].trim();
        const endPart = timeParts[1].trim();

        // Parse start time
        const startMatch = startPart.match(/(\d+):(\d+)\s*([AP]M)/i);
        if (startMatch) {
          const hour = startMatch[1];
          const minute = startMatch[2];
          const ampm = startMatch[3].toUpperCase();
          setStartTime(`${hour}:${minute}`);
          setShowStartAmPm(ampm);
        }

        // Parse end time
        const endMatch = endPart.match(/(\d+):(\d+)\s*([AP]M)/i);
        if (endMatch) {
          const hour = endMatch[1];
          const minute = endMatch[2];
          const ampm = endMatch[3].toUpperCase();
          setEndTime(`${hour}:${minute}`);
          setShowEndAmPm(ampm);
        }
      }
    }
  };

  const handleStartAmPmChange = (e) => {
    setShowStartAmPm(e.target.value);
  };

  const handleEndAmPmChange = (e) => {
    setShowEndAmPm(e.target.value);
  };

  const applyTimeChanges = () => {
    handleTimeChange();
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji;

    // Get the actual textarea element from MDEditor
    const textarea = mdEditorRef.current?.querySelector('textarea');

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.description || '';

      // Insert emoji at cursor position
      const newDescription =
        text.substring(0, start) +
        emoji +
        text.substring(end);

      setFormData({
        ...formData,
        description: newDescription
      });

      // Restore focus and set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + emoji.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // Fallback: append at end if we can't find textarea
      setFormData({
        ...formData,
        description: formData.description + emoji
      });
    }

    setShowEmojiPicker(false);
  };

  // Toggle emoji picker visibility
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Handle paid event toggle
  const handlePaidToggle = (e) => {
    const isPaid = e.target.checked;
    setFormData({
      ...formData,
      isPaid,
      // Reset prices to 0 if toggling to free
      memberPrice: isPaid ? formData.memberPrice : 0,
      nonMemberPrice: isPaid ? formData.nonMemberPrice : 0
    });
  };

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

    // For description field, update cursor position
    if (name === 'description') {
      setCursorPosition(e.target.selectionStart);
    }

    // Special handling for payment amounts - allow 0 and empty values
    if (name === 'memberPrice' || name === 'nonMemberPrice') {
      // Allow empty string (user is typing)
      if (value === '') {
        setFormData({
          ...formData,
          [name]: ''
        });
        return;
      }

      const numValue = parseFloat(value);

      // For member price: allow 0 or positive numbers
      if (name === 'memberPrice') {
        if (isNaN(numValue) || numValue < 0) {
          return; // Don't update invalid amounts
        }
      }

      // For non-member price: allow 0 or positive numbers
      if (name === 'nonMemberPrice') {
        if (isNaN(numValue) || numValue < 0) {
          return; // Don't update invalid amounts
        }
      }

      // Update with the numeric value
      setFormData({
        ...formData,
        [name]: numValue
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: name === 'spots' ? parseFloat(value) : value
    });
  };

  // Handle image upload callback
  const handleImageUploaded = (url) => {
    setImageUrl(url);
    setIsImageChanged(true);
  };

  const handleSecondaryImageUploaded = (url) => {
    setSecondaryImageUrl(url);
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

    try {
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

      // Check if we have an image URL
      if (!imageUrl && !initialValues.id) {
        setError('Please upload an image');
        setLoading(false);
        return;
      }

      // Validate location - ensure it's not empty
      if (!formData.location.trim()) {
        setError('Please enter a valid location address');
        setLoading(false);
        return;
      }

      // Validate venue name - ensure it's not empty
      if (!formData.venueName.trim()) {
        setError('Please enter a venue name');
        setLoading(false);
        return;
      }

      if (formData.isPaid) {
        // Member price can be 0 or greater, but must be a valid number (not empty string)
        const memberPrice = typeof formData.memberPrice === 'string' ?
          parseFloat(formData.memberPrice) : formData.memberPrice;

        if (formData.memberPrice === '' || formData.memberPrice === null ||
          formData.memberPrice === undefined || isNaN(memberPrice) || memberPrice < 0) {
          setError('Please enter a valid member price (can be 0 for free member access)');
          setLoading(false);
          return;
        }

        // Non-member price can be 0 or greater
        const nonMemberPrice = typeof formData.nonMemberPrice === 'string' ?
          parseFloat(formData.nonMemberPrice) : formData.nonMemberPrice;

        if (formData.nonMemberPrice === '' || formData.nonMemberPrice === null ||
          formData.nonMemberPrice === undefined || isNaN(nonMemberPrice) || nonMemberPrice < 0) {
          setError('Please enter a valid non-member price (can be 0 for free access)');
          setLoading(false);
          return;
        }
      }

      // Prepare the form data
      let updatedFormData = {
        ...formData,
        // Set pricing fields only if isPaid is true, ensuring numbers are properly converted
        memberPrice: formData.isPaid ? (typeof formData.memberPrice === 'string' ? parseFloat(formData.memberPrice) : formData.memberPrice) : null,
        nonMemberPrice: formData.isPaid ? (typeof formData.nonMemberPrice === 'string' ? parseFloat(formData.nonMemberPrice) : formData.nonMemberPrice) : null,
        paymentCurrency: formData.isPaid ? formData.paymentCurrency : null,
        // Use uploaded image URL
        image: imageUrl,
        secondaryImage: secondaryImageUrl
      };

      // Remove isPaid as it's not needed in the database
      delete updatedFormData.isPaid;

      // Determine the actual status based on date/time
      const actualStatus = determineEventStatus(updatedFormData.date, updatedFormData.time);

      if (initialValues.id) {
        // Update existing event using updateEvent function
        const { updateEvent } = await import('../../firebase/adminServices');

        // Calculate spotsLeft correctly as total spots minus bookings
        const spotsLeft = updatedFormData.spots - bookingsCount;

        // If the image wasn't changed, keep the existing image URL
        if (!isImageChanged) {
          const eventRef = doc(db, 'events', initialValues.id);
          const eventDoc = await getDoc(eventRef);
          if (eventDoc.exists()) {
            const currentData = eventDoc.data();
            updatedFormData.image = currentData.image;
          }
        }

        await updateEvent(initialValues.id, {
          ...updatedFormData,
          status: actualStatus,
          spotsLeft: spotsLeft
        });

        console.log("Event updated successfully with status:", actualStatus);
      } else {
        // Create new event with calculated status
        await createNewEvent({
          ...updatedFormData,
          status: actualStatus,
          spotsLeft: updatedFormData.spots
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

  // Generate an array of dates for the date picker
  const getDaysArray = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Get current month/year for the date picker
  const currentDate = selectedDate || new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = getDaysArray(currentYear, currentMonth);

  // Get day of week for the first day of the month (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Month navigation for date picker
  const prevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    setSelectedDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    setSelectedDate(newDate);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
              <option value="walk">Walk</option>
            </select>
          </div>

          {/* Enhanced date picker */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="relative">
              <input
                type="text"
                name="date"
                value={formData.date}
                placeholder="Select a date"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full p-2 border rounded cursor-pointer bg-white"
                readOnly
                required
              />
              <span className="absolute right-2 top-2 text-gray-500">
                📅
              </span>
            </div>

            {/* Calendar date picker */}
            {showDatePicker && (
              <div className="absolute z-10 mt-1 bg-white border rounded-lg shadow-lg p-2 w-64">
                <div className="flex justify-between items-center mb-2">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    &lt;
                  </button>
                  <div className="font-medium">
                    {months[currentMonth]} {currentYear}
                  </div>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    &gt;
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
                  <div>Su</div>
                  <div>Mo</div>
                  <div>Tu</div>
                  <div>We</div>
                  <div>Th</div>
                  <div>Fr</div>
                  <div>Sa</div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Empty cells for days before the first day of the month */}
                  {Array(firstDayOfMonth).fill(null).map((_, index) => (
                    <div key={`empty-${index}`} className="h-8"></div>
                  ))}

                  {/* Calendar days */}
                  {daysInMonth.map((date, index) => {
                    const isSelected = selectedDate &&
                      date.getDate() === selectedDate.getDate() &&
                      date.getMonth() === selectedDate.getMonth() &&
                      date.getFullYear() === selectedDate.getFullYear();
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                      <button
                        key={`day-${index}`}
                        type="button"
                        onClick={() => handleDateSelect(date)}
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${isSelected
                          ? 'bg-blue-600 text-white'
                          : isToday
                            ? 'bg-blue-100 text-blue-800'
                            : 'hover:bg-gray-100'
                          }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Time picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <select
                  className="p-2 border rounded mr-1 w-20"
                  value={startTime.split(':')[0] || '12'}
                  onChange={(e) => {
                    const hour = e.target.value;
                    const mins = startTime.split(':')[1] || '00';
                    setStartTime(`${hour}:${mins}`);
                  }}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={`start-hour-${i + 1}`} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <span className="mx-1">:</span>
                <select
                  className="p-2 border rounded mr-1 w-20"
                  value={startTime.split(':')[1] || '00'}
                  onChange={(e) => {
                    const hour = startTime.split(':')[0] || '12';
                    setStartTime(`${hour}:${e.target.value}`);
                  }}
                >
                  {['00', '15', '30', '45'].map(min => (
                    <option key={`start-min-${min}`} value={min}>{min}</option>
                  ))}
                </select>
                <select
                  value={showStartAmPm}
                  onChange={handleStartAmPmChange}
                  className="border rounded p-2"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <div className="flex items-center">
                <select
                  className="p-2 border rounded mr-1 w-20"
                  value={endTime.split(':')[0] || '12'}
                  onChange={(e) => {
                    const hour = e.target.value;
                    const mins = endTime.split(':')[1] || '00';
                    setEndTime(`${hour}:${mins}`);
                  }}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={`end-hour-${i + 1}`} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <span className="mx-1">:</span>
                <select
                  className="p-2 border rounded mr-1 w-20"
                  value={endTime.split(':')[1] || '00'}
                  onChange={(e) => {
                    const hour = endTime.split(':')[0] || '12';
                    setEndTime(`${hour}:${e.target.value}`);
                  }}
                >
                  {['00', '15', '30', '45'].map(min => (
                    <option key={`end-min-${min}`} value={min}>{min}</option>
                  ))}
                </select>
                <select
                  value={showEndAmPm}
                  onChange={handleEndAmPmChange}
                  className="border rounded p-2"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div className="mt-1 flex justify-end">
              <button
                type="button"
                onClick={applyTimeChanges}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Apply Time
              </button>
            </div>
            <input
              type="hidden"
              name="time"
              value={formData.time}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.time || 'Start time - End time will appear here after you apply'}
            </p>
          </div>

          {/* Enhanced location input with autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Address
            </label>
            <div className="relative">
              <input
                ref={locationInputRef}
                type="text"
                name="location"
                value={formData.location}
                onChange={handleLocationChange}
                onKeyDown={handleLocationKeyDown}
                onFocus={() => {
                  if (locationSuggestions.length > 0) {
                    setShowLocationSuggestions(true);
                  }
                }}
                className="w-full p-2 border rounded pr-8"
                placeholder="Start typing an address in Italy..."
                required
              />
              {locationLoading && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
              {!locationLoading && formData.location && (
                <div className="absolute right-2 top-2 text-gray-400">
                  📍
                </div>
              )}
            </div>

            {/* Location suggestions dropdown */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${index === selectedLocationIndex
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                      }`}
                    onClick={() => handleLocationSelect(suggestion)}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {suggestion.formatted}
                    </div>
                    {suggestion.formatted !== suggestion.display_name && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {suggestion.display_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-1">
              Mappable address for location services (required for map display)
            </p>
          </div>

          {/* Venue Name field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue Name
            </label>
            <input
              type="text"
              name="venueName"
              value={formData.venueName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="e.g., Caffè delle Arti, Studio Fotografico Roma..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Display name for the venue (shown to users)
            </p>
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

          {/* Payment settings section */}
          <div className="md:col-span-2">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium text-lg mb-3">Payment Settings</h3>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={formData.isPaid}
                  onChange={handlePaidToggle}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-700">
                  This is a paid event
                </label>
              </div>

              {formData.isPaid && (
                <div className="space-y-4">
                  {/* Member vs Non-Member Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="memberPrice">
                        Member Price *
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">€</span>
                        </div>
                        <input
                          type="number"
                          name="memberPrice"
                          id="memberPrice"
                          value={formData.memberPrice === '' ? '' : formData.memberPrice}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          required={formData.isPaid}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">EUR</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Price for current year members (can be €0 for free member access)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nonMemberPrice">
                        Non-Member Price *
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">€</span>
                        </div>
                        <input
                          type="number"
                          name="nonMemberPrice"
                          id="nonMemberPrice"
                          value={formData.nonMemberPrice === '' ? '' : formData.nonMemberPrice}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          required={formData.isPaid}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">EUR</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Price for new/past year members (can be €0 for free access)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="paymentCurrency">
                      Currency
                    </label>
                    <select
                      id="paymentCurrency"
                      name="paymentCurrency"
                      value={formData.paymentCurrency}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      disabled
                    >
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>

                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <p>Payment will be processed securely via PayPal during the booking process.</p>
                    {formData.isPaid && formData.memberPrice !== '' && formData.nonMemberPrice !== '' && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800 font-medium text-sm">
                        <p>Current pricing:</p>
                        <p>• Members: €{parseFloat(formData.memberPrice || 0).toFixed(2)} EUR</p>
                        <p>• Non-members: €{parseFloat(formData.nonMemberPrice || 0).toFixed(2)} EUR</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL (Optional if file is uploaded)
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can either provide a URL or upload an image file below
            </p>
          </div>
        </div>

        {/* Image uploader component */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Image
          </label>
          <ImageUploader
            initialImage={imageUrl}
            onImageUploaded={handleImageUploaded}
            eventId={initialValues.id || 'temp-' + Date.now()}
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload an image for the event card (PNG, JPG, GIF up to 5MB)
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secondary Image (Below Map)
          </label>
          <ImageUploader
            initialImage={secondaryImageUrl}
            onImageUploaded={handleSecondaryImageUploaded}
            eventId={initialValues.id ? `${initialValues.id}_secondary` : `temp-secondary-${Date.now()}`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload secondary image to display below the map (PNG, JPG, GIF up to 5MB)
          </p>
        </div>

        {/* Description with markdown editor */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <button
              type="button"
              onClick={toggleEmojiPicker}
              className="text-gray-500 hover:text-gray-700"
            >
              😊 Add Emoji
            </button>
          </div>

          <div data-color-mode="light" ref={mdEditorRef}>
            <MDEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value || '' })}
              preview="edit"
              height={200}
              textareaProps={{
                placeholder: "Write description using markdown...",
              }}
            />
          </div>

          {/* Keep your existing emoji picker as is */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute right-0 z-10 mt-1">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                disableAutoFocus={true}
                native={true}
              />
            </div>
          )}
        </div>

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
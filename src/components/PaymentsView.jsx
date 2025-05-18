import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

function PaymentsView({ eventId = null }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalAmount: 0 });
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending'
  const [eventTitles, setEventTitles] = useState({}); // Cache for event titles

  useEffect(() => {
    fetchPayments();
  }, [eventId, filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // First, try to fetch payments from dedicated payments collection
      let paymentsData = [];
      
      // Create a query for the payments collection
      let paymentsQuery;
      if (eventId) {
        paymentsQuery = query(
          collection(db, 'payments'),
          where('eventId', '==', eventId)
        );
      } else {
        // No specific event, get all payments
        paymentsQuery = query(
          collection(db, 'payments')
        );
      }
      
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      // Process payments from payments collection
      if (!paymentsSnapshot.empty) {
        paymentsSnapshot.forEach(doc => {
          const data = doc.data();
          paymentsData.push({
            id: doc.id,
            paymentId: data.paymentId || 'N/A',
            amount: data.amount || 0,
            currency: data.currency || 'EUR',
            status: data.status || 'PENDING',
            eventId: data.eventId || 'N/A',
            userId: data.userId || 'N/A',
            createdAt: data.createdAt,
            bookingId: data.bookingId || null,
            userEmail: data.payerEmail || 'N/A',
            source: 'paymentCollection'
          });
        });
      }
      
      // Also look for bookings with payment data (legacy records)
      const bookingsQuery = eventId 
        ? query(collection(db, 'bookings'), where('eventId', '==', eventId))
        : query(collection(db, 'bookings'));
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      bookingsSnapshot.forEach(doc => {
        const booking = doc.data();
        if (booking.payment) {
          // Check if we already have this payment in our list (to avoid duplicates)
          const paymentId = booking.payment.id;
          const existingPayment = paymentId ? 
            paymentsData.find(p => p.paymentId === paymentId) : null;
          
          if (!existingPayment) {
            paymentsData.push({
              id: doc.id,
              paymentId: booking.payment.id || 'N/A',
              amount: booking.payment.amount || 0,
              currency: booking.payment.currency || 'EUR',
              status: booking.payment.status || 'PENDING',
              eventId: booking.eventId,
              userId: booking.userId,
              createdAt: booking.payment.createdAt || booking.createdAt,
              bookingId: doc.id,
              userEmail: booking.contactInfo?.email || 'N/A',
              source: 'bookingCollection'
            });
          }
        }
      });
      
      console.log("Payments found:", paymentsData.length);
      
      // Apply filter
      if (filter === 'completed') {
        paymentsData = paymentsData.filter(payment => 
          payment.status === 'COMPLETED' || payment.status === 'completed');
      } else if (filter === 'pending') {
        paymentsData = paymentsData.filter(payment => 
          payment.status !== 'COMPLETED' && payment.status !== 'completed');
      }
      
      // Sort by date descending (newest first)
      paymentsData.sort((a, b) => {
        // Handle various timestamp formats
        const getTimestamp = (payment) => {
          if (!payment.createdAt) return 0;
          if (payment.createdAt.toDate) return payment.createdAt.toDate().getTime();
          if (payment.createdAt.seconds) return payment.createdAt.seconds * 1000;
          if (typeof payment.createdAt === 'string') return new Date(payment.createdAt).getTime();
          return 0;
        };
        
        return getTimestamp(b) - getTimestamp(a);
      });
      
      // Calculate statistics
      const totalPayments = paymentsData.length;
      const completedPayments = paymentsData.filter(payment => 
        payment.status === 'COMPLETED' || payment.status === 'completed').length;
      const pendingPayments = totalPayments - completedPayments;
      
      // Calculate total amount of completed payments
      const totalAmount = paymentsData
        .filter(payment => payment.status === 'COMPLETED' || payment.status === 'completed')
        .reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      
      setPayments(paymentsData);
      setStats({
        total: totalPayments,
        completed: completedPayments,
        pending: pendingPayments,
        totalAmount: totalAmount
      });
      
      // Fetch event titles for event IDs
      fetchEventTitles(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch event titles for all event IDs in payments
  const fetchEventTitles = async (paymentsData) => {
    try {
      // Get unique event IDs
      const uniqueEventIds = [...new Set(
        paymentsData
          .filter(payment => payment.eventId && payment.eventId !== 'N/A')
          .map(payment => payment.eventId)
      )];
      
      // Skip if no event IDs or if we only have one event ID that matches the filter
      if (uniqueEventIds.length === 0 || (uniqueEventIds.length === 1 && uniqueEventIds[0] === eventId)) {
        return;
      }
      
      // Fetch titles for all event IDs
      const eventTitlesMap = {};
      
      await Promise.all(uniqueEventIds.map(async (eventId) => {
        try {
          const eventDoc = await getDoc(doc(db, 'events', eventId));
          if (eventDoc.exists()) {
            eventTitlesMap[eventId] = eventDoc.data().title || 'Unknown Event';
          } else {
            eventTitlesMap[eventId] = 'Event Not Found';
          }
        } catch (err) {
          console.error(`Error fetching event ${eventId}:`, err);
          eventTitlesMap[eventId] = 'Error Loading Event';
        }
      }));
      
      setEventTitles(eventTitlesMap);
    } catch (error) {
      console.error('Error fetching event titles:', error);
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      if (timestamp.toDate) {
        // Firestore timestamp
        return timestamp.toDate().toLocaleString();
      } else if (timestamp.seconds) {
        // Firestore timestamp in a different format
        return new Date(timestamp.seconds * 1000).toLocaleString();
      } else if (typeof timestamp === 'string') {
        // ISO string or other date string
        return new Date(timestamp).toLocaleString();
      } else {
        // Regular date or other format
        return new Date(timestamp).toLocaleString();
      }
    } catch (error) {
      console.error("Error formatting date:", error, timestamp);
      return 'Invalid date';
    }
  };

  // Format payment status with more clarity
  const formatStatus = (status) => {
    status = status?.toUpperCase() || 'UNKNOWN';
    
    switch(status) {
      case 'COMPLETED':
        return { label: 'Completed', class: 'bg-green-100 text-green-800' };
      case 'PENDING':
        return { label: 'Pending', class: 'bg-yellow-100 text-yellow-800' };
      case 'FAILED':
        return { label: 'Failed', class: 'bg-red-100 text-red-800' };
      case 'REFUNDED':
        return { label: 'Refunded', class: 'bg-blue-100 text-blue-800' };
      default:
        return { label: status, class: 'bg-gray-100 text-gray-800' };
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchPayments();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {eventId ? 'Event Payments' : 'All Payments'}
        </h2>
        <button
          onClick={handleRefresh}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded border">
          <div className="text-sm text-gray-500">Total Payments</div>
          <div className="text-xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-green-50 p-3 rounded border">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded border">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded border">
          <div className="text-sm text-gray-500">Total Amount</div>
          <div className="text-xl font-bold text-blue-600">
            €{stats.totalAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 py-1 rounded-full text-sm ${filter === 'all' 
            ? 'bg-gray-800 text-white' 
            : 'bg-gray-200 text-gray-800'}`}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange('completed')}
          className={`px-3 py-1 rounded-full text-sm ${filter === 'completed' 
            ? 'bg-green-600 text-white' 
            : 'bg-green-100 text-green-800'}`}
        >
          Completed
        </button>
        <button
          onClick={() => handleFilterChange('pending')}
          className={`px-3 py-1 rounded-full text-sm ${filter === 'pending' 
            ? 'bg-yellow-600 text-white' 
            : 'bg-yellow-100 text-yellow-800'}`}
        >
          Pending/Other
        </button>
      </div>

      {/* Payments table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading payments...</p>
        </div>
      ) : payments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment ID
                </th>
                {!eventId && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event ID
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment, index) => {
                const status = formatStatus(payment.status);
                
                return (
                  <tr key={payment.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span>
                          {payment.paymentId.length > 12 
                            ? `${payment.paymentId.substring(0, 12)}...` 
                            : payment.paymentId}
                        </span>
                        {payment.bookingId && (
                          <span className="text-xs text-gray-500">
                            Booking: {payment.bookingId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </td>
                    {!eventId && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div 
                          className="group relative cursor-help"
                          title={eventTitles[payment.eventId] || "Loading event title..."}
                        >
                          <span>{payment.eventId.length > 8 
                            ? `${payment.eventId.substring(0, 8)}...` 
                            : payment.eventId}
                          </span>
                          
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-10 p-2 bg-gray-900 text-white text-xs rounded whitespace-normal w-48 -top-2 left-full ml-2 pointer-events-none">
                            {eventTitles[payment.eventId] || "Loading event title..."}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.amount} {payment.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.userEmail || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded">
          <p className="text-gray-500">No payments found</p>
        </div>
      )}
    </div>
  );
}

export default PaymentsView;
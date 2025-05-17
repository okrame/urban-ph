import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

function PaymentsView({ eventId = null }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalAmount: 0 });
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending'

  useEffect(() => {
    fetchPayments();
  }, [eventId, filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // First, try to fetch payments from dedicated payments collection
      let paymentsData = [];
      
      const paymentsQuery = eventId 
        ? query(collection(db, 'payments'), where('eventId', '==', eventId))
        : query(collection(db, 'bookings'), where('payment', '!=', null));
      
      const snapshot = await getDocs(paymentsQuery);
      
      // If no results in payments collection, search in bookings collection
      if (snapshot.empty && !eventId) {
        console.log("No payments found in payments collection, checking bookings");
        
        const bookingsQuery = query(collection(db, 'bookings'));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        bookingsSnapshot.forEach(doc => {
          const booking = doc.data();
          if (booking.payment) {
            paymentsData.push({
              id: doc.id,
              paymentId: booking.payment.id || 'N/A',
              amount: booking.payment.amount || 0,
              currency: booking.payment.currency || 'EUR',
              status: booking.payment.status || 'PENDING',
              eventId: booking.eventId,
              userId: booking.userId,
              createdAt: booking.payment.createdAt || booking.createdAt,
              userEmail: booking.contactInfo?.email || 'N/A'
            });
          }
        });
      } else {
        snapshot.forEach(doc => {
          const data = doc.data();
          
          // Check if this is a payment document or a booking with payment
          if (data.payment) {
            // It's a booking with payment property
            paymentsData.push({
              id: doc.id,
              paymentId: data.payment.id || 'N/A',
              amount: data.payment.amount || 0,
              currency: data.payment.currency || 'EUR',
              status: data.payment.status || 'PENDING',
              eventId: data.eventId,
              userId: data.userId,
              createdAt: data.payment.createdAt || data.createdAt,
              userEmail: data.contactInfo?.email || 'N/A'
            });
          } else {
            // It's a payment document
            paymentsData.push({
              id: doc.id,
              paymentId: data.paymentId || data.id || 'N/A',
              amount: data.amount || 0,
              currency: data.currency || 'EUR',
              status: data.status || 'PENDING',
              eventId: data.eventId || 'N/A',
              userId: data.userId || 'N/A',
              createdAt: data.createdAt,
              userEmail: data.payerEmail || data.payer?.email || 'N/A'
            });
          }
        });
      }
      
      console.log("Payments found:", paymentsData.length);
      
      // Apply filter
      if (filter === 'completed') {
        paymentsData = paymentsData.filter(payment => 
          payment.status === 'COMPLETED' || payment.status === 'completed');
      } else if (filter === 'pending') {
        paymentsData = paymentsData.filter(payment => 
          payment.status !== 'COMPLETED' && payment.status !== 'completed');
      }
      
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
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
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
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
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
          Pending
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
              {payments.map((payment, index) => (
                <tr key={payment.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paymentId.length > 12 
                      ? `${payment.paymentId.substring(0, 12)}...` 
                      : payment.paymentId}
                  </td>
                  {!eventId && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.eventId.length > 8 
                        ? `${payment.eventId.substring(0, 8)}...` 
                        : payment.eventId}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.amount} {payment.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'COMPLETED' || payment.status === 'completed'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.userEmail || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
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
import { useState, useEffect } from 'react';
import { getDocs, collection, updateDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

function UsersDatabase() {
  const [data, setData] = useState([]);
  const [editingCell, setEditingCell] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const users = [];

      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        const events = userData.eventsBooked || [];

        const eventsDetails = [];
        let phoneNumber = ''; 
        
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', userDoc.id)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        if (!bookingsSnapshot.empty) {
          const firstBooking = bookingsSnapshot.docs[0].data();
          phoneNumber = firstBooking.contactInfo?.phone || '';
        }

        for (const eventId of events) {
          try {
            const eventRef = doc(db, 'events', eventId);
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
              const eventData = eventSnap.data();
              eventsDetails.push(`${eventData.title} (${eventData.date})`);
            }
          } catch (error) {
            console.error('Error fetching event:', error);
          }
        }

        const fullName = userData.name && userData.surname 
          ? `${userData.name} ${userData.surname}`
          : userData.displayName || ''; // Fallback to displayName if name/surname not available

        const birthDate = userData.birthDate;
        const birthDateString = birthDate ? 
          (birthDate instanceof Date ? birthDate.toLocaleDateString() :
           typeof birthDate === 'string' ? birthDate :
           birthDate.toDate ? birthDate.toDate().toLocaleDateString() : '') : '';

        users.push({
          id: userDoc.id,
          email: userData.email || '',
          taxId: userData.taxId || '',
          fullName: fullName,
          birthDate: birthDateString,
          phone: phoneNumber, 
          address: userData.address || '',
          instagram: userData.instagram || '',
          role: userData.role || '',
          createdAt: userData.createdAt?.toDate().toLocaleString() || '',
          eventsBooked: eventsDetails.length > 0 ? eventsDetails : ['No events booked']
        });
      }

      setData(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fetchUsers();
    setSyncing(false);
  };

  const handleEdit = (rowId, columnId, value) => {
    if (columnId === 'eventsBooked' || columnId === 'phone') return; // Prevent editing these columns
    setEditingCell({ rowId, columnId, value });
  };

  const handleSave = async (rowId, columnId, value) => {
    try {
      const userRef = doc(db, 'users', rowId);
      await updateDoc(userRef, { [columnId]: value });

      setData(prevData =>
        prevData.map(row =>
          row.id === rowId ? { ...row, [columnId]: value } : row
        )
      );

      setEditingCell({});
    } catch (error) {
      console.error('Error updating user field:', error);
      alert('Failed to update user.');
    }
  };

  const downloadCSV = () => {
    const header = ['id', 'email', 'taxId', 'fullName', 'birthDate', 'phone', 'address', 'instagram', 'role', 'createdAt', 'eventsBooked'];
    const csv = [
      header.join(','),
      ...data.map(row => header.map(field => JSON.stringify(row[field] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_database.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'taxId', header: 'Codice Fiscale' },
    { accessorKey: 'fullName', header: 'Full Name' },
    { accessorKey: 'birthDate', header: 'Data di nascita' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'address', header: 'Residenza' },
    { accessorKey: 'instagram', header: 'Instagram' },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'createdAt', header: 'Created At' },
    { accessorKey: 'eventsBooked', header: 'Events Booked' },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Users Database</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center px-4 py-2 rounded ${
              syncing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-yellow-600 hover:bg-yellow-700'
            } text-white`}
          >
            <svg 
              className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
          <button 
            onClick={downloadCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Download CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-2 text-left bg-gray-50 text-gray-600 font-medium">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                {row.getVisibleCells().map(cell => {
                  const isEditing = editingCell.rowId === row.original.id && editingCell.column.id === cell.column.id;
                  const isEventsColumn = cell.column.id === 'eventsBooked';
                  const isPhoneColumn = cell.column.id === 'phone';

                  return (
                    <td key={cell.id} className="px-4 py-2">
                      {isEditing && !isEventsColumn && !isPhoneColumn ? (
                        <input
                          type="text"
                          className="border rounded p-1 w-full"
                          defaultValue={editingCell.value}
                          onBlur={(e) => handleSave(row.original.id, cell.column.id, e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => !isPhoneColumn && handleEdit(row.original.id, cell.column.id, cell.getValue())}
                          className={`p-1 rounded ${!isEventsColumn && !isPhoneColumn ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                        >
                          {Array.isArray(cell.getValue()) 
                            ? cell.getValue().join(', ')
                            : String(cell.getValue() ?? '')}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersDatabase;
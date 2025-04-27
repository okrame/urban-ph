import { useState, useEffect } from 'react';
import { getDocs, collection, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

function UsersDatabase() {
  const [data, setData] = useState([]);
  const [editingCell, setEditingCell] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const users = [];

      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        const events = userData.eventsBooked || [];

        const eventsDetails = [];
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

        users.push({
          id: userDoc.id,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          createdAt: userData.createdAt?.toDate().toLocaleString() || '',
          eventsBooked: eventsDetails.length > 0 ? eventsDetails : ['No events booked']
        });
      }

      setData(users);
    };

    fetchUsers();
  }, []);

  const handleEdit = (rowId, columnId, value) => {
    if (columnId === 'eventsBooked') return; // Prevent editing this column
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
    const header = ['id', 'email', 'displayName', 'role', 'createdAt', 'eventsBooked'];
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
    { accessorKey: 'displayName', header: 'Display Name' },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'createdAt', header: 'Created At' },
    { accessorKey: 'eventsBooked', header: 'Events Booked' },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Users Database</h2>
        <button 
          onClick={downloadCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Download CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-2 text-left">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="divide-y">
                {row.getVisibleCells().map(cell => {
                  const isEditing = editingCell.rowId === row.original.id && editingCell.column.id === cell.column.id;
                  const isEventsColumn = cell.column.id === 'eventsBooked';

                  return (
                    <td key={cell.id} className="px-4 py-2">
                      {isEditing && !isEventsColumn ? (
                        <input
                          type="text"
                          className="border rounded p-1 w-full"
                          defaultValue={editingCell.value}
                          onBlur={(e) => handleSave(row.original.id, cell.column.id, e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleEdit(row.original.id, cell.column.id, cell.getValue())}
                          className={`p-1 rounded ${!isEventsColumn ? 'cursor-pointer hover:bg-gray-100' : ''}`}
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

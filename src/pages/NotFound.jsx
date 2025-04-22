import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';
import Navbar from '../components/Navbar';

function NotFound() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar user={user} />
      
      <div className="flex-grow flex items-center justify-center">
        <div className="max-w-md w-full px-6 py-12 bg-white shadow-lg rounded-lg text-center">
          <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
          
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved!
          </p>
          
          <div className="space-y-4">
            <Link
              to="/"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Go to Homepage
            </Link>
            
            <Link
              to="/events"
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition duration-200"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-800 text-white text-center py-6">
        <p>© {new Date().getFullYear()} Urban Photo Hunts. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default NotFound;
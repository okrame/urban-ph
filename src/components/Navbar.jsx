import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';

function Navbar({ user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">Urban Photo Hunts</Link>
            
            {/* Desktop menu */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link to="/" className="px-3 py-2 rounded-md hover:bg-gray-700">Home</Link>
              <Link to="/events" className="px-3 py-2 rounded-md hover:bg-gray-700">Events</Link>
              {user && (
                <Link to="/admin" className="px-3 py-2 rounded-md hover:bg-gray-700">Admin</Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:block">Hello, {user.displayName || user.email}</span>
                <button 
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <span>Welcome, Guest</span>
            )}
            
            {/* Mobile menu button */}
            <div className="ml-4 md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-400 hover:text-white focus:outline-none"
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md hover:bg-gray-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/events" 
              className="block px-3 py-2 rounded-md hover:bg-gray-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            {user && (
              <Link 
                to="/admin" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
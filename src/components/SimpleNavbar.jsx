import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { createUserProfile } from '../../firebase/userServices';

function SimpleNavbar({ user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if a nav link is active
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="bg-gray-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-white">Urban Photo Hunts</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex space-x-8 mr-4">
              <Link 
                to="/" 
                className={isActive('/') ? 'text-white border-b-2 border-blue-500 px-3 py-2' : 'text-gray-300 hover:text-white px-3 py-2'}
              >
                Home
              </Link>
              <Link 
                to="/events" 
                className={isActive('/events') ? 'text-white border-b-2 border-blue-500 px-3 py-2' : 'text-gray-300 hover:text-white px-3 py-2'}
              >
                Events
              </Link>
              {user && (
                <Link 
                  to="/admin" 
                  className={isActive('/admin') ? 'text-white border-b-2 border-blue-500 px-3 py-2' : 'text-gray-300 hover:text-white px-3 py-2'}
                >
                  Admin
                </Link>
              )}
            </div>
            
            {user ? (
              <div className="flex items-center space-x-2">
                {user.photoURL && (
                  <img src={user.photoURL} alt="Profile" className="h-8 w-8 rounded-full" />
                )}
                <span className="text-white text-sm hidden lg:inline-block">{user.displayName || user.email}</span>
                <button 
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSignIn}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 pb-4">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded ${isActive('/') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/events"
              className={`block px-3 py-2 rounded ${isActive('/events') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            {user && (
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded ${isActive('/admin') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
          
          {/* User section */}
          <div className="px-4 pt-4 border-t border-gray-700">
            {user ? (
              <div className="flex flex-col space-y-3">
                <div className="flex items-center">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full mr-2" />
                  )}
                  <span className="text-white text-sm">{user.displayName || user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default SimpleNavbar;
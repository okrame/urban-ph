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
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Urban Photo Hunts</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/" 
              className={isActive('/') ? 'text-blue-600 border-b-2 border-blue-500 px-3 py-2' : 'text-gray-600 hover:text-blue-600 px-3 py-2'}
            >
              Home
            </Link>
            <Link 
              to="/events" 
              className={isActive('/events') ? 'text-blue-600 border-b-2 border-blue-500 px-3 py-2' : 'text-gray-600 hover:text-blue-600 px-3 py-2'}
            >
              Events
            </Link>
            {user && (
              <Link 
                to="/admin" 
                className={isActive('/admin') ? 'text-blue-600 border-b-2 border-blue-500 px-3 py-2' : 'text-gray-600 hover:text-blue-600 px-3 py-2'}
              >
                Admin
              </Link>
            )}
            
            {user ? (
              <div className="flex items-center space-x-2">
                {user.photoURL && (
                  <img src={user.photoURL} alt="Profile" className="h-8 w-8 rounded-full" />
                )}
                <span className="text-gray-700 text-sm hidden lg:inline-block">{user.displayName || user.email}</span>
                <button 
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
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
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-blue-600"
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
        <div className="md:hidden shadow-lg pb-3">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/events"
              className={`block px-3 py-2 rounded ${isActive('/events') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            {user && (
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded ${isActive('/admin') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
          
          {/* User section */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="flex items-center px-4">
                {user.photoURL && (
                  <div className="flex-shrink-0">
                    <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                  </div>
                )}
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.displayName || 'User'}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-auto bg-red-600 flex-shrink-0 p-1 rounded-full text-white hover:bg-red-700"
                >
                  <span className="sr-only">Sign out</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="px-4">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Signing in...' : 'Sign In with Google'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default SimpleNavbar;
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import UPHLogo from '../assets/UPH_Logo.png';

function Navbar({ user, onSignInClick, loading }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = () => {
    if (onSignInClick) {
      onSignInClick();
    }
  };

  // Check if user is admin
  const isAdmin = user?.email && [
    'lucianodidonatto@gmail.com',
    'federica@federica.com'
  ].includes(user.email);

  const scrollToCurrentEvents = (e) => {
    e.preventDefault();
    const eventsSection = document.getElementById('current-events-section');
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // New function to scroll to AboutUs component
  const scrollToAboutUs = (e) => {
    e.preventDefault();
    
    // If we're not on the home page, navigate there first
    if (location.pathname !== '/') {
      window.location.hash = '/#/?scrollToAbout=true';
      return;
    }
    
    // Find the AboutUs section and scroll to it
    const aboutSection = document.querySelector('[data-section="about-us"]');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    if (path === '/events' && location.pathname === '/') {
      return false; // We're treating events differently now
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex h-28 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={UPHLogo} 
                alt="Urban Photo Hunts Logo" 
                className="h-24 w-auto"
              />
            </Link>
          </div>
          
          {/* Desktop navigation - aligned left */}
          <div className="hidden md:flex items-center ml-6 space-x-4">
            <Link 
              to="/" 
              className={isActive('/') ? 'text-[#AFACFB] border-b-2 border-[#AFACFB] px-4 py-3' : 'text-gray-600 hover:text-[#AFACFB] px-4 py-3'}
            >
              Home
            </Link>
            <Link 
              to={location.pathname === '/' ? '/' : '/#/?scrollToEvents=true'} 
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  scrollToCurrentEvents(e);
                }
              }}
              className={isActive('/events') ? 'text-[#AFACFB] border-b-2 border-[#AFACFB] px-4 py-3' : 'text-gray-600 hover:text-[#AFACFB] px-4 py-3'}
            >
              .ourEvents
            </Link>
            <button 
              onClick={scrollToAboutUs}
              className="text-gray-600 hover:text-[#AFACFB] px-4 py-3 transition-colors duration-200"
            >
              .aboutUs
            </button>
            {user && isAdmin && (
              <Link 
                to="/admin" 
                className={isActive('/admin') ? 'text-[#AFACFB] border-b-2 border-[#AFACFB] px-4 py-3' : 'text-gray-600 hover:text-[#AFACFB] px-4 py-3'}
              >
                Admin
              </Link>
            )}
          </div>
          
          {/* User Authentication - pushed to the right */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex items-center space-x-2">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile"
                    className="h-8 w-8 rounded-full" 
                    onError={(e) => {
                      e.target.onerror = null;
                      // Use a data URI as fallback (gray circle with user initial)
                      const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
                      e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23718096'/%3E%3Ctext x='16' y='22' font-family='Arial' font-size='16' fill='white' text-anchor='middle'%3E${initial}%3C/text%3E%3C/svg%3E`;
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-gray-700 text-sm hidden lg:inline-block">{user.displayName || user.email}</span>
                <button 
                  onClick={handleSignOut}
                  className="bg-[#FFFADE] hover:bg-[#FFF9C8] text-gray-800 px-4 py-1.5 rounded text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSignIn}
                disabled={loading}
                className="bg-[#AFACFB] hover:bg-[#9B97F5] text-white px-5 py-2.5 rounded text-sm flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>Sign In</>
                )}
              </button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center ml-auto">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-[#AFACFB]"
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
              className={`block px-3 py-2 rounded ${isActive('/') ? 'bg-[#AFACFB]/10 text-[#AFACFB]' : 'text-gray-700 hover:bg-[#AFACFB]/10 hover:text-[#AFACFB]'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to={location.pathname === '/' ? '/' : '/#/?scrollToEvents=true'}
              className={`block px-3 py-2 rounded ${isActive('/events') ? 'bg-[#AFACFB]/10 text-[#AFACFB]' : 'text-gray-700 hover:bg-[#AFACFB]/10 hover:text-[#AFACFB]'}`}
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  scrollToCurrentEvents(e);
                }
                setIsMenuOpen(false);
              }}
            >
              Events
            </Link>
            <button
              onClick={(e) => {
                scrollToAboutUs(e);
                setIsMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded text-gray-700 hover:bg-[#AFACFB]/10 hover:text-[#AFACFB] transition-colors duration-200"
            >
              About Us
            </button>
            {user && isAdmin && (
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded ${isActive('/admin') ? 'bg-[#AFACFB]/10 text-[#AFACFB]' : 'text-gray-700 hover:bg-[#AFACFB]/10 hover:text-[#AFACFB]'}`}
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
                <div className="flex-shrink-0">
                  {user.photoURL ? (
                    <img 
                      className="h-10 w-10 rounded-full" 
                      src={user.photoURL} 
                      alt=""
                      onError={(e) => {
                        e.target.onerror = null;
                        // Use a data URI as fallback (gray circle with user initial)
                        const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23718096'/%3E%3Ctext x='20' y='27' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E${initial}%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.displayName || 'User'}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-auto bg-[#FFFADE] hover:bg-[#FFF9C8] flex-shrink-0 p-1 rounded-full text-gray-800"
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
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#AFACFB] hover:bg-[#9B97F5]"
                >
                  {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>Sign In</>
                )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
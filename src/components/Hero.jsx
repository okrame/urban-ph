import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { getUserProfile } from '../../firebase/userServices';
import gianicolo from '../assets/gianicolo.jpg';
import AnimateLogo from '../components/AnimateLogo';

// Animated burger menu lines
const Path = props => (
  <motion.path
    fill="transparent"
    strokeWidth="2"
    stroke="#FFFADE"
    strokeLinecap="round"
    {...props}
  />
);

function Hero({ user, onSignInClick }) {
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const startLetterRef = useRef(null);
  const endTextRef = useRef(null);
  const authButtonRef = useRef(null);
  const location = useLocation();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid);
          setIsAdmin(userProfile?.role === 'admin');
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSignIn = () => {
    setLoading(true);
    if (onSignInClick) {
      onSignInClick();
    }
    setLoading(false);
  };

  const scrollToCurrentEvents = (e) => {
    e.preventDefault();
    const section = document.getElementById('current-events-section');
    section && section.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={gianicolo}
          alt="Panorama dal Gianicolo a Roma"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Logo - with animation */}
      <div
        className="absolute z-25"
        style={{
          left: '51.3%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <AnimateLogo 
          className="w-32 h-auto md:w-40 lg:w-48"
          animationDelay={1000}
          animationDuration={4000}
        />
      </div>

      {/* Urban pH text below logo */}
      <div
        className="absolute z-20"
        style={{
          left: '54.5%',
          top: isMobile ? '56%' : '60%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <p
          className="text-lg md:text-xl font-light text-center"
          style={{ color: 'white' }}
        >
          Urban pH
        </p>
      </div>

      {/* Desktop Navigation Overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 p-8 hidden md:block">
        <div className="flex justify-between items-start">
          {/* Left side navigation and main text content container */}
          <div className="flex flex-col items-start">
            {/* Navigation menu */}
            <div className="flex space-x-8 mb-8">
              <button
                onClick={scrollToCurrentEvents}
                className="text-[#FFFADE] hover:text-white transition-colors duration-200 text-lg font-medium"
              >
                .ourEvents
              </button>
              <Link
                to="/about"
                className="text-[#FFFADE] hover:text-white transition-colors duration-200 text-lg font-medium"
              >
                .aboutUs
              </Link>
              {user && isAdmin && (
                <Link
                  to="/admin"
                  className="text-[#FFFADE] hover:text-white transition-colors duration-200 text-lg font-medium"
                >
                  Admin
                </Link>
              )}
            </div>

            {/* Main Text Content - now anchored to left menu */}
            <div
              className="text-left"
              style={{
                transform: 'translateY(50px)',
              }}
            >
              <h1
                className="font-medium leading-tight"
                style={{ color: '#FFFADE' }}
              >
                <div className="text-4xl md:text-6xl">ESPLORARE</div>
                <div className="text-4xl md:text-6xl">IL CORPO</div>
                <div className="text-4xl md:text-6xl">
                  URBAN<span ref={startLetterRef}>O</span>
                </div>
              </h1>
            </div>
          </div>

          {/* Right side authentication and text content container */}
          <div className="flex flex-col items-end">
            {/* Authentication section */}
            <div className="flex items-center mb-8">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-[#FFFADE] text-sm">
                    {user.displayName || user.email}
                  </span>
                  <button
                    ref={authButtonRef}
                    onClick={handleSignOut}
                    className="text-[#FFFADE] hover:text-white transition-colors duration-200 text-lg font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  ref={authButtonRef}
                  onClick={handleSignIn}
                  disabled={loading}
                  className="text-[#FFFADE] hover:text-white transition-colors duration-200 text-lg font-medium flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#FFFADE]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              )}
            </div>

            {/* Right side text content - now anchored to auth button */}
            <div
              className="max-w-md text-right"
              style={{
                transform: 'translateY(510px)',
              }}
            >
              <p ref={endTextRef} className="text-lg md:text-xl opacity-90 mb-8" style={{ color: '#FFFADE' }}>
                La città è di tuttə, così come l'arte e la fotografia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 md:hidden">
        <div className="flex justify-between items-start">
          {/* Main Text Content - Mobile positioning (moved up and left) */}
          <div className="text-left flex items-start">
            <h1
              className="font-medium leading-tight"
              style={{ color: '#FFFADE' }}
            >
              <div className="text-4xl sm:text-4xl">ESPLORARE</div>
              <div className="text-4xl sm:text-4xl">IL CORPO</div>
              <div className="text-4xl sm:text-4xl">
                URBAN<span ref={startLetterRef}>O</span>
              </div>
            </h1>
          </div>

          {/* Animated Hamburger Menu Button */}
          <motion.button
            onClick={toggleMobileMenu}
            className="text-[#FFFADE] hover:text-white transition-colors duration-200 p-2 flex-shrink-0"
            aria-label="Toggle menu"
            initial={false}
            animate={isMobileMenuOpen ? "open" : "closed"}
          >
            <svg width="40" height="40" viewBox="0 0 23 23">
              <Path
                variants={{
                  closed: { d: "M 2 2.5 L 20 2.5" },
                  open: { d: "M 3 16.5 L 17 2.5" }
                }}
              />
              <Path
                d="M 2 9.423 L 20 9.423"
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 }
                }}
                transition={{ duration: 0.1 }}
              />
              <Path
                variants={{
                  closed: { d: "M 2 16.346 L 20 16.346" },
                  open: { d: "M 3 2.5 L 17 16.346" }
                }}
              />
            </svg>
          </motion.button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <motion.div 
            className="absolute top-full left-0 right-0 bg-black bg-opacity-90 backdrop-blur-sm"
            initial={{ clipPath: "circle(30px at calc(100% - 40px) 40px)", opacity: 0 }}
            animate={{ clipPath: "circle(1000px at calc(100% - 40px) 40px)", opacity: 1 }}
            exit={{ clipPath: "circle(30px at calc(100% - 40px) 40px)", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 20,
              restDelta: 2
            }}
          >
            <motion.div 
              className="flex flex-col p-4 space-y-4"
              initial="closed"
              animate="open"
              variants={{
                open: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
                closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
              }}
            >
              <motion.button
                onClick={scrollToCurrentEvents}
                className="text-[#FFFADE] hover:text-white transition-colors duration-200 text-lg font-medium text-left"
                variants={{
                  open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
                  closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } }
                }}
              >
                .ourEvents
              </motion.button>
              <motion.div
                variants={{
                  open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
                  closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } }
                }}
              >
                <Link
                  to="/about"
                  onClick={closeMobileMenu}
                  className="text-[#FFFADE] hover:text-white transition-colors duration-200 text-lg font-medium text-left block"
                >
                  .aboutUs
                </Link>
              </motion.div>
              {user && isAdmin && (
                <motion.div
                  variants={{
                    open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
                    closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } }
                  }}
                >
                  <Link
                    to="/admin"
                    onClick={closeMobileMenu}
                    className="text-[#FFFADE] hover:text-white transition-colors duration-200 text-lg font-medium text-left block"
                  >
                    Admin
                  </Link>
                </motion.div>
              )}
              <motion.hr 
                className="border-[#FFFADE] opacity-30"
                variants={{
                  open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
                  closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } }
                }}
              />
              {user ? (
                <>
                  <motion.span 
                    className="text-[#FFFADE] text-lg"
                    variants={{
                      open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
                      closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } }
                    }}
                  >
                    Welcome, {user.displayName || user.email}
                  </motion.span>
                  <motion.button
                    onClick={() => {
                      handleSignOut();
                      closeMobileMenu();
                    }}
                    className="bg-transparent border border-[#FFFADE] text-[#FFFADE] hover:bg-[#FFFADE] hover:text-black px-4 py-2 rounded transition-colors duration-200"
                    variants={{
                      open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
                      closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } }
                    }}
                  >
                    Sign Out
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={() => {
                    handleSignIn();
                    closeMobileMenu();
                  }}
                  disabled={loading}
                  className="bg-transparent border border-[#FFFADE] text-[#FFFADE] hover:bg-[#FFFADE] hover:text-black px-4 py-2 rounded transition-colors duration-200"
                  variants={{
                    open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
                    closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } }
                  }}
                >
                  {loading ? 'Loading...' : 'Sign In'}
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Scroll Arrow */}
      <div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 md:block hidden"
      >
        <button
          onClick={scrollToCurrentEvents}
          className="text-white focus:outline-none animate-bounce"
          aria-label="Scroll to current events"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      {/* Mobile Scroll Arrow - positioned higher to avoid overlap with bottom text */}
      <div
        className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 md:hidden"
      >
        <button
          onClick={scrollToCurrentEvents}
          className="text-white focus:outline-none animate-bounce"
          aria-label="Scroll to current events"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
    </section>
  );
}

export default Hero;
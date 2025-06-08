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

  useEffect(() => {
    // Add random digital noise effect
    const interval = setInterval(() => {
      const blocks = document.querySelectorAll('.glitch-block');
      blocks.forEach(block => {
        if (Math.random() > 0.7) {
          block.style.opacity = Math.random() * 0.5;
          block.style.left = (Math.random() * 100) + '%';
          block.style.top = (Math.random() * 100) + '%';
        }
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar user={user} />
      
      {/* Glitchy 404 Container */}
      <div className="flex-grow relative overflow-hidden bg-black">
        {/* Background noise patterns */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #333 25%, transparent 25%), 
              linear-gradient(-45deg, #333 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #333 75%), 
              linear-gradient(-45deg, transparent 75%, #333 75%)
            `,
            backgroundSize: '4px 4px',
            backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px',
            animation: 'glitchMove 0.3s infinite linear'
          }}
        />
        
        {/* Chaos overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), 
              radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)
            `,
            backgroundSize: '15px 15px, 25px 25px',
            animation: 'chaosMove 0.2s infinite ease-in-out'
          }}
        />
        
        {/* Scan lines */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)',
            animation: 'scanLines 0.1s infinite linear'
          }}
        />
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
          {/* Main 404 text */}
          <div className="relative mb-8">
            <div 
              className="text-6xl md:text-8xl font-bold text-white"
              style={{
                textShadow: '2px 0 #ff0000, -2px 0 #00ffff, 0 2px #ffff00, 0 -2px #ff00ff',
                animation: 'textGlitch 0.15s infinite'
              }}
            >
              404
              
              {/* Glitch layer 1 */}
              <div 
                className="absolute top-0 left-0 text-red-500 opacity-50"
                style={{
                  animation: 'glitchShift1 0.2s infinite',
                  clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)'
                }}
              >
                404
              </div>
              
              {/* Glitch layer 2 */}
              <div 
                className="absolute top-0 left-0 text-cyan-400 opacity-50"
                style={{
                  animation: 'glitchShift2 0.25s infinite',
                  clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)'
                }}
              >
                404
              </div>
            </div>
          </div>
          
          {/* Error message */}
          <div 
            className="text-white text-xl md:text-2xl mb-8 text-center"
            style={{ animation: 'textFlicker 0.5s infinite ease-in-out' }}
          >
            SYSTEM ERROR - PAGE NOT FOUND
          </div>
          
          {/* Navigation links */}
          <div className="flex flex-col md:flex-row gap-4">
            <Link
              to="/"
              className="glitch-link px-6 py-3 border-2 border-white text-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 relative overflow-hidden"
            >
              RETURN HOME
            </Link>
            
            <Link
              to="/events"
              className="glitch-link px-6 py-3 border-2 border-white text-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 relative overflow-hidden"
            >
              VIEW EVENTS
            </Link>
          </div>
        </div>
        
        {/* Random glitch blocks */}
        <div className="glitch-block absolute w-20 h-1 bg-white opacity-10" style={{ left: '10%', top: '20%', animation: 'randomFlicker 0.3s infinite' }} />
        <div className="glitch-block absolute w-15 h-1 bg-white opacity-10" style={{ left: '60%', top: '10%', animation: 'randomFlicker 0.4s infinite' }} />
        <div className="glitch-block absolute w-25 h-0.5 bg-white opacity-10" style={{ left: '30%', top: '70%', animation: 'randomFlicker 0.2s infinite' }} />
        <div className="glitch-block absolute w-10 h-1.5 bg-white opacity-10" style={{ left: '80%', top: '50%', animation: 'randomFlicker 0.5s infinite' }} />
        <div className="glitch-block absolute w-24 h-1 bg-white opacity-10" style={{ left: '5%', top: '80%', animation: 'randomFlicker 0.3s infinite' }} />
        <div className="glitch-block absolute w-18 h-1 bg-white opacity-10" style={{ left: '70%', top: '30%', animation: 'randomFlicker 0.6s infinite' }} />
      </div>
      
      <footer className="bg-gray-800 text-white text-center py-6">
        <p>© {new Date().getFullYear()} Urban Photo Hunts. All rights reserved.</p>
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes glitchMove {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0, 0); }
        }
        
        @keyframes chaosMove {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-1px, 1px) rotate(1deg); }
          50% { transform: translate(1px, -1px) rotate(-1deg); }
          75% { transform: translate(-1px, -1px) rotate(0.5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        
        @keyframes scanLines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
        
        @keyframes textGlitch {
          0% { 
            transform: translate(0); 
            filter: hue-rotate(0deg);
          }
          10% { 
            transform: translate(-2px, 2px); 
            filter: hue-rotate(90deg);
          }
          20% { 
            transform: translate(-4px, -2px); 
            filter: hue-rotate(180deg);
          }
          30% { 
            transform: translate(4px, 2px); 
            filter: hue-rotate(270deg);
          }
          40% { 
            transform: translate(2px, -2px); 
            filter: hue-rotate(360deg);
          }
          50% { 
            transform: translate(-2px, 4px); 
            filter: hue-rotate(0deg);
          }
          60% { 
            transform: translate(-4px, 0px); 
            filter: hue-rotate(90deg);
          }
          70% { 
            transform: translate(4px, -4px); 
            filter: hue-rotate(180deg);
          }
          80% { 
            transform: translate(-2px, -2px); 
            filter: hue-rotate(270deg);
          }
          90% { 
            transform: translate(2px, 4px); 
            filter: hue-rotate(360deg);
          }
          100% { 
            transform: translate(0); 
            filter: hue-rotate(0deg);
          }
        }
        
        @keyframes glitchShift1 {
          0% { transform: translate(0, 0); }
          20% { transform: translate(2px, 0); }
          40% { transform: translate(-2px, 0); }
          60% { transform: translate(0, 2px); }
          80% { transform: translate(0, -2px); }
          100% { transform: translate(0, 0); }
        }
        
        @keyframes glitchShift2 {
          0% { transform: translate(0, 0); }
          15% { transform: translate(-3px, 0); }
          30% { transform: translate(3px, 0); }
          45% { transform: translate(0, -3px); }
          60% { transform: translate(0, 3px); }
          75% { transform: translate(-2px, 2px); }
          90% { transform: translate(2px, -2px); }
          100% { transform: translate(0, 0); }
        }
        
        @keyframes textFlicker {
          0% { opacity: 1; }
          50% { opacity: 0.8; }
          100% { opacity: 1; }
        }
        
        @keyframes randomFlicker {
          0% { opacity: 0.1; }
          50% { opacity: 0.3; }
          100% { opacity: 0.1; }
        }
        
        .glitch-link:hover {
          animation: linkGlitch 0.3s ease-in-out;
        }
        
        @keyframes linkGlitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
          100% { transform: translate(0); }
        }
        
        .glitch-link:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .glitch-link:hover:before {
          left: 100%;
        }
      `}</style>
    </div>
  );
}

export default NotFound;
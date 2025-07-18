import { useState, useEffect, useRef, useCallback } from 'react';
import UPHLogo from '../assets/UPH_Logo.png';
import logoAnimationPath from '../assets/logo-animation-path.json';

function AnimateLogo({ 
  className = "w-32 h-auto md:w-40 lg:w-48",
  animationDelay = 750,
  animationDuration = 5000,
  style = {}
}) {
  // Animation states
  const [revealedAreas, setRevealedAreas] = useState([]);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const logoContainerRef = useRef(null);
  const animationRef = useRef(null);
  const resizeTimeoutRef = useRef(null);

  // Function to reset and restart animation
  const resetAndRestartAnimation = useCallback(() => {
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Clear revealed areas and reset states
    setRevealedAreas([]);
    setAnimationStarted(false);
    setIsResizing(false);

    // Start animation after a brief delay to allow for layout stabilization
    setTimeout(() => {
      setAnimationStarted(true);
      startLogoAnimation();
    }, 50); // Reduced delay
  }, []); 

  // Handle window resize with immediate hiding
  useEffect(() => {
    const handleResize = () => {
      if (!isResizing && animationStarted) {
        setIsResizing(true);
        setRevealedAreas([]); 
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Set a new timeout to restart animation after resize stops
      resizeTimeoutRef.current = setTimeout(() => {
        if (animationStarted) {
          resetAndRestartAnimation();
        }
      }, 100); 
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
      }, [animationStarted, isResizing, resetAndRestartAnimation]);

  // Initialize logo animation
  useEffect(() => {
    // Start animation after initial delay
    const initialTimeout = setTimeout(() => {
      setAnimationStarted(true);
      startLogoAnimation();
    }, animationDelay);

    return () => clearTimeout(initialTimeout);
  }, [animationDelay]);

  const startLogoAnimation = () => {
    if (!logoAnimationPath.coordinates) return;

    const coordinates = logoAnimationPath.coordinates;
    const brushSize = logoAnimationPath.brushSize || 19;
    
    // Calculate scale factors based on current vs recorded logo size
    const currentContainer = logoContainerRef.current?.getBoundingClientRect();
    const recordedSize = logoAnimationPath.logoSize;
    
    if (!currentContainer || !recordedSize) return;
    
    const scaleX = currentContainer.width / recordedSize.width;
    const scaleY = currentContainer.height / recordedSize.height;
    
    let currentIndex = 0;
    const animationStartTime = Date.now();
    
    // Animation settings
    const totalPoints = coordinates.length;
    
    // More marked ease-out easing function (starts earlier and more pronounced)
    const easeOut = (t) => {
      // Apply easing earlier in the timeline and make it more pronounced
      const adjustedT = Math.min(t * 1.3, 1); 
      return 1 - Math.pow(1 - adjustedT, 4); 
    };
    
    const animate = () => {
      if (currentIndex >= coordinates.length) return;
      
      const currentTime = Date.now() - animationStartTime;
      const progress = Math.min(currentTime / animationDuration, 1);
      
      // Apply ease-out to the progress
      const easedProgress = easeOut(progress);
      const targetIndex = Math.floor(easedProgress * totalPoints);
      
      // Reveal points up to the target index
      while (currentIndex <= targetIndex && currentIndex < coordinates.length) {
        const coord = coordinates[currentIndex];
        
        // Scale coordinates to current logo size
        const scaledX = coord.x * scaleX;
        const scaledY = coord.y * scaleY;
        const scaledBrushSize = brushSize * Math.min(scaleX, scaleY);
        
        // Add new revealed area
        setRevealedAreas(prev => [...prev, {
          x: scaledX,
          y: scaledY,
          size: scaledBrushSize
        }]);
        
        currentIndex++;
      }
      
      if (currentIndex < coordinates.length) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={logoContainerRef}
      className="relative"
      style={style}
    >
      {/* Base logo - completely hidden initially */}
      <img
        src={UPHLogo}
        alt="Urban Photo Hunts Logo"
        className={`${className} opacity-0`}
        draggable={false}
      />
      
      {/* Animated logo reveals - individual circles - hidden during resize */}
      <div className="absolute inset-0" style={{ opacity: isResizing ? 0 : 1 }}>
        {revealedAreas.map((area, index) => (
          <div
            key={index}
            className="absolute overflow-hidden"
            style={{
              left: Math.round(area.x - area.size / 2),
              top: Math.round(area.y - area.size / 2),
              width: Math.round(area.size),
              height: Math.round(area.size),
              borderRadius: '50%'
            }}
          >
            <div
              className="absolute"
              style={{
                left: Math.round(-(area.x - area.size / 2)),
                top: Math.round(-(area.y - area.size / 2)),
                width: logoContainerRef.current?.offsetWidth || 0,
                height: logoContainerRef.current?.offsetHeight || 0
              }}
            >
              <img
                src={UPHLogo}
                alt=""
                className={className}
                draggable={false}
                style={{
                  imageRendering: 'auto',
                  transform: 'translateZ(0)', // Force GPU acceleration for better quality
                  backfaceVisibility: 'hidden'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnimateLogo;
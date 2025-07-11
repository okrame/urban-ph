// src/hooks/useDisplayDetection.js
import { useState, useEffect } from 'react';

export const useDisplayDetection = () => {
  const [displayInfo, setDisplayInfo] = useState({
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    isHighDPI: typeof window !== 'undefined' ? window.devicePixelRatio > 1 : false,
    isExternalDisplay: false,
    borderOffset: 7.5
  });

  useEffect(() => {
    const updateDisplayInfo = () => {
      const dpr = window.devicePixelRatio;
      const isHighDPI = dpr > 1;
      
      // Heuristic to detect external display:
      // MacBook Retina displays typically have DPR of 2.0
      // External monitors often have DPR of 1.0 or different values
      const isLikelyMacBookDisplay = dpr === 2.0;
      const isExternalDisplay = !isLikelyMacBookDisplay;

      // Calculate dynamic border offset based on display characteristics
      const calculateBorderOffset = () => {
        // For MacBook internal display (DPR = 2.0): use 0
        // For external displays (DPR ≠ 2.0): use 7.5
        if (dpr === 2.0) {
          return 0;
        } else {
          return 7.5;
        }
      };

      setDisplayInfo({
        devicePixelRatio: dpr,
        isHighDPI,
        isExternalDisplay,
        borderOffset: calculateBorderOffset()
      });
    };

    // Initial update
    updateDisplayInfo();

    // Listen for display changes (connecting/disconnecting monitors)
    const mediaQueryList = window.matchMedia('screen');
    
    // Modern approach: listen to devicePixelRatio changes
    const dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    
    const handleDisplayChange = () => {
      // Small delay to ensure the browser has updated devicePixelRatio
      setTimeout(updateDisplayInfo, 100);
    };

    // Listen for various display-related changes
    mediaQueryList.addEventListener('change', handleDisplayChange);
    dprMediaQuery.addEventListener('change', handleDisplayChange);
    window.addEventListener('resize', handleDisplayChange);

    // Cleanup
    return () => {
      mediaQueryList.removeEventListener('change', handleDisplayChange);
      dprMediaQuery.removeEventListener('change', handleDisplayChange);
      window.removeEventListener('resize', handleDisplayChange);
    };
  }, []);

  return displayInfo;
};
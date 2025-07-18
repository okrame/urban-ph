import { useEffect, useRef, useState } from 'react';

// Global cache per evitare ripetute chiamate API
const geocodingCache = new Map();
let leafletLoaded = false;
let leafletLoading = false;

function LocationMap({ location, isVisible = true, style, className }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isVisible || !location) {
      setIsLoading(false);
      return;
    }

    setMapError(false);
    setIsLoading(true);
    setErrorMessage('');

    // Pre-load Leaflet and initialize map
    initializeMapWithOptimizations();

    return () => {
      // Cleanup map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location, isVisible]);

  // Effect to handle map resize when container size changes
  useEffect(() => {
    if (mapInstanceRef.current && isVisible) {
      // Multiple resize attempts with different delays
      const resizeMap = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };

      // Immediate resize
      resizeMap();
      
      // Additional resizes with delays to handle animation completion
      const timers = [
        setTimeout(resizeMap, 50),
        setTimeout(resizeMap, 150),
        setTimeout(resizeMap, 300),
        setTimeout(resizeMap, 500)
      ];
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [isVisible, style]);

  const loadLeaflet = async () => {
    // If already loaded, return immediately
    if (leafletLoaded && window.L) {
      return Promise.resolve();
    }

    // If already loading, wait for it
    if (leafletLoading) {
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (leafletLoaded && window.L) {
            resolve();
          } else {
            setTimeout(checkLoaded, 50);
          }
        };
        checkLoaded();
      });
    }

    leafletLoading = true;

    return new Promise((resolve, reject) => {
      // Load CSS only once
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      // Load JS only once
      if (!document.querySelector('script[src*="leaflet"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = () => {
          leafletLoaded = true;
          leafletLoading = false;
          resolve();
        };
        script.onerror = () => {
          leafletLoading = false;
          reject(new Error('Failed to load Leaflet'));
        };
        document.head.appendChild(script);
      } else {
        // Script exists, check if loaded
        if (window.L) {
          leafletLoaded = true;
          leafletLoading = false;
          resolve();
        } else {
          // Wait for existing script to load
          const existingScript = document.querySelector('script[src*="leaflet"]');
          existingScript.onload = () => {
            leafletLoaded = true;
            leafletLoading = false;
            resolve();
          };
        }
      }
    });
  };

  const getCachedCoordinates = async (location) => {
    // Check cache first
    if (geocodingCache.has(location)) {
      return geocodingCache.get(location);
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error(`Location "${location}" not found`);
      }

      const coordinates = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };

      // Cache the result
      geocodingCache.set(location, coordinates);
      
      return coordinates;
    } catch (error) {
      throw error;
    }
  };

  const initializeMapWithOptimizations = async () => {
    if (!mapRef.current) {
      setMapError(true);
      setErrorMessage('Map container not available');
      setIsLoading(false);
      return;
    }

    try {
      // Load Leaflet and get coordinates in parallel
      const [, coordinates] = await Promise.all([
        loadLeaflet(),
        getCachedCoordinates(location)
      ]);

      if (!window.L) {
        throw new Error('Leaflet not loaded');
      }

      const { lat, lon } = coordinates;

      // Create map with optimized settings
      const map = window.L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false, // Changed back to SVG for better tile rendering
        fadeAnimation: true, // Enable fade animations
        zoomAnimation: true, // Enable zoom animations
        markerZoomAnimation: true // Enable marker zoom animations
      }).setView([lat, lon], 15);

      // Add tile layer with caching
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        detectRetina: true, // Better quality on retina displays
        updateWhenIdle: false, // Changed to false for immediate updates
        updateWhenZooming: true, // Changed to true for better tile loading
        keepBuffer: 3, // Increased buffer for better coverage
        maxNativeZoom: 18, // Prevent over-zooming
        tileSize: 256, // Standard tile size
        zoomOffset: 0,
        crossOrigin: true
      }).addTo(map);

      // Simplified custom marker (faster rendering)
      const customIcon = window.L.divIcon({
        className: 'custom-marker-optimized',
        html: `<div class="marker-pin"></div>`,
        iconSize: [24, 36],
        iconAnchor: [12, 36]
      });

      // Add marker with optimized popup
      const marker = window.L.marker([lat, lon], { icon: customIcon })
        .addTo(map)
        .bindPopup(location, {
          closeButton: false,
          autoClose: true,
          closeOnEscapeKey: true,
          autoPan: false // Disable auto-panning for better performance
        });

      // Optimized event handling
      let hoverTimeout;
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        marker.on('click', function() {
          if (this.isPopupOpen()) {
            this.closePopup();
          } else {
            this.openPopup();
          }
        });
      } else {
        marker.on('mouseover', function() {
          clearTimeout(hoverTimeout);
          this.openPopup();
        });
        
        marker.on('mouseout', function() {
          hoverTimeout = setTimeout(() => {
            this.closePopup();
          }, 350);
        });

        marker.on('click', function() {
          clearTimeout(hoverTimeout);
          if (this.isPopupOpen()) {
            this.closePopup();
          } else {
            this.openPopup();
          }
        });
      }

      mapInstanceRef.current = map;
      setIsLoading(false);

      // Multiple resize attempts to ensure proper tile loading
      const forceResize = () => {
        if (map && mapRef.current) {
          map.invalidateSize(true); // Force resize with animate: true
        }
      };

      // Schedule multiple resizes
      requestAnimationFrame(() => {
        forceResize();
        setTimeout(forceResize, 100);
        setTimeout(forceResize, 250);
        setTimeout(forceResize, 500);
      });

    } catch (error) {
      setMapError(true);
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add optimized custom marker styles
    const styleId = 'leaflet-custom-marker-optimized';
    
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .custom-marker-optimized {
          background: transparent !important;
          border: none !important;
        }
        .marker-pin {
          width: 24px; 
          height: 36px; 
          background: #6366f1; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        }
        .marker-pin::after {
          content: '';
          width: 8px; 
          height: 8px; 
          background: white; 
          border-radius: 50%; 
          position: absolute;
          top: 6px;
          left: 6px;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!isVisible) return null;

  const containerStyle = {
    height: '100%',
    width: '100%',
    ...style
  };

  const containerClass = `bg-gray-50 border border-gray-200 overflow-hidden relative ${className || ''}`;

  return (
    <div className={containerClass} style={containerStyle}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Optimized Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-xs text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-xl mb-2">📍</div>
            <p className="text-sm font-medium text-gray-700 mb-1">{location}</p>
            <p className="text-xs text-gray-500">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationMap;
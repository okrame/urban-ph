import { useEffect, useRef, useState } from 'react';

function LocationMap({ location, isVisible = true }) {
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

    // Load Leaflet CSS and JS if not already loaded
    loadLeaflet().then(() => {
      initializeMap();
    }).catch((error) => {
      setMapError(true);
      setErrorMessage(`Failed to load map: ${error.message}`);
      setIsLoading(false);
    });

    return () => {
      // Cleanup map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location, isVisible]);

  const loadLeaflet = async () => {
    // Check if Leaflet is already loaded
    if (window.L) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Leaflet'));
      document.head.appendChild(script);
    });
  };

  const initializeMap = async () => {
    if (!mapRef.current || !window.L) {
      setMapError(true);
      setErrorMessage('Map container or Leaflet not available');
      setIsLoading(false);
      return;
    }

    try {
      // Geocoding with Nominatim (OpenStreetMap's geocoding service)
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

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      // Create map
      const map = window.L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([lat, lon], 15);

      // Add tile layer (OpenStreetMap)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Custom marker with your brand color
      const customIcon = window.L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 24px; 
            height: 36px; 
            background: #6366f1; 
            border-radius: 50% 50% 50% 0; 
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            position: relative;
          ">
            <div style="
              width: 8px; 
              height: 8px; 
              background: white; 
              border-radius: 50%; 
              position: absolute;
              top: 6px;
              left: 6px;
            "></div>
          </div>
        `,
        iconSize: [24, 36],
        iconAnchor: [12, 36]
      });

      // Add marker with popup on click/hover
      const marker = window.L.marker([lat, lon], { icon: customIcon })
        .addTo(map)
        .bindPopup(location, {
          closeButton: false,
          autoClose: true,
          closeOnEscapeKey: true
        });

      let hoverTimeout;
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        // Mobile: solo tap per aprire/chiudere
        marker.on('click', function() {
          if (this.isPopupOpen()) {
            this.closePopup();
          } else {
            this.openPopup();
          }
        });
      } else {
        // Desktop: hover + click
        marker.on('mouseover', function() {
          clearTimeout(hoverTimeout);
          this.openPopup();
        });
        
        marker.on('mouseout', function() {
          hoverTimeout = setTimeout(() => {
            this.closePopup();
          }, 350);
        });

        // Click su desktop apre/chiude il popup
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

    } catch (error) {
      setMapError(true);
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add custom marker styles to the document head
    const styleId = 'leaflet-custom-marker-styles';
    
    // Check if styles are already added
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Cleanup function to remove styles when component unmounts
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="w-full h-48 bg-gray-50 border border-gray-200 overflow-hidden relative">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading state */}
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
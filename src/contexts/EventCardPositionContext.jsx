// src/contexts/EventCardPositionContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const EventCardPositionContext = createContext();

export const useEventCardPosition = () => {
  const context = useContext(EventCardPositionContext);
  if (!context) {
    throw new Error('useEventCardPosition must be used within EventCardPositionProvider');
  }
  return context;
};

export const EventCardPositionProvider = ({ children }) => {
  const [eventCardPosition, setEventCardPosition] = useState({
    left: 0,
    right: 0,
    width: 0,
    centerX: 0,
    imageLeft: 0,
    imageRight: 0,
    contentLeft: 0,
    contentRight: 0
  });

  const updateEventCardPosition = useCallback((rect) => {
    if (!rect) return;

    // Convert DOM rectangle to viewport-centered coordinates
    // (Info component uses viewport center as origin)
    const viewportCenterX = window.innerWidth / 2;
    
    // EventCard position relative to viewport center
    const cardLeft = rect.left - viewportCenterX;
    const cardRight = rect.right - viewportCenterX;
    const cardWidth = rect.width;
    const cardCenterX = cardLeft + (cardWidth / 2);

    // Calculate image section (30% width on desktop)
    const imageWidth = cardWidth * 0.3;
    const imageLeft = cardLeft;
    const imageRight = cardLeft + imageWidth;

    // Calculate content section (70% width on desktop)  
    const contentLeft = imageRight;
    const contentRight = cardRight;

    setEventCardPosition({
      left: cardLeft,
      right: cardRight,
      width: cardWidth,
      centerX: cardCenterX,
      imageLeft: imageLeft,
      imageRight: imageRight,
      contentLeft: contentLeft,
      contentRight: contentRight
    });

  }, []);

  return (
    <EventCardPositionContext.Provider 
      value={{ 
        eventCardPosition, 
        updateEventCardPosition,
        isPositionReady: eventCardPosition.width > 0 
      }}
    >
      {children}
    </EventCardPositionContext.Provider>
  );
};
import { useEffect, useRef, useState } from 'react';
import { annotate } from 'rough-notation';

const RoughNotationText = ({ 
  children, 
  type = 'highlight', 
  color = '#8B5CF6', 
  animate = true, 
  animationDelay = 0,
  strokeWidth = 2,
  className = '',
  disabled = false,
  trigger, // New prop to force re-render
  ...props 
}) => {
  const elementRef = useRef(null);
  const annotationRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const prevTriggerRef = useRef(trigger);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get mobile-optimized settings
  const getMobileSettings = () => {
    if (!isMobile) {
      return {
        strokeWidth,
        padding: type === 'highlight' ? 4 : 2,
        animationDuration: 800
      };
    }

    // Mobile optimizations - much tighter annotations
    return {
      strokeWidth: Math.max(1, strokeWidth - 0.5), // Thinner strokes on mobile
      padding: type === 'highlight' ? 1 : 0, // Minimal padding on mobile for tight fit
      animationDuration: 600 // Faster animations on mobile
    };
  };

  useEffect(() => {
    // Immediately hide annotation when trigger changes (prevents ghosting)
    if (trigger !== prevTriggerRef.current && annotationRef.current) {
      try {
        annotationRef.current.hide();
        annotationRef.current.remove();
      } catch {
        // Silently handle removal errors  
      }
      annotationRef.current = null;
      setIsTransitioning(true);
    }
    prevTriggerRef.current = trigger;
  }, [trigger]);

  useEffect(() => {
    if (elementRef.current && !disabled && !isTransitioning) {
      // Clean removal of existing annotation
      if (annotationRef.current) {
        try {
          annotationRef.current.remove();
        } catch (e) {
          // Silently handle removal errors
        }
        annotationRef.current = null;
      }

      // Small delay to ensure DOM is stable
      const createTimer = setTimeout(() => {
        if (elementRef.current && !disabled && !isTransitioning) {
          const settings = getMobileSettings();
          
          annotationRef.current = annotate(elementRef.current, {
            type,
            color,
            strokeWidth: settings.strokeWidth,
            animate,
            animationDuration: settings.animationDuration,
            padding: settings.padding
          });

          // Start animation with delay
          const showTimer = setTimeout(() => {
            if (annotationRef.current) {
              annotationRef.current.show();
            }
          }, animationDelay);

          return () => clearTimeout(showTimer);
        }
      }, isMobile ? 150 : 100); // Slightly longer delay on mobile for stability

      return () => {
        clearTimeout(createTimer);
        if (annotationRef.current) {
          try {
            annotationRef.current.remove();
          } catch (e) {
            // Silently handle removal errors
          }
          annotationRef.current = null;
        }
      };
    }
  }, [type, color, animate, animationDelay, strokeWidth, disabled, children, isTransitioning, isMobile]);

  // Handle transition state for smooth recreation
  useEffect(() => {
    if (trigger > 0 && isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, isMobile ? 250 : 200); // Longer wait on mobile for layout to settle

      return () => clearTimeout(timer);
    }
  }, [trigger, isTransitioning, isMobile]);

  return (
    <span 
      ref={elementRef} 
      className={className}
      style={{
        display: isMobile ? 'inline' : undefined,
        maxWidth: isMobile ? 'fit-content' : undefined
      }}
      {...props}
    >
      {children}
    </span>
  );
};

export default RoughNotationText;
import { useEffect, useRef, useState } from 'react';
import { annotate } from 'rough-notation';

const RoughNotationCircle = ({ 
  children, 
  color = '#000000', 
  animate = true, 
  animationDelay = 0,
  strokeWidth = 1,
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
        padding: 8,
        animationDuration: 600
      };
    }

    // Mobile optimizations - ultra-tight circle
    return {
      strokeWidth: Math.max(1, strokeWidth - 0.7), // Thinner strokes on mobile
      padding: 4.5, // Ultra-minimal padding on mobile for precise fit
      animationDuration: 500 // Faster animations on mobile
    };
  };

  useEffect(() => {
    // Immediately hide annotation when trigger changes (prevents ghosting)
    if (trigger !== prevTriggerRef.current && annotationRef.current) {
      try {
        annotationRef.current.hide();
        annotationRef.current.remove();
      } catch (e) {
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
            type: 'circle',
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
  }, [color, animate, animationDelay, strokeWidth, disabled, children, isTransitioning, isMobile]);

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
      {...props}
    >
      {children}
    </span>
  );
};

export default RoughNotationCircle;
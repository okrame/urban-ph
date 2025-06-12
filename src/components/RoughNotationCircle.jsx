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
  const prevTriggerRef = useRef(trigger);

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
          annotationRef.current = annotate(elementRef.current, {
            type: 'circle',
            color,
            strokeWidth,
            animate,
            animationDuration: 600,
            padding: 8
          });

          // Start animation with delay
          const showTimer = setTimeout(() => {
            if (annotationRef.current) {
              annotationRef.current.show();
            }
          }, animationDelay);

          return () => clearTimeout(showTimer);
        }
      }, 100); // Prevent false starts

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
  }, [color, animate, animationDelay, strokeWidth, disabled, children, isTransitioning]);

  // Handle transition state for smooth recreation
  useEffect(() => {
    if (trigger > 0 && isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 200); // Wait for layout to settle

      return () => clearTimeout(timer);
    }
  }, [trigger, isTransitioning]);

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
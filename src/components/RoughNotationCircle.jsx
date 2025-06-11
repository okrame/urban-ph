import { useEffect, useRef } from 'react';
import { annotate } from 'rough-notation';

const RoughNotationCircle = ({ 
  children, 
  color = '#000000', 
  animate = true, 
  animationDelay = 0,
  strokeWidth = 1,
  className = '',
  disabled = false,
  ...props 
}) => {
  const elementRef = useRef(null);
  const annotationRef = useRef(null);

  useEffect(() => {
    if (elementRef.current && !disabled) {
      // Create circle annotation
      annotationRef.current = annotate(elementRef.current, {
        type: 'circle',
        color,
        strokeWidth,
        animate,
        animationDuration: 600,
        padding: 8
      });

      // Start animation with delay
      const timer = setTimeout(() => {
        if (annotationRef.current) {
          annotationRef.current.show();
        }
      }, animationDelay);

      return () => {
        clearTimeout(timer);
        if (annotationRef.current) {
          annotationRef.current.remove();
          annotationRef.current = null;
        }
      };
    }
  }, [color, animate, animationDelay, strokeWidth, disabled, children]);

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
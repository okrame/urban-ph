import { useEffect, useRef } from 'react';
import { annotate } from 'rough-notation';

const RoughNotationText = ({ 
  children, 
  type = 'underline', 
  color = '#8B5CF6', 
  animate = true, 
  animationDelay = 0,
  strokeWidth = 2,
  className = '',
  disabled = false,
  ...props 
}) => {
  const elementRef = useRef(null);
  const annotationRef = useRef(null);

  useEffect(() => {
    if (elementRef.current && !disabled) {
      // Create annotation
      annotationRef.current = annotate(elementRef.current, {
        type,
        color,
        strokeWidth,
        animate,
        animationDuration: 800,
        padding: 2
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
  }, [type, color, animate, animationDelay, strokeWidth, disabled, children]);

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

export default RoughNotationText;
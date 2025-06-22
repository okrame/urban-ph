import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useEventCardPosition } from '../contexts/EventCardPositionContext';

function Info() {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.1, once: false });
  
  const { eventCardPosition } = useEventCardPosition();
  
  // PARAMETRO PER REGOLARE I VERTICI SMUSSATI
  const borderRadius = 30;
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Scroll-based animation - starts earlier, ends much sooner
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Two separate phases: Phase 1 (overlap) + Phase 2 (square 2 moves to image)
  const progressPhase1 = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const progressPhase2 = useTransform(scrollYProgress, [0.35, 0.6], [0, 1]);

  // Massive squares - 200% of viewport
  const [squareSize, setSquareSize] = useState(400);

  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const size = Math.max(vw, vh) * 2;
      setSquareSize(size);
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Get target position accounting for square size
  const getSquare2Target = () => {
  if (!eventCardPosition || !eventCardPosition.width) {
    return -200;
  }
  const isMobile = window.innerWidth < 768;
  const borderOffset = isMobile ? 7.5 : 0;
  return eventCardPosition.left + borderOffset + (squareSize / 2);
};

  // PHASE 1: Movement to overlapped area
  // Square 1 (green): moves to overlap position and STOPS there
  const square1X = useTransform(progressPhase1, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);
  const square1Y = useTransform(progressPhase1, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);
  
  // Square 2: Two separate phases
  const square2Target = getSquare2Target();
  
  // Combine phases: use phase 1 until complete, then phase 2
  const square2X = useTransform(
    [progressPhase1, progressPhase2],
    ([p1, p2]) => {
      if (p1 < 1) {
        // During phase 1: use phase 1 position
        return squareSize * 0.35 + p1 * (squareSize * 0.45 - squareSize * 0.35);
      } else {
        // After phase 2: use phase 2 position
        return squareSize * 0.45 + p2 * (square2Target - squareSize * 0.45);
      }
    }
  );
  
  const square2Y = useTransform(progressPhase1, [0, 1], [squareSize * 0.35, squareSize * 0.45]);

  // Text "Hunts" - appears AFTER phase 1 is complete (during phase 2)
  const textOpacity = useTransform(progressPhase2, [0, 0.3], [0, 1]);
  const textScale = useTransform(progressPhase2, [0, 0.3], [0.5, 1]);

  // Mobile "Hunts" positioning - calculate square 2's top position and square 1's right edge
  const square2TopY = useTransform(
    progressPhase1,
    [0, 1],
    [
      (squareSize * 0.35) - (squareSize / 2) - 35, // Initial top - margin
      (squareSize * 0.45) - (squareSize / 2) - 35  // Final top - margin
    ]
  );
  
  // Mobile "Hunts" horizontal positioning - just right of square 1's right edge
  const square1RightX = useTransform(
    progressPhase1,
    [0, 1],
    [
      (-squareSize * 0.35) + (squareSize / 2) + 20, // Initial right edge + small margin
      (-squareSize * 0.45) + (squareSize / 2) + 20  // Final right edge + small margin
    ]
  );

  // Italian text positioning - calculate positions for both mobile and desktop
  const italianTextX = useTransform(progressPhase1, [0, 1], [squareSize * 0.1, squareSize * 0.05]);
  const italianTextY = useTransform(progressPhase1, [0, 1], [squareSize * 0.35 - squareSize/2 + 20, squareSize * 0.45 - squareSize/2 + 20]);
  
  // Mobile Italian text positioning - below square 1's bottom edge
  const square1BottomY = useTransform(
    progressPhase1, 
    [0, 1], 
    [
      (-squareSize * 0.35) + (squareSize / 2) + 20, // Initial bottom + reduced margin
      (-squareSize * 0.45) + (squareSize / 2) + 20  // Final bottom + reduced margin
    ]
  );

  const italianTextOpacity = useTransform(progressPhase2, [0, 0.4], [0, 1]);

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white">

      {/* Top-left square - outline only with rounded corners */}
      <motion.div
        className="absolute border-2 border-green-800"
        style={{
          width: squareSize,
          height: squareSize,
          x: square1X,
          y: square1Y,
          borderRadius: `${borderRadius}px`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Bottom-right square - outline only with rounded corners */}
      <motion.div
        className="absolute border-2 border-black"
        style={{
          width: squareSize,
          height: squareSize,
          x: square2X,
          y: square2Y,
          borderRadius: `${borderRadius}px`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />

      {/* "Hunts" text - responsive positioning */}
      <motion.div
        className="absolute text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black text-center"
        style={{
          left: isMobile ? '50%' : '50%',
          top: isMobile ? '50%' : '29%',
          x: isMobile ? square1RightX : '-50%',
          y: isMobile ? square2TopY : '-50%',
          opacity: textOpacity,
          scale: textScale,
        }}
      >
        Hunts
      </motion.div>

      {/* Italian text - responsive positioning based on screen size */}
      <motion.div
        className="absolute text-base sm:text-lg md:text-xl max-w-xs sm:max-w-sm md:max-w-md text-black leading-relaxed"
        style={{
          left: isMobile ? '50%' : '51%',
          top: isMobile ? '50%' : '50%',
          x: isMobile ? '-50%' : italianTextX,
          y: isMobile ? square1BottomY : italianTextY,
          opacity: italianTextOpacity,
          textAlign: 'justify', // Always justified
          maxWidth: isMobile ? '85vw' : undefined,
          width: isMobile ? '85vw' : undefined,
          paddingLeft: isMobile ? '1.5rem' : '0',
          paddingRight: isMobile ? '1.5rem' : '0',
          fontSize: isMobile ? '0.95rem' : undefined,
          lineHeight: isMobile ? '1.5' : undefined,
        }}
      >
        Our photo hunts offer a unique opportunity to <strong>explore the soul of the city</strong> in a creative and sociable way. Through themes developed by experts in culture, history, art history, architecture, ecology, psychology, cuisine and other fields, you will creatively capture the essence of places and discover hidden aspects of the city. The hunts end with an ‘’aperitivo‘’ in <strong>super-local venues</strong>, where you can share your photos and experiences.
      </motion.div>
    </section>
  );
}

export default Info;
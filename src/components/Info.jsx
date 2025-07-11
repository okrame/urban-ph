// src/components/Info.jsx
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useEventCardPosition } from '../contexts/EventCardPositionContext';
import { useDisplayDetection } from '../hooks/useDisplayDetection';
import ImageFiller from './ImageFiller';

function Info() {
  const [activityKind, setActivityKind] = useState('hunts');
  
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.1, once: false });

  const { eventCardPosition } = useEventCardPosition();
  const { borderOffset, devicePixelRatio, isExternalDisplay } = useDisplayDetection();

  // PARAMETRO PER REGOLARE I VERTICI SMUSSATI
  const borderRadius = 30;

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll-based animation
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

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

  // Get target position with dynamic border offset
  const getSquare2Target = () => {
    if (!eventCardPosition || !eventCardPosition.width) {
      return -200;
    }
    
    // Use dynamic borderOffset from the display detection hook
    const dynamicBorderOffset = isMobile ? 7.5 : borderOffset;
    
    return eventCardPosition.left + dynamicBorderOffset + (squareSize / 2);
  };

  // PHASE 1: Movement to overlapped area
  const square1X = useTransform(progressPhase1, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);
  const square1Y = useTransform(progressPhase1, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);

  const square2Target = getSquare2Target();

  const square2X = useTransform(
    [progressPhase1, progressPhase2],
    ([p1, p2]) => {
      if (p1 < 1) {
        return squareSize * 0.35 + p1 * (squareSize * 0.45 - squareSize * 0.35);
      } else {
        return squareSize * 0.45 + p2 * (square2Target - squareSize * 0.45);
      }
    }
  );

  const square2Y = useTransform(progressPhase1, [0, 1], [squareSize * 0.35, squareSize * 0.45]);

  // Text animations
  const textOpacity = useTransform(progressPhase2, [0, 0.3], [0, 1]);
  const textScale = useTransform(progressPhase2, [0, 0.3], [0.5, 1]);

  // Mobile positioning calculations
  const square2TopY = useTransform(
    progressPhase1,
    [0, 1],
    [
      (squareSize * 0.35) - (squareSize / 2) - 35,
      (squareSize * 0.45) - (squareSize / 2) - 35
    ]
  );

  const square1RightX = useTransform(
    progressPhase1,
    [0, 1],
    [
      (-squareSize * 0.35) + (squareSize / 2) + 20,
      (-squareSize * 0.45) + (squareSize / 2) + 20
    ]
  );

  const titleDesktopY = useTransform(
    square2Y,
    (latest) => latest - (squareSize / 2) - 60
  );

  // Italian text positioning
  const italianTextX = useTransform(progressPhase1, [0, 1], [squareSize * 0.1, squareSize * 0.05]);
  const italianTextY = useTransform(progressPhase1, [0, 1], [squareSize * 0.35 - squareSize / 2 + 20, squareSize * 0.45 - squareSize / 2 + 20]);

  const square1BottomY = useTransform(
    progressPhase1,
    [0, 1],
    [
      (-squareSize * 0.35) + (squareSize / 2) + 20,
      (-squareSize * 0.45) + (squareSize / 2) + 20
    ]
  );

  const italianTextOpacity = useTransform(progressPhase2, [0, 0.4], [0, 1]);

  // Content data
  const content = {
    hunts: {
      title: "Hunts",
      text: "Our photo hunts offer a unique opportunity to explore the soul of the city in a creative and sociable way. Through themes developed by experts in culture, history, art history, architecture, ecology, psychology, cuisine and other fields, you will creatively capture the essence of places and discover hidden aspects of the city. The hunts end with an 'aperitivo' in super-local venues, where you can share your photos and experiences."
    },
    workshops: {
      title: "Workshops",
      text: "Master the art of photography with our hands-on workshops led by professional photographers. Learn composition, lighting, and editing techniques in small groups. From beginner basics to advanced techniques, our workshops cover street photography, portrait sessions, and mobile photography. Each session includes practical exercises, personalized feedback, and access to professional equipment."
    }
  };

  const currentContent = content[activityKind];

  return (
    <section 
      ref={ref} 
      className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white"
      style={{ position: 'relative' }}
    >

      {/* Top-left square */}
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

      {/* Bottom-right square */}
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

      <ImageFiller
        square1X={square1X}
        square1Y={square1Y}
        square2X={square2X}
        square2Y={square2Y}
        squareSize={squareSize}
        borderRadius={borderRadius}
        isInView={isInView}
        progressPhase1={progressPhase1}
        progressPhase2={progressPhase2}
      />

      {/* Title text */}
      <motion.div
        className="absolute text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black text-center"
        style={{
          left: isMobile ? '47%' : '50%',
          top: isMobile ? '50%' : '50%',
          x: isMobile ? square1RightX : '-50%',
          y: isMobile ? square2TopY : titleDesktopY,
          opacity: textOpacity,
          scale: textScale,
        }}
      >
        <motion.span
          key={currentContent.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {currentContent.title}
        </motion.span>
      </motion.div>

      {/* Accordion arrow anchored to green square right edge */}
      <motion.button
        onClick={() => setActivityKind(activityKind === 'hunts' ? 'workshops' : 'hunts')}
        className="absolute p-2 hover:bg-gray-200/50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
        aria-label={`Switch to ${activityKind === 'hunts' ? 'workshops' : 'hunts'}`}
        aria-expanded={activityKind === 'workshops'}
        style={{
          left: '50%',
          top: isMobile ? '60%' : '50.5%',
          x: useTransform(square1X, (x) => x + (squareSize / 2) + 20),
          y: isMobile ? square2TopY : titleDesktopY,
          opacity: textOpacity,
          scale: textScale,
        }}
      >
        <svg
          width={isMobile ? "18" : "20"}
          height={isMobile ? "18" : "20"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-700"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </motion.button>

      {/* Italian text */}
      <motion.div
        className="absolute text-base sm:text-lg md:text-xl max-w-xs sm:max-w-sm md:max-w-md text-black leading-relaxed"
        style={{
          left: isMobile ? '50%' : '51%',
          top: isMobile ? '50%' : '50%',
          x: isMobile ? '-50%' : italianTextX,
          y: isMobile ? square1BottomY : italianTextY,
          opacity: italianTextOpacity,
          textAlign: 'justify',
          maxWidth: isMobile ? '85vw' : undefined,
          width: isMobile ? '85vw' : undefined,
          paddingLeft: isMobile ? '1.5rem' : '0',
          paddingRight: isMobile ? '1.5rem' : '0',
          fontSize: isMobile ? '0.95rem' : undefined,
          lineHeight: isMobile ? '1.5' : undefined,
        }}
      >
        <motion.span
          key={currentContent.text}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4, ease: "easeInOut", delay: 0.1 }}
        >
          {currentContent.text}
        </motion.span>
      </motion.div>
    </section>
  );
}

export default Info;
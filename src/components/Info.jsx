import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useEventCardPosition } from '../contexts/EventCardPositionContext';

function Info() {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.1, once: false });
  
  const { eventCardPosition } = useEventCardPosition();
  
  // PARAMETRO PER REGOLARE I VERTICI SMUSSATI
  const borderRadius = 30;
  
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
    const borderOffset = 7.5;

    return eventCardPosition.left + borderOffset + (squareSize / 2);

  };

  // PHASE 1: Movement to overlapped area
  // Square 1 (green): moves to overlap position and STOPS there
  const square1X = useTransform(progressPhase1, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);
  const square1Y = useTransform(progressPhase1, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);
  
  // Square 2: Two separate phases
  // Phase 1: moves to overlap with square 1
  
  // Phase 2: moves from overlap position to EventCard position (FIXED calculation)
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

  // "Hunts" text positioning - reverted to original fixed position (resize-resistant)

  // Italian text positioning - same level as "Hunts", in overlap area
  // But only appears AFTER phase 1 is complete
  const italianTextX = useTransform(progressPhase1, [0, 1], [squareSize * 0.1, squareSize * 0.05]);
  const italianTextY = useTransform(progressPhase1, [0, 1], [squareSize * 0.35 - squareSize/2 + 20, squareSize * 0.45 - squareSize/2 + 20]);

  const italianTextOpacity = useTransform(progressPhase2, [0, 0.4], [0, 1]); // Changed to appear after phase 1

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

      {/* "Hunts" text - appears AFTER overlap, fixed position (resize-resistant) */}
      <motion.div
        className="absolute text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black text-center"
        style={{
          left: '50%',
          top: '29%',
          opacity: textOpacity,
          scale: textScale,
          x: '-50%',
          y: '-50%',
        }}
      >
        Hunts
      </motion.div>

      {/* Italian text - positioned where square 1 crosses square 2, appears AFTER phase 1 */}
      <motion.div
        className="absolute text-base sm:text-lg md:text-xl max-w-xs sm:max-w-sm md:max-w-md text-black leading-relaxed text-justify"
        style={{
          left: '51%',
          top: '50%',
          x: italianTextX,
          y: italianTextY,
          opacity: italianTextOpacity,
        }}
      >
        Le nostre cacce fotografiche sono <strong>esplorazioni di quartieri</strong> e non solo, delineate da temi elaborati da esperti in vari settori, che vanno dalla cultura, alla storia, all'urbanistica, all'ecologia, alla psicologia, per citarne qualcuno. I partecipanti, scoprono le realtà di quartiere interpretando i temi tramite la fotografia, condividendo poi immagini ed esperienze nel corso di <strong>aperitivi in centri culturali locali</strong>.
      </motion.div>
    </section>
  );
}

export default Info;
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

function Info() {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.1, once: false });
  
  // PARAMETRO PER REGOLARE I VERTICI SMUSSATI
  const borderRadius = 30; // Cambia questo valore per regolare l'arrotondamento
  
  // Scroll-based animation - starts earlier, ends much sooner
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // PARAMETRO PER POSIZIONE FINALE QUADRATO 2 (margine sinistro eventcard)
  const eventCardLeftMargin = 0.05; // 5% del viewport - regola secondo il tuo layout
  
  // Extended animation: Phase 1 (overlap) + Phase 2 (square 2 moves left)
  const progressPhase1 = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const progressPhase2 = useTransform(scrollYProgress, [0.35, 0.6], [0, 1]);

  // Massive squares - 200% of viewport
  const [squareSize, setSquareSize] = useState(400);

  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // 200% of larger viewport dimension
      const size = Math.max(vw, vh) * 2;
      setSquareSize(size);
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // PHASE 1: Movement to overlapped area
  // Square 1 (top-left): moves from mostly off-screen to creating overlap
  const square1XPhase1 = useTransform(progressPhase1, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);
  const square1YPhase1 = useTransform(progressPhase1, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);
  
  // Square 2 (bottom-right): moves from mostly off-screen to creating overlap
  const square2XPhase1 = useTransform(progressPhase1, [0, 1], [squareSize * 0.35, squareSize * 0.45]);
  const square2YPhase1 = useTransform(progressPhase1, [0, 1], [squareSize * 0.35, squareSize * 0.45]);

  // PHASE 2: Only square 2 moves horizontally leftward
  // Square 1 stays in overlap position (no additional movement)
  const square1X = square1XPhase1;
  const square1Y = square1YPhase1;
  
  // Square 2 continues moving horizontally left to eventcard margin
  const square2XPhase2 = useTransform(progressPhase2, [0, 1], [squareSize * 0.45, -(window.innerWidth * eventCardLeftMargin)]);
  const square2X = useTransform(scrollYProgress, [0, 0.3, 0.6], [squareSize * 0.35, squareSize * 0.45, -(window.innerWidth * eventCardLeftMargin)]);
  const square2Y = square2YPhase1; // Y position stays the same in phase 2

  // Text "Hunts" - appears when squares overlap (phase 1)
  const textOpacity = useTransform(progressPhase1, [0.6, 1], [0, 1]);
  const textScale = useTransform(progressPhase1, [0.6, 1], [0.5, 1]);

  // Italian text positioning - same level as "Hunts", in overlap area
  const italianTextX = useTransform(progressPhase1, [0, 1], [squareSize * 0.1, squareSize * 0.05]);
  const italianTextY = useTransform(progressPhase1, [0, 1], [squareSize * 0.35 - squareSize/2 + 20, squareSize * 0.45 - squareSize/2 + 20]);

  const italianTextOpacity = useTransform(progressPhase1, [0.4, 0.8], [0, 1]);

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

      {/* "Hunts" text - appears when squares overlap */}
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

      {/* Italian text - positioned where square 1 crosses square 2 */}
      <motion.div
        className="absolute text-sm sm:text-base md:text-lg max-w-xs sm:max-w-sm md:max-w-md text-black leading-relaxed text-justify"

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
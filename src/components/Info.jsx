import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

function Info() {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.1, once: false });
  
  // Scroll-based animation - starts earlier, ends much sooner
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Animation stops much earlier - reduced from [0.1, 0.5] to [0.1, 0.3]
  const progress = useTransform(scrollYProgress, [0.1, 0.35], [0, 1]);

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

  // Movement stops when overlapped area is formed
  // Square 1 (top-left): moves from mostly off-screen to creating smaller overlap
  const square1X = useTransform(progress, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);
  const square1Y = useTransform(progress, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);
  
  // Square 2 (bottom-right): moves from mostly off-screen to creating smaller overlap
  const square2X = useTransform(progress, [0, 1], [squareSize * 0.35, squareSize * 0.45]);
  const square2Y = useTransform(progress, [0, 1], [squareSize * 0.35, squareSize * 0.45]);

  // Text "Hunts" - appears when squares overlap
  const textOpacity = useTransform(progress, [0.6, 1], [0, 1]);
  const textScale = useTransform(progress, [0.6, 1], [0.5, 1]);

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Top-left square - outline only */}
      <motion.div
        className="absolute border-2 border-black"
        style={{
          width: squareSize,
          height: squareSize,
          x: square1X,
          y: square1Y,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Bottom-right square - outline only */}
      <motion.div
        className="absolute border-2 border-black"
        style={{
          width: squareSize,
          height: squareSize,
          x: square2X,
          y: square2Y,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />

      {/* "Hunts" text - appears when squares overlap */}
      <motion.div
        className="absolute text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-black text-center"
        style={{
          left: '50%',
          top: '50%',
          opacity: textOpacity,
          scale: textScale,
          x: '-50%',
          y: '-50%',
        }}
      >
        Hunts
      </motion.div>
    </section>
  );
}

export default Info;
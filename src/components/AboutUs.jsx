// src/components/AboutUs.jsx
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useEventCardPosition } from '../contexts/EventCardPositionContext';
import { useDisplayDetection } from '../hooks/useDisplayDetection';

function AboutUs() {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.1, once: false });

  const { eventCardPosition } = useEventCardPosition();
  const { borderOffset, devicePixelRatio, isExternalDisplay } = useDisplayDetection();

  // Match Info.jsx border radius
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

  const progressPhase1 = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);

  // Square size matching Info.jsx
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

  // Calculate the position (left side) from Info.jsx black square
  const getStartingPosition = () => {
    if (!eventCardPosition || !eventCardPosition.width) {
      return 0;
    }
    
    const dynamicBorderOffset = isMobile 
      ? borderOffset * devicePixelRatio 
      : borderOffset;
      
    // If the black square is at right + offset, we want left - offset - squareSize
    const basePosition = eventCardPosition.left - dynamicBorderOffset - squareSize;
    
    return basePosition;
  };

  const startingX = getStartingPosition();

  // Animation values
  const contentX = useTransform(progressPhase1, [0, 1], [startingX, 0]);
  const contentOpacity = useTransform(progressPhase1, [0, 0.3, 1], [0, 0.5, 1]);
  const contentScale = useTransform(progressPhase1, [0, 1], [0.9, 1]);

  return (
    <section 
      ref={ref} 
      className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50"
    >
      {/* Black square border continuation */}
      <motion.div
        className="absolute border-2 border-black"
        style={{
          width: squareSize,
          height: squareSize,
          left: '50%',
          top: '30%',
          x: startingX,
          y: '-80%',
          borderRadius: `${borderRadius}px`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Main content container */}
      <motion.div
        className="absolute max-w-2xl px-6"
        style={{
          left: '50%',
          top: '50%',
          x: contentX,
          y: '-50%',
          opacity: contentOpacity,
          scale: contentScale,
        }}
      >
        {/* Title */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          transition={{ duration: 0.9, delay: 0.4 }}
        >
          About Us
        </motion.h2>

        {/* Description */}
        <motion.div
          className="space-y-6 text-lg sm:text-xl text-gray-700 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p>
            We are passionate photographers and storytellers who believe that every corner of the world 
            has a unique story to tell. Our mission is to help you discover these hidden narratives 
            through the lens of your camera.
          </p>
          
          <p>
            Founded by a team of professional photographers and local guides, we combine technical 
            expertise with intimate knowledge of the places we explore. Each hunt and workshop is 
            carefully crafted to offer both artistic growth and authentic cultural experiences.
          </p>
          
          <p>
            Whether you're capturing the golden hour light dancing on ancient walls or the spontaneous 
            moments of daily life, we're here to guide you towards creating images that matter.
          </p>
        </motion.div>

        {/* Call to action */}
        <motion.div
          className="mt-12 flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <button className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 font-medium">
            Join Our Next Hunt
          </button>
          <button className="px-8 py-3 border-2 border-black text-black rounded-lg hover:bg-black hover:text-white transition-all duration-200 transform hover:scale-105 font-medium">
            View Our Work
          </button>
        </motion.div>
      </motion.div>


    </section>
  );
}

export default AboutUs;
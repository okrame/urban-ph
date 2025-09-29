// src/components/Info.jsx
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';
import { useEventCardPosition } from '../contexts/EventCardPositionContext';
import { useDisplayDetection } from '../hooks/useDisplayDetection';
import ImageFiller from './ImageFiller';

function Info() {
  const [activityKind, setActivityKind] = useState('hunts');

  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.1, once: false });

  const { eventCardPosition } = useEventCardPosition();
  const { borderOffset, devicePixelRatio, isExternalDisplay } = useDisplayDetection();

  const borderRadius = 30;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const progressPhase1 = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const progressPhase2 = useTransform(scrollYProgress, [0.35, 0.6], [0, 1]);

  const [squareSize, setSquareSize] = useState(400);

  useEffect(() => {
    // Calcola una volta sola all'inizio
    const vw = window.innerWidth;
    const vh = window.innerHeight; // Prendi il valore iniziale con barra visibile
    const size = vw < 768 ? Math.max(vw, vh) * 2.1 : Math.max(vw, vh) * 2;
    setSquareSize(size);

    // Aggiorna SOLO se cambia la larghezza (orientamento)
    const handleOrientationChange = () => {
      const newVw = window.innerWidth;
      // Usa sempre la stessa altezza iniziale
      const size = newVw < 768 ? Math.max(newVw, vh) * 2.1 : Math.max(newVw, vh) * 2;
      setSquareSize(size);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  const getSquare2Target = () => {
    if (!eventCardPosition || !eventCardPosition.width) return -200;
    const dynamicBorderOffset = isMobile ? 7.5 : 7.5//borderOffset + 7.5;
    return eventCardPosition.left + dynamicBorderOffset + (squareSize / 2);
  };

  const square1X = useTransform(progressPhase1, [0, 1], [-squareSize * 0.35, -squareSize * 0.45]);
  const square1Y = useTransform(progressPhase1, [0, 1],
    isMobile
      ? [-squareSize * 0.35, -squareSize * 0.45]  // mobile
      : [-squareSize * 0.32, -squareSize * 0.42]  // desktop
  );

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

  const textOpacity = useTransform(progressPhase2, [0, 0.3], [0, 1]);
  const textScale = useTransform(progressPhase2, [0, 0.3], [0.5, 1]);

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

  const titleDesktopY = useTransform(square2Y, (latest) => latest - (squareSize / 2) - 60);

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

  const italianTextOpacity = useTransform(
    isMobile ? scrollYProgress : progressPhase2,
    isMobile ? [0.45, 0.65] : [0, 0.4],
    [0, 1]
  );

  const tempVal = isMobile ? 90 : 87;
  const solidClipPath = `inset(0 0 ${tempVal}% 0)`;
  const clipInsetDashed = useTransform(scrollYProgress, [0.5, 1], [squareSize * 0.90, 0]);


  const content = {
    hunts: {
      title: "Hunts",
      text: "<span class='text-2xl font-bold inline'>Photo hunts</span> offer a unique opportunity to <strong>explore the soul of the city</strong> in a creative and sociable way. Through themes developed by experts in culture, history, art history, architecture, ecology, psychology, cuisine and other fields, you will creatively capture the essence of places and discover hidden aspects of the city. The hunts end with an ‘’aperitivo‘’ in <strong>super-local venues</strong>, where you can share your photos and experiences."
    },
    walks: {
      title: "Walks",
      text: "<span class='text-2xl font-bold inline'>The walks</span> we organize are a spinoff of our hunts, they are in-depth guided explorations focusing on <strong>storytelling</strong>, local history, and discovering the city from different perspectives and expert knowledges – from cinema, to wildlife to art history and more."
    },
    workshops: {
      title: "Workshops",
      text: "<span class='text-2xl font-bold inline'>The workshops</span> we conduct range from photography and <strong>analog printing</strong> to <strong>pinhole photography</strong>,  <strong>cyanotype</strong>, <strong>drawing & illustration</strong>, <strong>collage</strong>, <strong>photoshop & canvas</strong> and more.<br>We are always open to new collaborations."
    },

    exhibitions: {
      title: "Exhibitions",
      text: "We regularly organize <strong>exhibitions</strong> to showcase the <strong>artwork</strong> of our community, be it photos, collages or other. This year, our <strong>biggest exhibit</strong>, a 10-year archive outing, is in the making: <strong>10 years of everyday Rome</strong> in its micro neighbourhood realities. <br>STAY TUNED"
    },
  };

  const currentContent = content[activityKind];

  const verticalLetterHeight = isMobile ? 12 : 0; // stima, regola a piacere!
  const letters = currentContent.title.length;
  const offset = verticalLetterHeight * (letters - 1);

  // Nuova motion value per la posizione Y del titolo su mobile
  const mobileTitleY = useTransform(
    square2TopY,
    (y) => y + (isMobile ? -offset : 0)
  );

  return (
    <section ref={ref} className="relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full" style={{
        height: isMobile ? squareSize * 0.60 : squareSize * 0.35
      }} />

      <motion.div
        className="absolute border-2 border-green-800"
        style={{
          width: squareSize,
          height: squareSize,
          x: square1X,
          y: square1Y,
          borderRadius: borderRadius
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Bordo pieno: copre tutto */}
      <motion.div
        className="absolute border-2 border-black"
        style={{
          width: squareSize,
          height: squareSize,
          x: square2X,
          y: square2Y,
          borderRadius: borderRadius,
          clipPath: solidClipPath
        }}
      />

      <motion.svg
        className="absolute pointer-events-none"
        style={{ x: square2X, y: square2Y }}
        width={squareSize}
        height={squareSize}
      >
        <motion.rect
          x="0" y="0"
          width={squareSize} height={squareSize}
          rx={borderRadius} ry={borderRadius}
          fill="none"
          stroke="black"
          strokeWidth="4"
          strokeDasharray="4 20" // dash=12, gap=8
          style={{ clipPath: useMotionTemplate`inset(10% 0 ${clipInsetDashed} 0)` }}
        />
      </motion.svg>


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
        currentContent={activityKind}
      />

      <motion.div
        className="absolute text-[1.26rem] sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black text-center"
        style={{
          left: isMobile ? '47%' : '50%',
          top: isMobile ? '50%' : '50%',
          x: isMobile ? square1RightX : '-50%',
          y: isMobile ? mobileTitleY : titleDesktopY,
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
          style={
            isMobile
              ? {
                writingMode: "vertical-lr",
                textOrientation: "mixed", // opzionale, migliora la resa
                letterSpacing: "0.09em",
                whiteSpace: "nowrap",
                display: "inline-block",
              }
              : undefined
          }
        >
          {currentContent.title}
        </motion.span>
      </motion.div>

      <motion.button
        onClick={() => setActivityKind(
          activityKind === 'hunts' ? 'walks' :
            activityKind === 'walks' ? 'workshops' :
              activityKind === 'workshops' ? 'exhibitions' :
                'hunts'
        )}
        className="absolute p-2 bg-gray-200/50 rounded-full transition-all duration-200 
      focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
        aria-label={`Switch to ${activityKind === 'hunts' ? 'walks' :
            activityKind === 'walks' ? 'workshops' :
              activityKind === 'workshops' ? 'exhibitions' :
                'hunts'
          }`}
        aria-expanded={activityKind === 'workshops'}
        style={{
          left: '50%',
          top: isMobile ? '60%' : '50.5%',
          x: useTransform(square1X, (x) => x + (squareSize / 2) + 20),
          y: isMobile ? square2TopY : titleDesktopY,
          opacity: textOpacity,
          scale: textScale,
          zIndex: 50,
          pointerEvents: 'auto'
        }}
      >

        <svg
          width={isMobile ? "18" : "24"}
          height={isMobile ? "18" : "24"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-700"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </motion.button>

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
          lineHeight: isMobile ? '1.5' : undefined
        }}
      >
        <motion.span
          key={currentContent.text}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{
            duration: 0.4,
            ease: "easeInOut",
            delay: isMobile ? 0.3 : 0.1
          }}
          dangerouslySetInnerHTML={{ __html: currentContent.text }}
        />
      </motion.div>
      <div
        aria-hidden
        className="w-full"
        style={{ height: isMobile ? squareSize * 0.40 : squareSize * 0.48 }}
      />
    </section>
  );
}

export default Info;

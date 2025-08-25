import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";

// Import profile images
import beatriceImg from "../assets/profiles/Beatrice.png";
import lucaImg from "../assets/profiles/Luca.png";
import raffaellaImg from "../assets/profiles/Raffaella.png";
import niccoloImg from "../assets/profiles/Niccolò.png";
import marcoImg from "../assets/profiles/Marco.png";

export default function AboutUs({ verticalLinePosition = 30 }) {
  const sectionRef = useRef(null);
  const counterRef = useRef(null);
  const statsRef = useRef(null);
  const paragraphRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [paragraphHeight, setParagraphHeight] = useState(0);

  const titleRef = useRef(null);
  const aboutRef = useRef(null);
  const usRef = useRef(null);
  const [aLeftPx, setALeftPx] = useState(null);
  const [usRightPx, setUsRightPx] = useState(null);

  // Animated counters setup
  const membersCount = useMotionValue(0);
  const eventsCount = useMotionValue(0);
  const locationsCount = useMotionValue(0);
  const partnershipsCount = useMotionValue(0);
  
  const membersRounded = useTransform(membersCount, Math.round);
  const eventsRounded = useTransform(eventsCount, Math.round);
  const locationsRounded = useTransform(locationsCount, Math.round);
  const partnershipsRounded = useTransform(partnershipsCount, Math.round);

  // Scroll triggers for counter animations
  const isCounterInView = useInView(counterRef, { 
    once: true, 
    threshold: 0.3,
    rootMargin: '0px 0px -20% 0px'
  });

  const isStatsInView = useInView(statsRef, { 
    once: true, 
    threshold: 0.3,
    rootMargin: '0px 0px -20% 0px'
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Measure paragraph height
  useEffect(() => {
    const measureParagraph = () => {
      if (paragraphRef.current) {
        setParagraphHeight(paragraphRef.current.offsetHeight);
      }
    };

    measureParagraph();
    window.addEventListener('resize', measureParagraph);
    
    // Use ResizeObserver for more accurate measurements
    const resizeObserver = new ResizeObserver(measureParagraph);
    if (paragraphRef.current) {
      resizeObserver.observe(paragraphRef.current);
    }

    return () => {
      window.removeEventListener('resize', measureParagraph);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const measure = () => {
      if (aboutRef.current) {
        const aboutBox = aboutRef.current.getBoundingClientRect();
        setALeftPx(aboutBox.left);
      }
      if (usRef.current) {
        const usBox = usRef.current.getBoundingClientRect();
        setUsRightPx(usBox.right);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [verticalLinePosition, isMobile]);

  // Start members counter animation when counter comes into view
  useEffect(() => {
    if (isCounterInView) {
      const animation = animate(membersCount, 244, { 
        duration: 2.5,
        ease: "easeOut"
      });

      return animation.stop;
    }
  }, [membersCount, isCounterInView]);

  // Start stats counters animation when stats come into view
  useEffect(() => {
    if (isStatsInView) {
      const animations = [
        animate(eventsCount, 76, { 
          duration: 2,
          ease: "easeOut",
          delay: 0.3
        }),
        animate(locationsCount, 25, { 
          duration: 2,
          ease: "easeOut",
          delay: 0.5
        }),
        animate(partnershipsCount, 12, { 
          duration: 2,
          ease: "easeOut",
          delay: 0.7
        })
      ];

      return () => animations.forEach(animation => animation.stop());
    }
  }, [eventsCount, locationsCount, partnershipsCount, isStatsInView]);

  const isLineOnLeft = verticalLinePosition <= 50;

  const getExpandedTextStyles = () => {
    const textWidth = 65;
    const gap = 2;

    if (isLineOnLeft) {
      return {
        maxWidth: '750px',
        width: `${textWidth}%`,
        left: `${verticalLinePosition + gap}%`
      };
    } else {
      return {
        maxWidth: '750px',
        width: `${textWidth}%`,
        left: `${verticalLinePosition - gap - textWidth}%`
      };
    }
  };

  const getCounterStyles = () => {
    if (isMobile) {
      return {
        maxWidth: '85vw',
        width: '85vw',
        marginTop: '2rem'
      };
    } else {
      // Position counter on external side of vertical line (opposite of text)
      const counterWidth = 35;
      const gap = 2;

      if (isLineOnLeft) {
        // If line is on left, put counter on the far left
        return {
          maxWidth: '400px',
          width: `${counterWidth}%`,
          left: `${gap}%`,
          top: '300px'
        };
      } else {
        // If line is on right, put counter on the far right
        return {
          maxWidth: '400px',
          width: `${counterWidth}%`,
          left: `${100 - gap - counterWidth}%`,
          top: '300px'
        };
      }
    }
  };

  const getStatsStyles = () => {
    if (isMobile) {
      return {
        maxWidth: '85vw',
        width: '85vw',
        marginTop: '2rem'
      };
    } else {
      // Position stats row below the paragraph text with dynamic spacing
      const textWidth = 65;
      const gap = 2;
      // Add 30px below the paragraph for spacing
      const topPosition = 10 + paragraphHeight + 30;

      if (isLineOnLeft) {
        return {
          maxWidth: '750px',
          width: `${textWidth}%`,
          left: `${verticalLinePosition + gap}%`,
          top: `${topPosition}px`
        };
      } else {
        return {
          maxWidth: '750px',
          width: `${textWidth}%`,
          left: `${verticalLinePosition - gap - textWidth}%`,
          top: `${topPosition}px`
        };
      }
    }
  };

  // Calculate dynamic spacer height based on paragraph and stats
  const getSpacerHeight = () => {
    if (isMobile) return 0;
    // Base height + paragraph height + stats spacing + stats height
    return Math.max(500, paragraphHeight + 150);
  };

  // Team data with images
  const teamMembers = [
    { name: 'Beatrice', image: beatriceImg },
    { name: 'Luca', image: lucaImg },
    { name: 'Raffaella', image: raffaellaImg },
    { name: 'Niccolò', image: niccoloImg },
    { name: 'Marco', image: marcoImg }
  ];

  return (
    <section
      ref={sectionRef}
      data-section="about-us"
      className="relative w-full flex flex-col items-center justify-start bg-transparent"
      style={{ minHeight: "80vh" }}
    >
      {isMobile ? <div style={{ height: "12px" }} /> : <div style={{ height: "120px" }} />}

      {/* Container for both title and text */}
      <div className="relative w-full max-w-6xl mx-auto px-4">

        {/* Title - Desktop: split across vertical line, Mobile: centered */}
        <div ref={titleRef} className="relative z-10 flex items-center justify-center h-[10px] mb-6">
          {isMobile ? (
            // Mobile: Centered title
            <h1 className="text-2xl sm:text-3xl font-bold text-black text-center">
              about Us
            </h1>
          ) : (
            // Desktop: Split title across vertical line
            <>
              <span
                ref={aboutRef}
                className="absolute font-bold text-black text-center text-[clamp(1.25rem,4.5vw,3rem)]"
                style={{
                  left: `${verticalLinePosition}%`,
                  transform: 'translateX(-100%) translateX(-10px) translateY(-20px)',
                }}
              >
                about
              </span>

              <span
                ref={usRef}
                className="absolute font-bold text-black text-center text-[clamp(1.25rem,4.5vw,3rem)]"
                style={{
                  left: `${verticalLinePosition}%`,
                  transform: 'translateX(10px) translateY(-20px)',
                }}
              >
                Us
              </span>
            </>
          )}
        </div>

        {/* Paragraph Text */}
        <div
          ref={paragraphRef}
          className={`${isMobile
            ? "relative z-10 mx-auto px-6 text-black leading-relaxed bg-transparent"
            : "absolute z-10 p-8 text-gray-700 leading-relaxed bg-transparent"
            }`}
          style={{
            fontSize: "1.1rem",
            fontWeight: 500,
            textAlign: "justify",
            lineHeight: "1.6",
            ...(isMobile
              ? {
                maxWidth: '85vw',
                width: '85vw',
                marginBottom: '2rem'
              }
              : {
                ...getExpandedTextStyles(),
                top: '10px'
              }
            )
          }}
        >
          Starting in London in 2015, moving through Barcelona in 2016, and Rome in 2017, we transformed a hobby into a cultural association dedicated to <strong>reimagining the city</strong> and our place within it. We organize workshops, exhibitions, and other events, providing participants with a platform to express their creativity and explore the many facets of local areas. Our goal is to create a <strong>deeper, more mindful connection between individuals and the spaces</strong> they navigate, encouraging them to interact, explore, and reflect on the visual and mental experiences that cities offer, while fostering a sense of <strong>care for the urban environments</strong> they inhabit.
        </div>

        {/* Additional Stats Row - Desktop: below paragraph, Mobile: below members counter */}
        <div
          ref={statsRef}
          className={`${isMobile
            ? "relative z-10 mx-auto px-6 bg-transparent"
            : "absolute z-10 p-8 bg-transparent"
            }`}
          style={{
            ...(isMobile
              ? {
                maxWidth: '85vw',
                width: '85vw',
                marginBottom: '2rem',
                order: 2 // Will appear after members counter in mobile
              }
              : {
                ...getStatsStyles()
              }
            )
          }}
        >
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Events */}
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isStatsInView ? 1 : 0, 
                y: isStatsInView ? 0 : 20 
              }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.h3 className="font-bold text-green-800 text-2xl sm:text-3xl">
                {eventsRounded}
              </motion.h3>
              <p className="text-xs sm:text-sm text-green-800 font-medium uppercase tracking-wider mt-1">
                events
              </p>
            </motion.div>

            {/* Locations */}
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isStatsInView ? 1 : 0, 
                y: isStatsInView ? 0 : 20 
              }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.h3 className="font-bold text-green-800 text-2xl sm:text-3xl">
                {locationsRounded}
              </motion.h3>
              <p className="text-xs sm:text-sm text-green-800 font-medium uppercase tracking-wider mt-1">
                locations
              </p>
            </motion.div>

            {/* Partnerships */}
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isStatsInView ? 1 : 0, 
                y: isStatsInView ? 0 : 20 
              }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <motion.h3 className="font-bold text-green-800 text-2xl sm:text-3xl">
                {partnershipsRounded}
              </motion.h3>
              <p className="text-xs sm:text-sm text-green-800 font-medium uppercase tracking-wider mt-1">
                partnerships
              </p>
            </motion.div>
          </div>
        </div>

        {/* Animated Member Counter */}
        <div
          ref={counterRef}
          className={`${isMobile
            ? "relative z-10 mx-auto px-6 text-center bg-transparent"
            : "absolute z-10 p-8 text-center bg-transparent"
            }`}
          style={{
            ...(isMobile
              ? {
                maxWidth: '85vw',
                width: '85vw',
                marginBottom: '2rem',
                order: 1 // Will appear before stats in mobile
              }
              : {
                ...getCounterStyles()
              }
            )
          }}
        >
          <motion.div className="flex flex-col items-center">
            <motion.h2 
              className="font-bold text-purple-800 text-[clamp(1.25rem,4.5vw,3rem)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isCounterInView ? 1 : 0, 
                y: isCounterInView ? 0 : 20 
              }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {membersRounded}
            </motion.h2>
            <motion.p 
              className="text-sm sm:text-base text-purple-600 font-medium uppercase tracking-wider text-[clamp(1.25rem,4.5vw,3rem)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: isCounterInView ? 1 : 0, 
                y: isCounterInView ? 0 : 10 
              }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              active members
            </motion.p>
          </motion.div>
        </div>

        {/* Spacer for desktop absolutely positioned text */}
        {!isMobile && <div style={{ height: `${getSpacerHeight()}px` }} />}

      </div>

      {/* Team profiles */}
      <div className="w-full max-w-6xl mx-auto mt-16 px-6 pb-16">
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {teamMembers.map((member, index) => (
            <motion.div 
              key={index} 
              className="flex flex-col items-center"
              whileHover={!isMobile ? {
                scale: 1.15,
                zIndex: 10,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 10,
                  mass: 0.5
                }
              } : {}}
            >
              <motion.div 
                className={`relative w-full aspect-square rounded-full mb-2 sm:mb-3 overflow-hidden ${
                  isMobile ? "max-w-[80px] sm:max-w-[100px]" : ""
                }`}
                style={{ transformOrigin: 'center center' }}
                whileHover={!isMobile ? {
                  boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                } : {}}
              >
                <img 
                  src={member.image} 
                  alt={`${member.name} profile`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.span 
                className="text-gray-700 text-xs sm:text-sm text-center"
                whileHover={!isMobile ? {
                  scale: 1.1,
                  fontWeight: 600,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 10
                  }
                } : {}}
              >
                {member.name}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
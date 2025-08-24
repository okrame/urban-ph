import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";

export default function AboutUs({ verticalLinePosition = 30 }) {
  const sectionRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  const titleRef = useRef(null);
  const aboutRef = useRef(null);
  const usRef = useRef(null);
  const [aLeftPx, setALeftPx] = useState(null);     // left edge of the "a" in "about"
  const [usRightPx, setUsRightPx] = useState(null); // right edge of the "s" in "Us"

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const measure = () => {
      if (aboutRef.current) {
        const aboutBox = aboutRef.current.getBoundingClientRect();
        setALeftPx(aboutBox.left);     // viewport-left px of the "a"
      }
      if (usRef.current) {
        const usBox = usRef.current.getBoundingClientRect();
        setUsRightPx(usBox.right);     // viewport-left px of the "s" right edge
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [verticalLinePosition, isMobile]);



  // Determine if line is on left or right side of center
  const isLineOnLeft = verticalLinePosition <= 50;

  // Still available if you want to animate something with scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"]
  });

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
              {/* Full-width horizontal dashed line behind the title */}
              <div
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-screen"
                style={{ top: '-15px', height: 0, zIndex: 0 }}
              >
                {isLineOnLeft ? (
                  <div
                    className="absolute"
                    style={{
                      left: 0,
                      width: (aLeftPx ?? 0) - 15,
                      height: 0,
                      borderTop: "2px dashed transparent",
                      borderImage:
                        "repeating-linear-gradient(to right, black 0, black 8px, transparent 8px, transparent 20px) 1",
                    }}
                  />
                ) : (
                  <div
                    className="absolute"
                    style={{
                      left: (usRightPx ?? 0) + 15,
                      right: 0,
                      height: 0,
                      borderTop: "2px dashed transparent",
                      borderImage:
                        "repeating-linear-gradient(to right, black 0, black 8px, transparent 8px, transparent 20px) 1",
                    }}
                  />
                )}

              </div>

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

        {/* Spacer for desktop absolutely positioned text */}
        {!isMobile && <div style={{ height: "400px" }} />}

      </div>

      {/* Team profiles */}
      <div className="w-full max-w-6xl mx-auto mt-16 px-6 pb-16">
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-full aspect-square bg-gray-200 rounded-full mb-2 sm:mb-3 flex items-center justify-center ${isMobile ? "max-w-[80px] sm:max-w-[100px]" : ""
                }`}>
                <span className="text-gray-500 text-xs sm:text-sm">Profile {index}</span>
              </div>
              <span className="text-gray-700 text-xs sm:text-sm text-center">Nome {index}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
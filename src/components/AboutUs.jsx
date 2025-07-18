import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";

export default function AboutUs({ verticalLinePosition = 30 }) {
  const sectionRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine if line is on left or right side of center
  const isLineOnLeft = verticalLinePosition <= 50;

  // Still available if you want to animate something with scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"]
  });

  return (
    <section
      ref={sectionRef}
      className="relative w-full flex flex-col items-center justify-start bg-transparent"
      style={{ minHeight: "80vh" }}
    >
      {isMobile ? <div style={{ height: "12px" }} /> : <div style={{ height: "120px" }} />}

      {/* Container for both title and text */}
      <div className="relative w-full max-w-6xl mx-auto px-4">
        
        {/* Title - Desktop: split across vertical line, Mobile: centered */}
        <div className="relative z-10 flex items-center justify-center h-[10px] mb-6">
          {isMobile ? (
            // Mobile: Centered title
            <h1 className="text-2xl sm:text-3xl font-bold text-black text-center">
              About Us
            </h1>
          ) : (
            // Desktop: Split title across vertical line
            <>
              <span 
                className="absolute text-[1.26rem] sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black text-center"
                style={{ 
                  left: `${verticalLinePosition}%`,
                  transform: 'translateX(-100%) translateX(-10px) translateY(-20px)',
                }}
              >
                about
              </span>
              
              <span 
                className="absolute text-[1.26rem] sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black text-center"
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
          className={`${
            isMobile 
              ? "relative z-10 mx-auto px-6 text-black leading-relaxed bg-transparent" 
              : "absolute z-10 p-8 text-gray-700 leading-relaxed bg-transparent"
          }`}
          style={{
            fontSize: isMobile ? "0.95rem" : "1.1rem",
            fontWeight: 500,
            textAlign: "justify",
            lineHeight: isMobile ? "1.5" : "1.6",
            ...(isMobile 
              ? {
                  maxWidth: '85vw',
                  width: '85vw',
                  marginBottom: '2rem'
                }
              : {
                  maxWidth: '600px',
                  width: '50%',
                  left: isLineOnLeft 
                    ? `${verticalLinePosition + 2}%`
                    : `${verticalLinePosition - 52}%`,
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
              <div className={`w-full aspect-square bg-gray-200 rounded-full mb-2 sm:mb-3 flex items-center justify-center ${
                isMobile ? "max-w-[80px] sm:max-w-[100px]" : ""
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
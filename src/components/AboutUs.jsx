import React, { useRef } from "react";
import { motion, useScroll } from "framer-motion";

export default function AboutUs({ verticalLinePosition = 30 }) {
  const sectionRef = useRef(null);
  
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
      <div style={{ height: "120px" }} />

      {/* Container for both title and text - positioned relative to vertical line */}
      <div className="relative w-full max-w-6xl mx-auto px-4">
        
        {/* Title split across vertical line */}
        <div className="relative z-10 flex items-center justify-center h-[10px] mb-8">
          {/* "About" positioned to the left of the vertical line */}
          <span 
            className="absolute text-[1.26rem] sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black text-center"
            style={{ 
              left: `${verticalLinePosition}%`,
              transform: 'translateX(-100%) translateX(-10px) translateY(-20px)',
              //bottom: '1px' 
            }}
          >
            about
          </span>
          
          {/* "Us" positioned to the right of the vertical line */}
          <span 
            className="absolute text-[1.26rem] sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black text-center"
            style={{ 
              left: `${verticalLinePosition}%`,
              transform: 'translateX(10px) translateY(-20px)',
              //bottom: '1px' 
            }}
          >
            Us
          </span>
        </div>

        {/* Paragraph Text positioned relative to the vertical line */}
        <div
          className="absolute z-10 p-8 text-gray-700 text-justify leading-relaxed bg-transparent"
          style={{
            fontSize: "1.1rem",
            fontWeight: 500,
            maxWidth: '600px',
            width: '50%',
            left: isLineOnLeft 
              ? `${verticalLinePosition + 2}%`  // If line is on left, position text slightly to the right
              : `${verticalLinePosition - 52}%`, // If line is on right, position text slightly to the left (50% width + 2% gap)
            top: '10px' // Start just below the title
          }}
        >
          Starting in London in 2015, moving through Barcelona in 2016, and Rome in 2017, we transformed a hobby into a cultural association dedicated to <strong>reimagining the city</strong> and our place within it. We organize workshops, exhibitions, and other events, providing participants with a platform to express their creativity and explore the many facets of local areas. Our goal is to create a <strong>deeper, more mindful connection between individuals and the spaces</strong> they navigate, encouraging them to interact, explore, and reflect on the visual and mental experiences that cities offer, while fostering a sense of <strong>care for the urban environments</strong> they inhabit.
        </div>
        
        {/* Spacer for the absolutely positioned text */}
        <div style={{ height: "400px" }} />
        
      </div>

      {/* Team profiles */}
      <div className="w-full max-w-6xl mx-auto mt-16 px-6 pb-16">
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-full aspect-square bg-gray-200 rounded-full mb-3 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Profile {index}</span>
              </div>
              <span className="text-gray-700 text-sm text-center">Nome {index}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
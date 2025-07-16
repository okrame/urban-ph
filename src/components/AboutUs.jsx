import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function AboutUs() {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start center"]
  });

  const width = useTransform(scrollYProgress, [0, 1], ["100vw", "40vw"]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full flex flex-col items-center justify-start bg-transparent"
      style={{ minHeight: "80vh", height: "600px" }}
    >
      <div style={{ height: "48px" }} />

      {/* Spezzato in due rettangoli */}
      <div className="relative flex items-center justify-center" style={{ width: "100%", height: "56px" }}>
        {/* Primo segmento */}
        <motion.div
          className="border-l-2 border-b-2 border-black"
          style={{
            width: width,
            height: "28px",
            position: "absolute",
            left: 0,
            top: 0,
            background: "transparent",
            borderTop: "none",
            borderRight: "none",
            borderRadius: 0,
            boxSizing: "border-box"
          }}
        />
        {/* Secondo segmento */}
        <motion.div
          className="border-r-2 border-t-2 border-black"
          style={{
            width: width,
            height: "28px",
            position: "absolute",
            right: 0,
            bottom: 0,
            background: "transparent",
            borderBottom: "none",
            borderLeft: "none",
            borderRadius: 0,
            boxSizing: "border-box"
          }}
        />
        {/* Testo al centro */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
          <span className="text-black font-semibold text-lg uppercase tracking-wide bg-white px-4">
            About Us
          </span>
        </div>
      </div>

      {/* Testo nella metà sinistra */}
      <div className="w-full max-w-6xl mx-auto mt-16 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-gray-700 text-justify leading-relaxed">
              Starting in London in 2015, moving through Barcelona in 2016, and Rome in 2017, we transformed a hobby into a cultural association dedicated to <strong>reimagining the city</strong> and our place within it. We organize workshops, exhibitions, and other events, providing participants with a platform to express their creativity and explore the many facets of local areas. Our goal is to create a <strong>deeper, more mindful connection between individuals and the spaces</strong> they navigate, encouraging them to interact, explore, and reflect on the visual and mental experiences that cities offer, while fostering a sense of <strong>care for the urban environments</strong> they inhabit.
            </p>
          </div>
        </div>
      </div>

      {/* 5 placeholder per immagini di profilo */}
      <div className="w-full max-w-6xl mx-auto mt-16 px-6">
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

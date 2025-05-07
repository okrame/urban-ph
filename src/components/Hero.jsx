import { useState, useEffect, useRef } from 'react';
import gianicolo from '../assets/gianicolo.jpg';

function Hero() {
  const [path, setPath] = useState('');
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const startLetterRef = useRef(null);
  const endTextRef = useRef(null);

  // Generate the path on mount and resize
  useEffect(() => {
    const handleResize = () => generatePath();
    generatePath();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generatePath = () => {
    if (!containerRef.current || !startLetterRef.current || !endTextRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const startRect = startLetterRef.current.getBoundingClientRect();
    const endRect = endTextRef.current.getBoundingClientRect();

    // Start from bottom-right of the "O"
    const startX = startRect.right - container.left;
    const startY = startRect.bottom - container.top;

    // Underline position: further below the end text to emphasize it
    const underlineY = endRect.bottom - container.top + 20; // 20px below text
    const underlineStartX = endRect.left - container.left;
    const underlineEndX = underlineStartX + endRect.width;

    // Loop circle center adjusted lower
    const centerX = container.width / 2.025;
    const centerY = container.height * 0.6; // lowered on the photo to center vertically
    // Halved radius for the central loop
    const loopRadius = Math.min(80, container.width * 0.08) / 1.5;

    let d = `M${startX},${startY}`;

    // Pre-loop smooth sinusoidal curve
    const amplitude = Math.min(30, container.height * 0.05);
    const wavelength = Math.min(150, container.width * 0.15);
    const step = Math.min(10, container.width * 0.01);
    const preLoopEndX = centerX - loopRadius;
    for (let x = startX; x <= preLoopEndX; x += step) {
      const phase = ((x - startX) / wavelength) * (Math.PI * 2);
      const y = startY + Math.sin(phase) * amplitude;
      d += ` L${x},${y}`;
    }

    // Perfect circle around center
    const loopStartX = preLoopEndX;
    const loopStartY = startY + Math.sin(((loopStartX - startX) / wavelength) * (Math.PI * 2)) * amplitude;
    d += ` L${loopStartX},${loopStartY}`;
    // Two arcs for full circle
    d += ` A${loopRadius},${loopRadius} 0 1 0 ${centerX + loopRadius},${centerY}`;
    d += ` A${loopRadius},${loopRadius} 0 1 0 ${loopStartX},${loopStartY}`;

    // From loop back to underline start with a gentle bend placed below the text
    d += ` Q${centerX + loopRadius / 2},${centerY + 100} ${underlineStartX},${underlineY}`;
    // Straight line underline
    d += ` L${underlineEndX},${underlineY}`;

    setPath(d);
  };

  const scrollToCurrentEvents = (e) => {
    e.preventDefault();
    const section = document.getElementById('current-events-section');
    section && section.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center text-white overflow-hidden pt-16"
    >
      <div className="absolute inset-0 z-0">
        <img src={gianicolo} alt="Panorama dal Gianicolo a Roma" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <svg ref={svgRef} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <path d={path} fill="none" stroke="#FFFADE" strokeWidth="3" strokeOpacity="0.7" className="animate-path" />
        </svg>
      </div>
      <div className="z-20 p-4 w-full">
        <div className="absolute sm:top-5 md:top-10 left-10 text-left">
          <h1 className="font-bold leading-tight" style={{ color: '#FFFADE' }}>
            <div className="text-4xl md:text-6xl">ESPLORARE</div>
            <div className="text-4xl md:text-6xl">IL CORPO</div>
            <div className="text-4xl md:text-6xl">
              URBAN<span ref={startLetterRef}>O</span>
            </div>
          </h1>
        </div>
        <div className="flex justify-end mr-8 mt-56">
          <div className="max-w-md text-right">
            <p className="text-xl md:text-2xl mb-4" style={{ color: '#FFFADE' }}>
              Disegniamo esperienze<br />Creiamo Workshop, Cacce & Mostre
            </p>
            <p ref={endTextRef} className="text-lg md:text-xl opacity-90 mb-8" style={{ color: '#FFFADE' }}>
              La città è di tuttə, così come la fotografia.
            </p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
        <button onClick={scrollToCurrentEvents} className="text-white focus:outline-none" aria-label="Scroll to current events">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
      <style jsx>{`
        .animate-path {
          stroke-dasharray: 5000;
          stroke-dashoffset: 5000;
          animation: drawPath 6s ease-out forwards;
        }
        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </section>
  );
}

export default Hero;

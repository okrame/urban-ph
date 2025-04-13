import { Link } from 'react-router-dom';
import gianicolo from '../assets/gianicolo.jpg';

function Hero() {
  const scrollToCurrentEvents = (e) => {
    e.preventDefault();
    const currentEventsSection = document.getElementById('current-events-section');
    if (currentEventsSection) {
      currentEventsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden pt-16">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={gianicolo}
          alt="Panorama dal Gianicolo a Roma"
          className="w-full h-full object-cover"
        />
        {/* <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-gray-900/70 to-gray-900/60"></div> */}
      </div>

      {/* Content */}
      <div className="z-10 p-4 w-full">
        {/* Titolo principale posizionato in alto a sinistra */}
        <div className="absolute top-6 left-6 text-left">
          <h1 className="font-bold leading-tight" style={{ color: '#FFFADE' }}>
            <div className="text-4xl md:text-6xl">ESPLORARE</div>
            <div className="text-4xl md:text-6xl">IL CORPO</div>
            <div className="text-4xl md:text-6xl">URBANO</div>
          </h1>
        </div>

        {/* Resto del testo posizionato al centro-destra */}
        <div className="flex justify-end mr-8">
          <div className="max-w-md text-right">
            <p className="text-xl md:text-2xl mb-4" style={{ color: '#FFFADE' }}>
              Disegniamo esperienze<br />
              Creiamo Workshop, Cacce & Mostre
            </p>
            <p className="text-lg md:text-xl opacity-90 mb-8" style={{ color: '#FFFADE' }}>
              La città è di tuttə, così come la fotografia.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={scrollToCurrentEvents}
                className="px-6 py-3 bg-white text-gray-900 rounded-md font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Current Events
              </button>

              <Link
                to="/events"
                className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                View All Events
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <button
          onClick={scrollToCurrentEvents}
          className="text-white focus:outline-none"
          aria-label="Scroll to current events"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
    </section>
  );
}

export default Hero;
import { Link } from 'react-router-dom';

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
          src="https://images.unsplash.com/photo-1476231682828-37e571bc172f?q=80&w=1600&auto=format"
          alt="Urban photography"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/80 to-gray-900/70"></div>
      </div>
      
      {/* Content */}
      <div className="z-10 text-center p-4 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Urban Photo Hunts
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          Explore the city through your lens
        </p>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
          Join our photography adventures and discover the hidden beauty of urban landscapes
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={scrollToCurrentEvents} 
            className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors transform hover:scale-105 duration-200"
          >
            Current Events
          </button>
          <Link
            to="/events"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors transform hover:scale-105 duration-200"
          >
            View All Events
          </Link>
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
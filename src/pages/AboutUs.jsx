import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';

function AboutUs() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Add a listener for auth state, just like in EventsPage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    // Cleanup the listener when component unmounts
    return () => unsubscribe();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar 
        user={user} 
        onSignInClick={() => setShowAuthModal(true)}
      />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        event={selectedEvent}
      />
      
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-12">About Us</h1>
        
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              Urban Photo Hunts was founded with a simple mission: to help people rediscover the beauty of urban spaces through photography. 
              We believe that every city has hidden gems, unique perspectives, and stories waiting to be captured through a lens.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">What We Do</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We organize various types of photography events:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>
                <span className="font-semibold">Photo Hunts:</span> Guided urban photography adventures where participants explore specific neighborhoods or themes.
              </li>
              <li>
                <span className="font-semibold">Workshops:</span> Hands-on learning sessions covering various photography techniques, from smartphone photography to advanced DSLR skills.
              </li>
              <li>
                <span className="font-semibold">Exhibitions:</span> Showcasing the best works from our community in galleries and public spaces throughout the city.
              </li>
            </ul>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <p className="text-gray-700 leading-relaxed">
              Urban Photo Hunts began in 2023 when a group of photography enthusiasts decided to formalize their weekend photo walks. 
              What started as casual meetups quickly grew into a community of photographers of all skill levels who share a passion for urban photography. 
              Today, we host dozens of events annually and have built a vibrant community of urban explorers and visual storytellers.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Join Us</h2>
            <p className="text-gray-700 leading-relaxed">
              Whether you're a seasoned photographer or just starting out with a smartphone camera, there's a place for you in our community. 
              Check out our upcoming events and become part of the Urban Photo Hunts movement!
            </p>
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-800 text-white text-center py-6 mt-12">
        <p>© {new Date().getFullYear()} Urban Photo Hunts. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AboutUs;
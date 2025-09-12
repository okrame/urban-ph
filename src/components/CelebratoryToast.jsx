import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Heart, CheckCircle } from 'lucide-react';

function CelebratoryToast({ isVisible, onComplete, message = "Booking Confirmed!" }) {
  const [cameras, setCameras] = useState([]);

  // Generate random cameras with different sizes
  useEffect(() => {
    if (isVisible) {
      const newCameras = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.5 + 0.8, // Varie grandezze da 0.8 a 2.3
        delay: Math.random() * 0.8,
        duration: Math.random() * 2.5 + 2,
        flashDelay: Math.random() * 1.5,
        color: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#6366f1' : '#8b5cf6'
      }));
      setCameras(newCameras);

      // Auto-complete after 4 seconds
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  const isMobile = window.innerWidth < 640;
  return (
    <AnimatePresence>
      {isVisible && (
         <motion.div
          className="fixed inset-0 z-[100] pointer-events-none flex justify-center"
          style={{
            alignItems: isMobile ? 'flex-start' : 'center',
            paddingTop: isMobile ? '38vh' : '8vh',
            paddingBottom: isMobile ? '5vh' : '0'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background overlay with camera-inspired gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Floating cameras with flash effects */}
          {cameras.map((camera) => (
            <motion.div
              key={camera.id}
              className="absolute"
              style={{
                left: `${camera.x}%`,
                top: `${camera.y}%`,
                fontSize: `${camera.size}rem`
              }}
              initial={{ 
                opacity: 0, 
                scale: 0, 
                rotate: -180
              }}
              animate={{ 
                opacity: [0, 1, 1, 0.8],
                scale: [0, 1.3, 1, 1.1],
                rotate: [0, 15, -10, 5],
                y: [20, -15, -25, -10]
              }}
              transition={{
                duration: camera.duration,
                delay: camera.delay,
                ease: "easeOut"
              }}
            >
              {/* Camera with flash effect */}
              <div className="relative">
                <motion.div
                  animate={{
                    filter: [
                      `drop-shadow(0 0 8px ${camera.color}60) brightness(1.2)`,
                      `drop-shadow(0 0 16px ${camera.color}90) brightness(1.8)`,
                      `drop-shadow(0 0 8px ${camera.color}60) brightness(1.2)`
                    ]
                  }}
                  transition={{
                    duration: 0.4,
                    delay: camera.flashDelay,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                >
                  <Camera 
                    size={camera.size * 20} 
                    style={{ color: camera.color }}
                  />
                </motion.div>
                
                {/* Flash overlay effect */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    scale: [1, 1.4, 1.8]
                  }}
                  transition={{
                    duration: 0.3,
                    delay: camera.flashDelay,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                >
                  <Camera 
                    size={camera.size * 20} 
                    className="text-white/70"
                  />
                </motion.div>
              </div>
            </motion.div>
          ))}

          {/* Main celebration message */}
          <motion.div
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center border border-white/20"
            initial={{ 
              opacity: 0, 
              scale: 0.5, 
              y: 50 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8, 
              y: -20 
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1
            }}
          >
            {/* Success icon with pulse */}
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.3,
                type: "spring",
                stiffness: 400,
                damping: 15
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <CheckCircle size={48} className="text-green-500" />
              </motion.div>
            </motion.div>

            {/* Message text */}
            <motion.h3
              className="text-xl font-bold text-gray-800 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {message}
            </motion.h3>

            <motion.p
              className="text-gray-600 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              You'll receive a confirmation email shortly
            </motion.p>

            {/* Floating heart */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ 
                y: [-5, -15, -5],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Heart size={20} className="text-red-400 fill-red-400" />
            </motion.div>

            {/* Floating camera corner */}
            <motion.div
              className="absolute -bottom-2 -left-2"
              animate={{ 
                y: [-3, -12, -3],
                rotate: [0, -8, 8, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              <div className="relative">
                <motion.div
                  animate={{
                    filter: [
                      'drop-shadow(0 0 4px #3b82f680) brightness(1.2)',
                      'drop-shadow(0 0 8px #3b82f6b0) brightness(1.6)',
                      'drop-shadow(0 0 4px #3b82f680) brightness(1.2)'
                    ]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 1.5
                  }}
                >
                  <Camera size={16} className="text-blue-500" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Additional floating cameras around the message */}
          {Array.from({ length: 6 }, (_, i) => (
            <motion.div
              key={`extra-camera-${i}`}
              className="absolute"
              style={{
                left: `${45 + (Math.random() - 0.5) * 25}%`,
                top: `${45 + (Math.random() - 0.5) * 25}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0.7, 0],
                scale: [0, 1.2, 1, 0.8],
                y: [0, -40],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 3,
                delay: 0.8 + i * 0.2,
                ease: "easeOut"
              }}
            >
              <motion.div
                animate={{
                  filter: [
                    'drop-shadow(0 0 6px #6366f160) brightness(1.3)',
                    'drop-shadow(0 0 12px #6366f190) brightness(1.7)',
                    'drop-shadow(0 0 6px #6366f160) brightness(1.3)'
                  ]
                }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 2.5
                }}
              >
                <Camera 
                  size={10 + (i % 3) * 4} 
                  className="text-indigo-500" 
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CelebratoryToast;
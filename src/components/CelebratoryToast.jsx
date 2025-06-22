import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Heart, CheckCircle } from 'lucide-react';

function CelebratoryToast({ isVisible, onComplete, message = "Booking Confirmed!" }) {
  const [sparkles, setSparkles] = useState([]);

  // Generate random sparkles
  useEffect(() => {
    if (isVisible) {
      const newSparkles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 1.5,
        icon: i % 4 === 0 ? Star : Sparkles
      }));
      setSparkles(newSparkles);

      // Auto-complete after 3 seconds
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background overlay with subtle gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Sparkles */}
          {sparkles.map((sparkle) => {
            const IconComponent = sparkle.icon;
            return (
              <motion.div
                key={sparkle.id}
                className="absolute text-yellow-400"
                style={{
                  left: `${sparkle.x}%`,
                  top: `${sparkle.y}%`,
                  fontSize: `${sparkle.size}rem`
                }}
                initial={{ 
                  opacity: 0, 
                  scale: 0, 
                  rotate: 0,
                  y: 20 
                }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 1, 0.8],
                  rotate: [0, 180, 360],
                  y: [20, -10, -30]
                }}
                transition={{
                  duration: sparkle.duration,
                  delay: sparkle.delay,
                  ease: "easeOut"
                }}
              >
                <IconComponent size={sparkle.size * 16} />
              </motion.div>
            );
          })}

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

            {/* Floating hearts */}
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

            <motion.div
              className="absolute -bottom-2 -left-2"
              animate={{ 
                y: [-3, -12, -3],
                rotate: [0, -8, 8, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              <Sparkles size={16} className="text-blue-400" />
            </motion.div>
          </motion.div>

          {/* Additional floating sparkles around the message */}
          {Array.from({ length: 8 }, (_, i) => (
            <motion.div
              key={`extra-${i}`}
              className="absolute"
              style={{
                left: `${45 + (Math.random() - 0.5) * 20}%`,
                top: `${45 + (Math.random() - 0.5) * 20}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                y: [0, -30],
                rotate: [0, 360]
              }}
              transition={{
                duration: 2,
                delay: 0.6 + i * 0.1,
                ease: "easeOut"
              }}
            >
              <Sparkles size={12} className="text-purple-400" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CelebratoryToast;
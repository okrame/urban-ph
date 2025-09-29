import { motion, useTransform, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import hunt1 from '../assets/hunts/1.jpeg';
import hunt2 from '../assets/hunts/2.png';
import hunt3 from '../assets/hunts/3.jpeg';
import hunt4 from '../assets/hunts/4.jpeg';
import hunt5 from '../assets/hunts/5.jpeg';
import workshop1 from '../assets/workshops/1.jpeg';
import workshop2 from '../assets/workshops/2.jpeg';
import workshop3 from '../assets/workshops/3.jpeg';
import workshop4 from '../assets/workshops/4.jpeg';
import workshop5 from '../assets/workshops/5.jpeg';
import walks1 from '../assets/walks/1.jpeg';
import walks3 from '../assets/walks/2.jpeg';
import walks2 from '../assets/walks/3.jpeg';
import walks4 from '../assets/walks/4.jpeg';
import walks5 from '../assets/walks/5.jpeg';
import exhibition1 from '../assets/exhibitions/2.jpeg';
import exhibition2 from '../assets/exhibitions/4.jpeg';
import exhibition3 from '../assets/exhibitions/4.jpeg';
import exhibition4 from '../assets/exhibitions/4.jpeg';
import exhibition5 from '../assets/exhibitions/4.jpeg';

const ImageFiller = ({
  square1X,
  square1Y,
  square2X,
  square2Y,
  squareSize,
  isInView,
  progressPhase1,
  progressPhase2,
  currentContent
}) => {

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      setWindowWidth(width);

      // Progressive scaling based on device width
      if (width <= 375) {
        // iPhone mini, Galaxy S8 and smaller
        setScaleFactor(0.7);
      } else if (width <= 414) {
        // iPhone standard sizes
        setScaleFactor(0.8);
      } else if (width <= 768) {
        // Larger phones and small tablets
        setScaleFactor(0.9);
      } else {
        // Desktop and larger
        setScaleFactor(1);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Update isMobile check (computed value, not state)
  const isMobile = windowWidth < 768;

  // State for enlarged image
  const [enlargedImageIndex, setEnlargedImageIndex] = useState(null);

  // Disable scrolling when image is enlarged
  useEffect(() => {
    if (enlargedImageIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [enlargedImageIndex]);

  // Calculate intersection area coordinates and dimensions
  const intersectionLeft = useTransform(
    [square1X, square2X],
    ([s1X, s2X]) => {
      const square1Left = s1X - squareSize / 2;
      const square2Left = s2X - squareSize / 2;
      return Math.max(square1Left, square2Left);
    }
  );

  const intersectionTop = useTransform(
    [square1Y, square2Y],
    ([s1Y, s2Y]) => {
      const square1Top = s1Y - squareSize / 2;
      const square2Top = s2Y - squareSize / 2;
      return Math.max(square1Top, square2Top);
    }
  );

  const intersectionRight = useTransform(
    [square1X, square2X],
    ([s1X, s2X]) => {
      const square1Right = s1X + squareSize / 2;
      const square2Right = s2X + squareSize / 2;
      return Math.min(square1Right, square2Right);
    }
  );

  const intersectionBottom = useTransform(
    [square1Y, square2Y],
    ([s1Y, s2Y]) => {
      const square1Bottom = s1Y + squareSize / 2;
      const square2Bottom = s2Y + squareSize / 2;
      return Math.min(square1Bottom, square2Bottom);
    }
  );

  // Calculate width and height of intersection
  const intersectionWidth = useTransform(
    [intersectionLeft, intersectionRight],
    ([left, right]) => Math.max(0, right - left)
  );

  const intersectionHeight = useTransform(
    [intersectionTop, intersectionBottom],
    ([top, bottom]) => Math.max(0, bottom - top)
  );

  // Calculate center position for the intersection area
  const intersectionCenterX = useTransform(
    [intersectionLeft, intersectionRight],
    ([left, right]) => (left + right) / 2
  );

  const intersectionCenterY = useTransform(
    [intersectionTop, intersectionBottom],
    ([top, bottom]) => (top + bottom) / 2
  );

  // Scaled responsive values
  const gridPadding = Math.round((isMobile ? 12 : 20) * scaleFactor);
  const horizontalGap = Math.round((isMobile ? 4 : 8) * scaleFactor);
  const verticalGap = Math.round((isMobile ? 6 : 12) * scaleFactor);

  const availableWidth = useTransform(
    intersectionWidth,
    (width) => (width - (gridPadding * 2)) //* scaleFactor
  );

  const availableHeight = useTransform(
    intersectionHeight,
    (height) => (height - (gridPadding * 2)) //* scaleFactor
  );

  // Enhanced minimum size constraints for very small devices
  const minImageWidth = windowWidth <= 375 ? 20 : 40;
  const minImageHeight = windowWidth <= 375 ? 20 : 40;

  const image1Width = useTransform(
    availableWidth,
    (width) => Math.max(minImageWidth, (width - (horizontalGap * 3)) / 4)
  );

  const otherImageWidth = useTransform(
    availableWidth,
    (width) => Math.max(minImageWidth, (width - (horizontalGap * 3)) / 4)
  );

  const imageHeight = useTransform(
    [availableHeight, otherImageWidth],
    ([height, width]) => {
      const rowHeight = (height - verticalGap) / 2;
      return Math.max(minImageHeight, Math.min(rowHeight, width * 1));
    }
  );

  const image1Height = useTransform(
    availableHeight,
    (totalHeight) => totalHeight
  );

  // Calculate positions for grid items
  const gridStartX = useTransform(
    [intersectionCenterX, availableWidth],
    ([centerX, gridWidth]) => centerX - gridWidth / 2
  );

  const gridStartY = useTransform(
    [intersectionCenterY, availableHeight],
    ([centerY, gridHeight]) => centerY - gridHeight / 2
  );

  // Grid positions with separate horizontal/vertical gaps
  const getImagePosition = (col, row) => ({
    x: useTransform(
      [gridStartX, image1Width, otherImageWidth],
      ([startX, img1Width, otherWidth]) => {
        if (col === 0) {
          return startX;
        } else {
          return startX + img1Width + horizontalGap + (col - 1) * (otherWidth + horizontalGap);
        }
      }
    ),
    y: useTransform(
      [gridStartY, imageHeight],
      ([startY, imgHeight]) => startY + row * (imgHeight + verticalGap)
    )
  });

  // Image positions
  const image1Pos = {
    x: gridStartX,
    y: gridStartY
  };
  const image2Pos = getImagePosition(1, 0);
  const image3Pos = getImagePosition(2, 0);
  const image4Pos = getImagePosition(3, 0);

  // Use appropriate gaps for image5 positioning
  const image5Pos = {
    x: useTransform(
      [gridStartX, image1Width],
      ([startX, img1Width]) => startX + img1Width + horizontalGap
    ),
    y: useTransform(
      [gridStartY, imageHeight],
      ([startY, imgHeight]) => startY + imgHeight + verticalGap
    )
  };

  // Use horizontalGap for width calculation
  const image5Width = useTransform(
    [availableWidth, image1Width],
    ([totalWidth, img1Width]) => totalWidth - img1Width - horizontalGap
  );

  // Calculate proper height for image 5 to fill remaining space
  const image5Height = useTransform(
    [availableHeight, imageHeight],
    ([totalHeight, topRowHeight]) => {
      // Total available height minus top row height minus vertical gap
      return totalHeight - topRowHeight - verticalGap;
    }
  );

  const imageSets = {
    hunts: [hunt1, hunt2, hunt3, hunt4, hunt5],
    walks: [walks1, walks2, walks3, walks4, walks5],
    workshops: [workshop1, workshop2, workshop3, workshop4, workshop5],
    exhibitions: [exhibition1, exhibition2, exhibition3, exhibition4, exhibition5]
  };


  // Calculate if conditions are met (boolean)
  const shouldShow = useTransform(
    [progressPhase1, progressPhase2, intersectionWidth, intersectionHeight],
    ([phase1, phase2, width, height]) => {
      const minWidth = windowWidth <= 375 ? 80 : windowWidth <= 768 ? 120 : 200;
      const minHeight = windowWidth <= 375 ? 60 : windowWidth <= 768 ? 80 : 150;
      return isInView && phase1 >= 1 && phase2 > 0.3 && width > minWidth && height > minHeight;
    }
  );
  // State to track when to trigger animations
  const [showImages, setShowImages] = useState(false);

  // Watch for condition changes
  useEffect(() => {
    const unsubscribe = shouldShow.on('change', (latest) => {
      setShowImages(latest);
    });

    return unsubscribe;
  }, [shouldShow]);

  const imageSet = ['hunts', 'walks', 'workshops', 'exhibitions'].includes(currentContent)
  ? currentContent
  : 'hunts';
  const currentImages = imageSets[imageSet];

  const images = [
    { src: currentImages[0], alt: `${imageSet} 1`, pos: image1Pos, width: image1Width, height: image1Height, delay: 0 },
    { src: currentImages[1], alt: `${imageSet} 2`, pos: image2Pos, width: otherImageWidth, height: imageHeight, delay: 0.15 },
    { src: currentImages[2], alt: `${imageSet} 3`, pos: image3Pos, width: otherImageWidth, height: imageHeight, delay: 0.3 },
    { src: currentImages[3], alt: `${imageSet} 4`, pos: image4Pos, width: otherImageWidth, height: imageHeight, delay: 0.45 },
    { src: currentImages[4], alt: `${imageSet} 5`, pos: image5Pos, width: image5Width, height: image5Height, delay: 0.35 }
  ];

  const handleImageClick = (index) => {
    setEnlargedImageIndex(index);
  };

  const handleCloseEnlarged = () => {
    setEnlargedImageIndex(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCloseEnlarged();
    }
  };

  useEffect(() => {
    if (enlargedImageIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enlargedImageIndex]);

  return (
    <>
      {/* Regular gallery images - no layoutId to avoid conflicts */}
      {images.map((img, index) => (
        <motion.img
          key={index}
          src={img.src}
          alt={img.alt}
          className="absolute object-cover rounded-md cursor-pointer"
          style={{
            left: '50%',
            top: '50%',
            x: img.pos.x,
            y: img.pos.y,
            width: img.width,
            height: img.height,
            transform: 'translate(-50%, -50%)',
            borderTopLeftRadius: index === 0 ? '20px' : '12px',
            borderBottomRightRadius: index === 4 ? '20px' : '12px'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: showImages ? 1 : 0,
            scale: showImages ? 1 : 0.8
          }}
          transition={{
            duration: 0.5,
            delay: showImages ? img.delay : 0,
            ease: "easeOut"
          }}
          onClick={() => handleImageClick(index)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        />
      ))}

      {/* Enlarged image overlay - completely separate from grid */}
      <AnimatePresence mode="wait">
        {enlargedImageIndex !== null && (
          <>
            {/* Overlay backdrop */}
            <motion.div
              className="fixed inset-0 bg-black z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={handleCloseEnlarged}
            />

            {/* Enlarged image container */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={handleCloseEnlarged}
            >
              <motion.img
                src={images[enlargedImageIndex].src}
                alt={images[enlargedImageIndex].alt}
                className="object-contain rounded-lg shadow-2xl"
                style={{
                  maxWidth: isMobile ? '90vw' : '85vw',
                  maxHeight: isMobile ? '75vh' : '80vh',
                }}
                initial={{
                  scale: 0.3,
                  opacity: 0
                }}
                animate={{
                  scale: 1,
                  opacity: 1
                }}
                exit={{
                  scale: 0.3,
                  opacity: 0
                }}
                transition={{
                  duration: 0.35,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Close button */}
              <motion.button
                className="absolute top-6 right-6 text-white text-xl font-bold bg-black bg-opacity-60 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-80 transition-colors backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                onClick={handleCloseEnlarged}
              >
                ×
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageFiller;
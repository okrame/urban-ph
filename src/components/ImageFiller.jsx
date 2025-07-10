import { motion, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import hunt1 from '../assets/hunts/1.jpeg';
import hunt2 from '../assets/hunts/2.png';
import hunt3 from '../assets/hunts/3.jpeg';
import hunt4 from '../assets/hunts/4.jpeg';
import hunt5 from '../assets/hunts/5.jpeg';

const ImageFiller = ({ 
  square1X, 
  square1Y, 
  square2X, 
  square2Y, 
  squareSize, 
  borderRadius, 
  isInView,
  progressPhase1,
  progressPhase2 
}) => {
  
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

  // Calculate grid dimensions based on intersection size
  const gridPadding = 20;
  const gridGap = 10;
  
  const availableWidth = useTransform(
    intersectionWidth,
    (width) => width - (gridPadding * 2)
  );
  
  const availableHeight = useTransform(
    intersectionHeight,
    (height) => height - (gridPadding * 2)
  );
  
  // Calculate image sizes for 4-column grid
  const image1Width = useTransform(
    availableWidth,
    (width) => (width - (gridGap * 3)) / 4
  );
  
  const otherImageWidth = useTransform(
    availableWidth,
    (width) => (width - (gridGap * 3)) / 4
  );
  
  const imageHeight = useTransform(
    [availableHeight, otherImageWidth],
    ([height, width]) => {
      const rowHeight = (height - gridGap) / 2;
      return Math.min(rowHeight, width * 1);
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
  
  // Grid positions
  const getImagePosition = (col, row) => ({
    x: useTransform(
      [gridStartX, image1Width, otherImageWidth],
      ([startX, img1Width, otherWidth]) => {
        if (col === 0) {
          return startX;
        } else {
          return startX + img1Width + gridGap + (col - 1) * (otherWidth + gridGap);
        }
      }
    ),
    y: useTransform(
      [gridStartY, imageHeight],
      ([startY, imgHeight]) => startY + row * (imgHeight + gridGap)
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
  
  const image5Pos = {
    x: useTransform(
      [gridStartX, image1Width],
      ([startX, img1Width]) => startX + img1Width + gridGap
    ),
    y: useTransform(
      [gridStartY, imageHeight],
      ([startY, imgHeight]) => startY + imgHeight + gridGap
    )
  };
  
  const image5Width = useTransform(
    [availableWidth, image1Width],
    ([totalWidth, img1Width]) => totalWidth - img1Width - gridGap
  );

  // Calculate if conditions are met (boolean)
  const shouldShow = useTransform(
    [progressPhase1, progressPhase2, intersectionWidth, intersectionHeight],
    ([phase1, phase2, width, height]) => {
      return isInView && phase1 >= 1 && phase2 > 0.3 && width > 200 && height > 150;
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

  // Images data for cleaner code
  const images = [
    { src: hunt1, alt: "Hunt 1", pos: image1Pos, width: image1Width, height: image1Height, delay: 0 },
    { src: hunt2, alt: "Hunt 2", pos: image2Pos, width: otherImageWidth, height: imageHeight, delay: 0.15 },
    { src: hunt3, alt: "Hunt 3", pos: image3Pos, width: otherImageWidth, height: imageHeight, delay: 0.3 },
    { src: hunt4, alt: "Hunt 4", pos: image4Pos, width: otherImageWidth, height: imageHeight, delay: 0.45 },
    { src: hunt5, alt: "Hunt 5", pos: image5Pos, width: image5Width, height: imageHeight, delay: 0.6 }
  ];

  return (
    <>
      {images.map((img, index) => (
        <motion.img
          key={index}
          src={img.src}
          alt={img.alt}
          className="absolute object-cover rounded-md pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            x: img.pos.x,
            y: img.pos.y,
            width: img.width,
            height: img.height,
            transform: 'translate(-50%, -50%)',
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
        />
      ))}
    </>
  );
};

export default ImageFiller;
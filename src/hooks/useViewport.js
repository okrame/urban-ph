import React, { useState, useEffect, useCallback } from 'react';
import viewportManager from './viewportManager.js';

/**
 * React Hook for managing mobile viewport stability
 * Prevents jittery scroll behavior and provides viewport info
 */
export const useViewport = (options = {}) => {
  const [viewportInfo, setViewportInfo] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
    isStable: true,
    isMobile: window.innerWidth <= 768,
    browser: { name: 'Unknown', class: 'unknown' }
  });

  const [isViewportChanging, setIsViewportChanging] = useState(false);

  // Update viewport info
  const updateViewportInfo = useCallback(() => {
    const info = viewportManager.getViewportInfo();
    setViewportInfo({
      height: info.stableHeight,
      width: window.innerWidth,
      isStable: info.isStable,
      isMobile: window.innerWidth <= 768,
      browser: info.browser
    });
    setIsViewportChanging(!info.isStable);
  }, []);

  // Initialize viewport manager
  useEffect(() => {
    if (window.innerWidth <= 768) {
      viewportManager.init();
    }
    updateViewportInfo();
  }, [updateViewportInfo]);

  // Listen for viewport changes
  useEffect(() => {
    let animationFrame;
    let lastCheck = 0;

    const checkViewport = () => {
      const now = Date.now();
      if (now - lastCheck > 100) { // Throttle to 10fps
        updateViewportInfo();
        lastCheck = now;
      }
      animationFrame = requestAnimationFrame(checkViewport);
    };

    if (viewportInfo.isMobile) {
      animationFrame = requestAnimationFrame(checkViewport);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [viewportInfo.isMobile, updateViewportInfo]);

  // Force viewport update
  const forceViewportUpdate = useCallback((height = null) => {
    viewportManager.forceUpdate(height);
    updateViewportInfo();
  }, [updateViewportInfo]);

  // Get safe viewport height for CSS
  const getSafeHeight = useCallback((fallback = '100vh') => {
    if (!viewportInfo.isMobile) return fallback;
    
    // Use CSS custom property if available, otherwise calculated height
    return `var(--js-viewport-height, ${viewportInfo.height}px)`;
  }, [viewportInfo.isMobile, viewportInfo.height]);

  // Get viewport CSS classes for styling
  const getViewportClasses = useCallback(() => {
    const classes = [];
    
    if (viewportInfo.isMobile) {
      classes.push('mobile-viewport');
    }
    
    if (isViewportChanging) {
      classes.push('viewport-changing');
    }
    
    if (viewportInfo.browser.class) {
      classes.push(viewportInfo.browser.class);
    }
    
    return classes.join(' ');
  }, [viewportInfo.isMobile, viewportInfo.browser.class, isViewportChanging]);

  return {
    // Viewport dimensions
    height: viewportInfo.height,
    width: viewportInfo.width,
    
    // Status flags
    isStable: viewportInfo.isStable,
    isMobile: viewportInfo.isMobile,
    isViewportChanging,
    
    // Browser info
    browser: viewportInfo.browser,
    
    // Utility functions
    forceUpdate: forceViewportUpdate,
    getSafeHeight,
    getViewportClasses,
    
    // Viewport manager instance (for advanced usage)
    manager: viewportManager
  };
};

/**
 * Higher-order component for viewport-aware components
 */
export const withViewport = (WrappedComponent) => {
  return function WithViewportComponent(props) {
    const viewport = useViewport();
    return <WrappedComponent {...props} viewport={viewport} />;
  };
};

export default useViewport;
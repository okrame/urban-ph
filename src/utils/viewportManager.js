/**
 * Mobile Viewport Stabilization Manager
 * Prevents jittery/glitch effects during scrolling on mobile browsers
 */

class ViewportManager {
  constructor(options = {}) {
    this.options = {
      debounceTime: 150,
      stabilityDelay: 300,
      heightTolerance: 50,
      ...options
    };
    
    this.isInitialized = false;
    this.initialHeight = 0;
    this.currentHeight = 0;
    this.stableHeight = 0;
    this.isStable = true;
    this.stabilityTimer = null;
    this.resizeTimer = null;
    this.lastScrollTime = 0;
    
    // Browser detection
    this.browser = this.detectBrowser();
    
    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
    this.updateViewportHeight = this.updateViewportHeight.bind(this);
  }
  
  /**
   * Initialize the viewport manager
   */
  init() {
    if (this.isInitialized) return;
    
    // Set initial height
    this.setInitialHeight();
    
    // Add browser class for CSS targeting
    document.documentElement.classList.add(this.browser.class);
    
    // Event listeners
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('orientationchange', this.handleOrientationChange);
    
    // Handle visual viewport API if available (better mobile support)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleResize, { passive: true });
    }
    
    this.isInitialized = true;
    console.log(`ViewportManager initialized for ${this.browser.name}`);
  }
  
  /**
   * Detect browser type for specific handling
   */
  detectBrowser() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isChrome = /Chrome/.test(ua);
    const isAndroid = /Android/.test(ua);
    
    if (isIOS && isSafari) {
      return { name: 'iOS Safari', class: 'ios-safari', needsSpecialHandling: true };
    } else if (isIOS && isChrome) {
      return { name: 'iOS Chrome', class: 'ios-chrome', needsSpecialHandling: true };
    } else if (isAndroid && isChrome) {
      return { name: 'Android Chrome', class: 'android-chrome', needsSpecialHandling: true };
    } else if (isAndroid) {
      return { name: 'Android Browser', class: 'android-browser', needsSpecialHandling: true };
    }
    
    return { name: 'Desktop', class: 'desktop-browser', needsSpecialHandling: false };
  }
  
  /**
   * Set initial viewport height
   */
  setInitialHeight() {
    // Use visual viewport if available, otherwise window
    const height = window.visualViewport ? 
      window.visualViewport.height : 
      window.innerHeight;
    
    this.initialHeight = height;
    this.currentHeight = height;
    this.stableHeight = height;
    
    this.updateViewportHeight(height);
  }
  
  /**
   * Handle window resize with debouncing
   */
  handleResize() {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    
    this.resizeTimer = setTimeout(() => {
      const newHeight = window.visualViewport ? 
        window.visualViewport.height : 
        window.innerHeight;
      
      this.processHeightChange(newHeight);
    }, this.options.debounceTime);
  }
  
  /**
   * Handle scroll events to detect when UI bars might change
   */
  handleScroll() {
    this.lastScrollTime = Date.now();
    
    // Add scrolling class for CSS optimizations
    document.body.classList.add('scrolling');
    
    // Remove scrolling class after scroll ends
    clearTimeout(this.scrollEndTimer);
    this.scrollEndTimer = setTimeout(() => {
      document.body.classList.remove('scrolling');
    }, 150);
  }
  
  /**
   * Handle orientation change
   */
  handleOrientationChange() {
    // Wait for orientation change to complete
    setTimeout(() => {
      this.setInitialHeight();
      this.markAsStable();
    }, 500);
  }
  
  /**
   * Process height changes intelligently
   */
  processHeightChange(newHeight) {
    const heightDiff = Math.abs(newHeight - this.stableHeight);
    const timeSinceScroll = Date.now() - this.lastScrollTime;
    
    // If height change is small or happened during recent scroll, maintain stability
    if (heightDiff < this.options.heightTolerance || timeSinceScroll < 500) {
      this.maintainStableHeight();
      return;
    }
    
    // Significant height change - update but mark as unstable
    this.currentHeight = newHeight;
    this.markAsUnstable();
    
    // Set stability timer
    if (this.stabilityTimer) {
      clearTimeout(this.stabilityTimer);
    }
    
    this.stabilityTimer = setTimeout(() => {
      this.stableHeight = this.currentHeight;
      this.updateViewportHeight(this.stableHeight);
      this.markAsStable();
    }, this.options.stabilityDelay);
  }
  
  /**
   * Maintain stable height during browser UI transitions
   */
  maintainStableHeight() {
    if (!this.isStable) {
      this.updateViewportHeight(this.stableHeight);
    }
  }
  
  /**
   * Update CSS custom property with viewport height
   */
  updateViewportHeight(height) {
    document.documentElement.style.setProperty(
      '--js-viewport-height', 
      `${height}px`
    );
  }
  
  /**
   * Mark viewport as unstable (during transitions)
   */
  markAsUnstable() {
    if (this.isStable) {
      this.isStable = false;
      document.body.classList.add('viewport-changing');
      document.documentElement.style.setProperty('--viewport-stable', '0');
    }
  }
  
  /**
   * Mark viewport as stable
   */
  markAsStable() {
    if (!this.isStable) {
      this.isStable = true;
      document.body.classList.remove('viewport-changing');
      document.documentElement.style.setProperty('--viewport-stable', '1');
    }
  }
  
  /**
   * Get current viewport info
   */
  getViewportInfo() {
    return {
      currentHeight: this.currentHeight,
      stableHeight: this.stableHeight,
      initialHeight: this.initialHeight,
      isStable: this.isStable,
      browser: this.browser
    };
  }
  
  /**
   * Force update viewport height (for manual control)
   */
  forceUpdate(height = null) {
    const newHeight = height || (window.visualViewport ? 
      window.visualViewport.height : 
      window.innerHeight);
    
    this.stableHeight = newHeight;
    this.currentHeight = newHeight;
    this.updateViewportHeight(newHeight);
    this.markAsStable();
  }
  
  /**
   * Destroy the viewport manager
   */
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.handleResize);
    }
    
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    if (this.stabilityTimer) clearTimeout(this.stabilityTimer);
    if (this.scrollEndTimer) clearTimeout(this.scrollEndTimer);
    
    this.isInitialized = false;
  }
}

// Create and export singleton instance
const viewportManager = new ViewportManager();

// Auto-initialize on mobile devices
if (window.innerWidth <= 768) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => viewportManager.init());
  } else {
    viewportManager.init();
  }
}

export default viewportManager;
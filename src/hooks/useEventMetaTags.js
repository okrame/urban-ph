import { useEffect } from 'react';

const useEventMetaTags = (event, isEventOpen) => {
  useEffect(() => {
    if (!event || !isEventOpen) return;

    // Update document title
    document.title = `${event.title} - Urban pH`;

    // Update meta tags with real event data
    const updateMetaTag = (selector, content) => {
      let meta = document.querySelector(selector);
      if (meta) {
        meta.content = content;
      }
    };

    // Prepare event description (strip markdown and truncate)
    const cleanDescription = event.description
      .replace(/[#*_`~]/g, '') // Remove markdown symbols
      .replace(/\n/g, ' ')
      .substring(0, 160);

    const eventTitle = `${event.title} - Urban pH`;
    const eventDescription = `${cleanDescription} | ${event.date} at ${event.time} - ${event.venueName || event.location}`;
    const eventImage = event.image || 'https://urbanph.it/camera-icon.svg';
    const eventUrl = window.location.href;

    // Update existing meta tags
    updateMetaTag('meta[name="description"]', eventDescription);
    updateMetaTag('meta[property="og:title"]', eventTitle);
    updateMetaTag('meta[property="og:description"]', eventDescription);
    updateMetaTag('meta[property="og:image"]', eventImage);
    updateMetaTag('meta[property="og:url"]', eventUrl);
    updateMetaTag('meta[name="twitter:title"]', eventTitle);
    updateMetaTag('meta[name="twitter:description"]', eventDescription);
    updateMetaTag('meta[name="twitter:image"]', eventImage);

    // Cleanup function to reset meta tags when event is closed
    return () => {
      document.title = 'Urban pH Events';
      updateMetaTag('meta[name="description"]', 'Join our urban photography community for exciting walks, photo hunts, workshops, and exhibitions.');
      updateMetaTag('meta[property="og:title"]', 'Urban pH Events');
      updateMetaTag('meta[property="og:description"]', 'Join our urban photography community for exciting walks, photo hunts, workshops, and exhibitions.');
      updateMetaTag('meta[property="og:image"]', 'https://urbanph.it/camera-icon.svg');
      updateMetaTag('meta[name="twitter:title"]', 'Urban pH Events');
      updateMetaTag('meta[name="twitter:description"]', 'Join our urban photography community for exciting walks, photo hunts, workshops, and exhibitions.');
      updateMetaTag('meta[name="twitter:image"]', 'https://urbanph.it/camera-icon.svg');
    };
  }, [event, isEventOpen]);
};

export default useEventMetaTags;
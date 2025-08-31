// src/utils/htmlUtils.js

/**
 * Basic HTML sanitization for rich text content
 * Allows safe formatting tags but removes potentially dangerous attributes and scripts
 */
export const sanitizeHtml = (html) => {
  if (!html) return '';
  
  // Allow these HTML tags for rich text formatting
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'];
  const allowedAttributes = {
    'a': ['href', 'title'],
  };

  // Remove script tags and their content
  let sanitized = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove potentially dangerous attributes
  sanitized = sanitized.replace(/<([^>]+)>/g, (match, tagContent) => {
    const [tagName, ...attributes] = tagContent.trim().split(/\s+/);
    const cleanTagName = tagName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check if tag is allowed
    if (!allowedTags.includes(cleanTagName)) {
      return '';
    }

    // Filter attributes for allowed ones
    const cleanAttributes = attributes
      .map(attr => {
        const [name] = attr.split('=');
        const cleanName = name ? name.toLowerCase().replace(/[^a-z-]/g, '') : '';
        
        if (allowedAttributes[cleanTagName] && allowedAttributes[cleanTagName].includes(cleanName)) {
          return attr;
        }
        return '';
      })
      .filter(attr => attr)
      .join(' ');

    return `<${cleanTagName}${cleanAttributes ? ' ' + cleanAttributes : ''}>`;
  });

  return sanitized;
};

/**
 * Component helper to render HTML content safely
 */
export const createMarkup = (html) => {
  return { __html: sanitizeHtml(html) };
};
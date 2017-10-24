import { Blaze } from 'meteor/blaze';
/**
 * Convert a string into HTML replacing some characters (eg: newlines) and removing script tags
 */
const toHTMLString = context => {
  if (!context) {
    return;
  }
  return context
    .replace('\n', '<br>')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

/**
 * A global Blaze UI helper to convert a string into a HTML string
 */

// Check if global helper already exists to not override it
if (!Blaze._getGlobalHelper('toHTMLString')) {
  Blaze.registerHelper('toHTMLString', toHTMLString);
}

export { toHTMLString, toHTMLString as default };

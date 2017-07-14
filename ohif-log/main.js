/**
 * Import main dependency
 */
import { OHIF } from 'meteor/ohif:core';
import OHIFLog from './OHIFLog';

/**
 * Append OHIFLog to OHIF namespace
 */
OHIF.log = new OHIFLog();

/**
 * Export relevant objects
 */

export { OHIF, OHIFLog };

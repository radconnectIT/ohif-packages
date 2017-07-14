/**
 * Import OHIF Namespace.
 */

import { OHIF } from 'meteor/ohif:base';

/**
 * Create HangingProtocols Namespace.
 */

const HangingProtocols = {};

/**
 * Append HangingProtocols namespace to OHIF namespace.
 */

OHIF.hangingprotocols = HangingProtocols;

/**
 * Export relevant objects
 */

export { OHIF, HangingProtocols };


/**
 * Define Namespace.
 */

const utils = {};

/**
 * Import utility functions/objects into namespace.
 */

import { comparators } from './comparators';
utils.comparators = comparators;

import { removeFromArray } from './removeFromArray';
utils.removeFromArray = removeFromArray;

/**
 * Export relevant objects
 */

export { utils };

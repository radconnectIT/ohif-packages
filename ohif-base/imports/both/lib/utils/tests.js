/**
 * Small set of tests which are way faster than underscore equivalents. Specially when used within loops.
 */

/**
 * Constants
 */

const FUNCTION = 'function';
const NUMBER = 'number';
const OBJECT = 'object';
const STRING = 'string';
const UNDEFINED = 'undefined';

/**
 * Functions
 */

const isArray = Array.isArray.bind(Array);

function isFunction(subject) {
    return typeof subject === FUNCTION;
}

function isNumber(subject) {
    return typeof subject === NUMBER;
}

function isObject(subject) {
    return typeof subject === OBJECT && subject !== null;
}

function isString(subject) {
    return typeof subject === STRING;
}

function isUndefined(subject) {
    return typeof subject === UNDEFINED;
}

export default {
    isArray,
    isFunction,
    isNumber,
    isObject,
    isString,
    isUndefined
};

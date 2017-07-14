import { validate } from './lib/validate';

/**
 * Add OHIF Necessary Validators
 */

const arraysAreEqual = (a1, a2) => a1.length === a2.length && a1.every( v => a2.includes(v) );

validate.validators.equals = function(value, options, key, attributes) {
    if (!options) {
        return 'equals: Invalid options';
    }
    if (value instanceof Array && options.value instanceof Array && arraysAreEqual(value, options.value)) {
        return;
    }

    if (value != options.value) {
        return key + ' must equal ' + (options.value instanceof Array ? JSON.stringify(options.value) : options.value);
    }
};

validate.validators.doesNotEqual = function(value, options, key) {
    if (options && value == options.value) {
        return key + ' cannot equal ' + options.value;
    }
};

validate.validators.contains = function(value, options, key) {
    if (options && value.indexOf && value.indexOf(options.value) === -1) {
        return key + ' must contain ' + options.value;
    }
};

validate.validators.doesNotContain = function(value, options, key) {
    if (options && value.indexOf && value.indexOf(options.value) !== -1) {
        return key + ' cannot contain ' + options.value;
    }
};

validate.validators.greaterThan = function(value, options, key) {
    if (value === void 0 || options && value <= options.value) {
        return key + ' must be greater than ' + options.value;
    }
};

/**
 * Export Symbol
 */

export { validate };

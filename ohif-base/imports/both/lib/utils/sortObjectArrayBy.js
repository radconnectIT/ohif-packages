import tests from './tests';
import getPropertyValue from './getPropertyValue';

/**
 * Constants
 */

const ORDER_ASC = 'asc';
const ORDER_DESC = 'desc';
const { isString, isArray } = tests;

/**
 * Checks if a sorting specifier is valid.
 * A valid sorting specifier consists of an array of arrays being each subarray a pair
 * in the format ["property name", "sorting order"].
 * The following exemple can be used to sort studies by "date"" and use "time" to break ties in descending order.
 * [ [ 'study.date', 'desc' ], [ 'study.time', 'desc' ] ]
 * @param {Array} specifiers The sorting specifier to be tested.
 * @returns {boolean} Returns true if the specifiers are valid, false otherwise.
 */

function isValidSortingSpecifier(specifiers) {
    let result = true;
    if (isArray(specifiers) && specifiers.length > 0) {
        for (let i = specifiers.length - 1; i >= 0; i--) {
            const item = specifiers[i];
            if (isArray(item)) {
                const property = item[0];
                const order = item[1];
                if (isString(property) && (order === ORDER_ASC || order === ORDER_DESC)) {
                    continue;
                }
            }
            result = false;
            break;
        }
    }
    return result;
}

/**
 * Sorts an array based on sorting specifier options.
 * @param {Array} list The that needs to be sorted.
 * @param {Array} specifiers An array of specifiers. Please read isValidSortingSpecifier method definition for further details.
 * @returns {void} No value is returned. The array is sorted in place.
 */

function sortObjectArrayBy(list, specifiers) {
    let result;
    if (isArray(list) && isValidSortingSpecifier(specifiers)) {
        const specifierCount = specifiers.length;
        list.sort(function callbackForSortObjectArrayBy(a, b) { // callback name for stack traces... ;-)
            for (let index = 0; index < specifierCount; index++) {
                const specifier = specifiers[index];
                const property = specifier[0];
                const order = specifier[1] === ORDER_DESC ? -1 : 1;
                const aValue = getPropertyValue(a, property);
                const bValue = getPropertyValue(b, property);
                // @TODO: should we check for the types being compared, like:
                // ~~ if (typeof aValue !== typeof bValue) continue;
                // Not sure because dates, for example, can be correctly compared to numbers...
                if (aValue < bValue) {
                    return order * -1;
                }
                if (aValue > bValue) {
                    return order * 1;
                }
            }
            // a draw by default
            return 0;
        });
        result = list;
    }
    return result || [];
}

/**
 * Export Symbols
 */

export default sortObjectArrayBy;

import { _ } from 'meteor/underscore';

/**
 * Removes the first instance of an element from an array, if an equal value exists
 *
 * @param array
 * @param input
 *
 * @returns {boolean} Whether or not the element was found and removed
 */
const removeFromArray = (array, input) => {
    // If the array is empty, stop here
    if (!array ||
        !array.length) {
        return false;
    }

    const indexToRemove = array.findIndex(value => {
        return _.isEqual(value, input);
    });

    if (indexToRemove < 0) {
        return false;
    }

    array.splice(indexToRemove, 1);
    return true;
};

export { removeFromArray };
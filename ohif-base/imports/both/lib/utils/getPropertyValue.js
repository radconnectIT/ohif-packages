import tests from './tests';

/**
 * Constants
 */

const PROPERTY_SEPARATOR = '.';
const { isObject, isString } = tests; // bring used tests to local scope

/**
 * Retrieve an object's property value by name. Composite property names (e.g., 'address.country.name') are accepted.
 * @param {Object} targetObject The object we want read the property from...
 * @param {String} propertyName The property to be read (e.g., 'address.street.name' or 'address.street.number'
 * to read object.address.street.name or object.address.street.number, respectively);
 * @returns {Any} Returns whatever the property holds or undefined if the property cannot be read or reached.
 */

function getPropertyValue(targetObject, propertyName) {
    let propertyValue; // undefined (the default return value)
    if (isObject(targetObject) && isString(propertyName)) {
        const fragments = propertyName.split(PROPERTY_SEPARATOR);
        const fragmentCount = fragments.length;
        if (fragmentCount > 0) {
            propertyValue = targetObject[fragments[0]];
            if (fragmentCount > 1) {
                propertyName = fragments.slice(1).join(PROPERTY_SEPARATOR);
                propertyValue = getPropertyValue(propertyValue, propertyName);
            }
        }
    }
    return propertyValue;
}

/**
 * Export Symbols
 */

export default getPropertyValue;

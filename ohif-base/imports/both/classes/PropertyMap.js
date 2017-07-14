
/**
 * Constants
 */

// Errors
const NAME_RESOLUTION_ERROR = 'PropertyMap::NameResolutionError';
const BAD_NAME_ERROR = 'PropertyMap::BadNameError';

// Utils
const DEFAULT_PROPERTY_SEPARATOR = '/';
const DEFAULT_INDEX_SEPARATOR = ':';
const EMPTY_STRING = '';
const UNDEFINED = 'undefined';
const STRING = 'string';
const FUNCTION = 'function';
const OBJECT_OBJECT = '[object Object]';
const OBJECT_ARRAY = '[object Array]';

/**
 * Class Definition
 * The current class supports setting complex data structures using property names as "namespace".
 * The following code works based on the premise that the root element of every property given is always
 * an object.
 */

export class PropertyMap {

    constructor(propertySeparator, indexSeparator) {

        // Define the main "_data" private property as an immutable property.
        // IMPORTANT: This property is only set during instance construction and is immutable.
        Object.defineProperty(this, '_data', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: Object.create(null)
        });

        // Define the "_propertySeparator" private property.
        Object.defineProperty(this, '_propertySeparator', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: DEFAULT_PROPERTY_SEPARATOR
        });

        // Define the "_indexSeparator" private property.
        Object.defineProperty(this, '_indexSeparator', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: DEFAULT_INDEX_SEPARATOR
        });

        // Set custom separators
        if (_isString(propertySeparator) || _isString(indexSeparator)) {
            propertySeparator = _isString(propertySeparator) ? propertySeparator : DEFAULT_PROPERTY_SEPARATOR;
            indexSeparator = _isString(indexSeparator) ? indexSeparator : DEFAULT_INDEX_SEPARATOR;
            this.setSeparators(propertySeparator, indexSeparator);
        }

    }

    setSeparators(propertySeparator, indexSeparator) {
        let result = true;

        // make sure each separator is one character long
        propertySeparator = _isString(propertySeparator) ? propertySeparator.charAt(0) : EMPTY_STRING;
        indexSeparator = _isString(indexSeparator) ? indexSeparator.charAt(0) : EMPTY_STRING;

        // save a copy of current values
        const _propertySeparator = this._propertySeparator;
        const _indexSeparator = this._indexSeparator;

        if (propertySeparator !== EMPTY_STRING && propertySeparator !== _propertySeparator) {
            this._propertySeparator = propertySeparator;
        }

        if (indexSeparator !== EMPTY_STRING && indexSeparator !== _indexSeparator) {
            this._indexSeparator = indexSeparator;
        }

        if (this._propertySeparator === this._indexSeparator) {
            // rollback
            this._propertySeparator = _propertySeparator;
            this._indexSeparator = _indexSeparator;
            result = false;
        }

        return result;
    }

    /**
     * Read a property from internal data set.
     * If the abort flag is given and is true, an exception will be thrown if the referred property cannot be reached.
     * @param {string} name The name of the property to be read.
     * @param {boolean} abort A boolean value indicating if an exception should be thrown when a given property cannot be resolved.
     * @returns {*} Returns the value of the given property or undefined
     */
    getProperty(name, abort = false) {
        let result; // result is undefined by default
        try {
            result = _getPropertyValue(this._propertySeparator, this._indexSeparator, this._data, name);
        } catch (error) {
            if (abort === true) {
                throw error; // route the error if abort is expected
            }
        }
        return result;
    }

    /**
     * Set a property from internal data set.
     * If the abort flag is given and is true, an exception will be thrown if the referred property cannot be reached or set.
     * @param {string} name The name of the property to be set.
     * @param {*} value The value which will be assigned to the given property.
     * @param {boolean} abort A boolean value indicating if an exception should be thrown when a given property cannot be resolved.
     * @returns {boolean} Returns true on success, false on failure.
     */
    setProperty(name, value, abort = false) {
        let result = false;
        try {
            result = _setPropertyValue(this._propertySeparator, this._indexSeparator, this._data, name, value);
        } catch (error) {
            if (abort === true) {
                throw error; // route the error if abort is expected
            }
        }
        return result;
    }

    /**
     * Iterates over all the items of the object or array pointed to by the given property name.
     * If the abort flag is given and is true, an exception will be thrown if the referred property cannot be reached or is not iterable.
     * Unlike the standard JS forEach implementation, the exection is aborted when the given callback returns false.
     * @param {string} name The name of the property to be iterated.
     * @param {function} callback The callback which will receive the following three arguments: value, index and target iterable.
     * @param {boolean} abort A boolean value indicating if an exception should be thrown when a given property cannot be resolved.
     */
    forEach(name, callback, abort = false) {
        if (_isFunction(callback)) {
            const target = _getPropertyValue(this._propertySeparator, this._indexSeparator, this._data, name);
            if (_isArray(target)) {
                const limit = target.length;
                for (let i = 0; i < limit; ++i) {
                    let result = callback.call(null, target[i], i, target);
                    if (result === false) {
                        break;
                    }
                }
            } else if (_isObject(target)) {
                for (let i in target) {
                    if (_hasOwn.call(target, i)) {
                        let result = callback.call(null, target[i], i, target);
                        if (result === false) {
                            break;
                        }
                    }
                }
            } else if (abort === true) {
                throw new Error(NAME_RESOLUTION_ERROR);
            }
        }
    }

    dump() {
        return _dump(this._propertySeparator, this._indexSeparator, this._data, '');
    }

}

/**
 * Utility Functions
 * ATTENTION! For performance considerations we're using regular functions here instead of arrow functions.
 */

const _hasOwn = Object.prototype.hasOwnProperty;
const _toString = Object.prototype.toString;

function _isUndefined(subject) {
    return typeof subject === UNDEFINED;
}

function _isString(subject) {
    return typeof subject === STRING;
}

function _isFunction(subject) {
    return typeof subject === FUNCTION;
}

function _isObject(subject) {
    return _toString.call(subject) === OBJECT_OBJECT;
}

function _isArray(subject) {
    return _toString.call(subject) === OBJECT_ARRAY;
}

/**
 * Retrieve an object's property value by name. Composite property names (e.g., 'address.country.name') are accepted.
 * @param {Object} targetObject The object we want read the property from...
 * @param {String} propertyName The property to be read (e.g., 'address.street.name' or 'address.street.number'
 * to read object.address.street.name or object.address.street.number, respectively);
 * @returns {*} Returns whatever the property holds or undefined if the property cannot be read or reached.
 */
function _getPropertyValue(propertySeparator, indexSeparator, targetObject, propertyName) {

    let propertyValue; // undefined (the default return value)

    if (!_isObject(targetObject) || !_isString(propertyName)) {
        throw new Error(NAME_RESOLUTION_ERROR);
    }

    const fragments = propertyName.split(propertySeparator);
    const fragmentsCount = fragments.length;

    // check if fragment count is valid
    if (fragmentsCount < 1) {
        throw new Error(BAD_NAME_ERROR);
    }

    let fragment = fragments[0]; // set the current fragment
    let indexPath = null; // null by default is important here
    let indexOffset = fragment.indexOf(indexSeparator);

    // check if an index exists inside the fragment
    if (indexOffset > -1) {
        indexPath = fragment.substring(indexOffset + 1);
        fragment = fragment.substring(0, indexOffset);
    }

    // resolve property name
    propertyValue = targetObject[fragment];

    // if a valid index exits, resolve it as well
    if (indexPath !== null) {
        propertyValue = _getArrayItem(indexSeparator, propertyValue, indexPath);
    }

    // and if additional fragments exist, recurse
    if (fragmentsCount > 1) {
        const path = fragments.slice(1).join(propertySeparator);
        propertyValue = _getPropertyValue(propertySeparator, indexSeparator, propertyValue, path);
    }

    return propertyValue;

}

function _getArrayItem(indexSeparator, target, path) {

    let item; // returns undefined by default

    if (!_isArray(target) || !_isString(path)) {
        throw new Error(NAME_RESOLUTION_ERROR);
    }

    const fragments = path.split(indexSeparator);
    const fragmentsCount = fragments.length;

    if (fragmentsCount < 1) {
        throw new Error(BAD_NAME_ERROR);
    }

    const fragment = fragments[0];
    const index = parseInt(fragment, 10);

    if (isNaN(index) || index < 0 || index.toString(10) !== fragment) {
        throw new Error(BAD_NAME_ERROR);
    }

    // read item value
    item = target[index];

    if (fragmentsCount > 1) {
        const newPath = fragments.slice(1).join(indexSeparator);
        item = _getArrayItem(indexSeparator, item, newPath);
    }

    return item;

}

function _setArrayItem(indexSeparator, target, path, value) {

    let result = false;

    if (!_isArray(target) || !_isString(path)) {
        throw new Error(NAME_RESOLUTION_ERROR);
    }

    const fragments = path.split(indexSeparator);
    const fragmentsCount = fragments.length;

    if (fragmentsCount < 1) {
        throw new Error(BAD_NAME_ERROR);
    }

    const fragment = fragments[0];
    const index = parseInt(fragment, 10);

    if (isNaN(index) || index < 0 || index.toString(10) !== fragment) {
        throw new Error(BAD_NAME_ERROR);
    }

    if (fragmentsCount > 1) {
        let item = target[index];
        if (_isUndefined(item)) {
            item = [];
            target[index] = item;
        } else if (!_isArray(item)) {
            throw new Error(NAME_RESOLUTION_ERROR);
        }
        const newPath = fragments.slice(1).join(indexSeparator);
        result = _setArrayItem(indexSeparator, item, newPath, value);
    } else {
        target[index] = value;
        result = true;
    }

    return result;

}

function _setPropertyValue(propertySeparator, indexSeparator, targetObject, propertyName, propertyValue, abort) {

    if (!_isObject(targetObject) || !_isString(propertyName)) {
        throw new Error(NAME_RESOLUTION_ERROR);
    }

    const fragments = propertyName.split(propertySeparator);
    const fragmentsCount = fragments.length;

    // check if fragment count is valid
    if (fragmentsCount < 1) {
        throw new Error(BAD_NAME_ERROR);
    }

    let fragment = fragments[0];
    let indexOffset = fragment.indexOf(indexSeparator);
    let indexPath = null; // null by default is important here

    // check if an index exists inside the fragment
    if (indexOffset > -1) {
        indexPath = fragment.substring(indexOffset + 1);
        fragment = fragment.substring(0, indexOffset);
    }

    // update fragment exist flag after removing index
    let fragmentExists = fragment in targetObject; // should we use hasOwnProperty here?
    let fragmentValue;

    // the current fragment is expected to be an array reference
    if (indexPath !== null) {

        let targetArray;

        if (fragmentExists) {
            targetArray = targetObject[fragment];
            if (!_isArray(targetArray)) {
                // non-array fragment being referenced as array... abort!
                throw new Error(NAME_RESOLUTION_ERROR);
            }
        } else {
            targetArray = [];
            targetObject[fragment] = targetArray;
        }

        // if it is the final fragment, simply set the property
        if (fragmentsCount === 1) {
            return _setArrayItem(indexSeparator, targetArray, indexPath, propertyValue);
        }

        // since we have additional fragments, we try to traverse the array path and set the fragment value
        try {
            fragmentValue = _getArrayItem(indexSeparator, targetArray, indexPath);
        } catch (error) { /* nothing to do here*/ }

        if (_isUndefined(fragmentValue)) {
            fragmentValue = {};
            // and then, set array path to new value
            _setArrayItem(indexSeparator, targetArray, indexPath, fragmentValue);
        }

    } else {
        if (fragmentExists) {
            fragmentValue = targetObject[fragment];
        }
    }

    if (fragmentsCount > 1) {
        if (_isUndefined(fragmentValue)) {
            fragmentValue = {};
            targetObject[fragment] = fragmentValue;
        } else if (!_isObject(fragmentValue)) {
            throw new Error(NAME_RESOLUTION_ERROR);
        }
        const path = fragments.slice(1).join(propertySeparator);
        return _setPropertyValue(propertySeparator, indexSeparator, fragmentValue, path, propertyValue);
    } else {
        targetObject[fragment] = propertyValue;
        return true;
    }


    return false;

}

function _formatItem(item) {
    let formatedItem = EMPTY_STRING;
    if (_isString(item)) {
        formatedItem = item.replace('\\', '\\\\');
        formatedItem = formatedItem.replace('"', '\\"');
        formatedItem = '"' + formatedItem + '"';
    } else if (_isFunction(item)) {
        formatedItem = '[function]';
        if (_isString(item.name)) {
            formatedItem = `${formatedItem} (${item.name})`;
        }
    } else if (!_isUndefined(item)) {
        formatedItem = item + '';
    }
    return formatedItem;
}

function _dump(propertySeparator, indexSeparator, target, prefix, output) {

    if (!_isString(output)) {
        output = EMPTY_STRING;
    }

    if (!_isString(prefix)) {
        prefix = EMPTY_STRING;
    }

    if (_isObject(target)) {
        for (let property in target) {
            let item = target[property];
            let itemPrefix = prefix.length > 0 ? `${prefix}${propertySeparator}${property}` : property;
            if (_isObject(item) || _isArray(item)) {
                output = _dump(propertySeparator, indexSeparator, item, itemPrefix, output);
            } else {
                item = _formatItem(item);
                output += `${itemPrefix} = ${item}\n`;
            }
        }
    } else if (_isArray(target)) {
        let length = target.length;
        if (length > 0) {
            prefix += indexSeparator;
            for (let i = 0; i < length; ++i) {
                let item = target[i];
                let itemPrefix = `${prefix}${i}`;
                if (_isObject(item) || _isArray(item)) {
                    output = _dump(propertySeparator, indexSeparator, item, itemPrefix, output);
                } else {
                    item = _formatItem(item);
                    output += `${itemPrefix} = ${item}\n`;
                }
            }
        }
    }

    return output;

}

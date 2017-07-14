import tests from '../../lib/utils/tests';

/**
 * Constants
 */

const STRING = 'string';
const NUMBER = 'number';
const FUNCTION = 'function';
const hasOwn = Object.prototype.hasOwnProperty;
const { isObject, isString } = tests;

/**
 * Class Definition
 */

export class Metadata {

    /**
     * Constructor and Instance Methods
     */

    constructor(data, uid) {
        // Define the main "_data" private property as an immutable property.
        // IMPORTANT: This property can only be set during instance construction.
        Object.defineProperty(this, '_data', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: data
        });

        // Define the main "_uid" private property as an immutable property.
        // IMPORTANT: This property can only be set during instance construction.
        Object.defineProperty(this, '_uid', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: uid
        });

        // Define "_custom" properties as an immutable property.
        // IMPORTANT: This property can only be set during instance construction.
        Object.defineProperty(this, '_custom', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: Object.create(null)
        });
    }

    getData() {
        return this._data;
    }

    getDataProperty(propertyName) {
        let propertyValue;
        const _data = this._data;
        if (isObject(_data)) {
            propertyValue = _data[propertyName];
        }
        return propertyValue;
    }

    /**
     * Get unique object ID
     */
    getObjectID() {
        return this._uid;
    }

    /**
     * Get the value of a given tag.
     * @param {string|number} tagOrProperty The tag or property name whose value is being read.
     * @param {any} defaultValue The value to be returned when the referred tag could not be found.
     * @return {any} The value of the tag given or undefined. When t
     */
    getTagValue(tagName, defaultValue) {
        throw new Error('Metadata::getTagValue Method not implemented');
    }

    /**
     * Check if the tagOrProperty exists.
     * @param  {string|number} tagOrProperty The tag or property name whose existence is being tested.
     * @return {boolean} Returns true if the tag exists or false otherwise.
     */
    tagExists(tagName) {
        throw new Error('Metadata::tagExists Method not implemented');
    }

    /**
     * Set custom attribute value
     * @param {String} attribute Custom attribute name
     * @param {Any} value     Custom attribute value
     */
    setCustomAttribute(attribute, value) {
        if (isString(attribute)) {
            this._custom[attribute] = value;
        }
    }

    /**
     * Get custom attribute value
     * @param  {String} attribute Custom attribute name
     * @return {Any}              Custom attribute value
     */
    getCustomAttribute(attribute) {
        let value;
        if (isString(attribute)) {
            value = this._custom[attribute];
        }
        return value;
    }

    /**
     * Check if a custom attribute exists
     * @param  {String} attribute Custom attribute name
     * @return {Boolean}          True if custom attribute exists or false if not
     */
    customAttributeExists(attribute) {
        return attribute in this._custom;
    }

    /**
     * Set custom attributes in batch mode.
     * @param {Object} attributeMap An object whose own properties will be used as custom attributes.
     */
    setCustomAttributes(attributeMap) {
        const _custom = this._custom;
        for (let attribute in attributeMap) {
            if (hasOwn.call(attributeMap, attribute)) {
                _custom[attribute] = attributeMap[attribute];
            }
        }
    }

    /**
     * Static Methods
     */

    static isValidUID(uid) {
        return typeof uid === STRING && uid.length > 0;
    }

    static isValidIndex(index) {
        return typeof index === NUMBER && index >= 0 && (index | 0) === index;
    }

    static isValidCallback(callback) {
        return typeof callback === FUNCTION;
    }

}

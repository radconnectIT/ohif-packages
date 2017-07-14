
import tests from './tests';

const { isObject } = tests;
const hasOwnProperty = Object.prototype.hasOwnProperty;

export default function deepFreeze(object) {

    // Will only be applied to Objects and won't be applied if they are frozen yet...
    if (isObject(object) && !Object.isFrozen(object)) {
        // Freeze the object first to prevent cyclic reference issues
        Object.freeze(object);
        // Freeze properties
        for (let property in object) {
            if (hasOwnProperty.call(object, property)) {
                deepFreeze(object[property]);
            }
        };
    }

};

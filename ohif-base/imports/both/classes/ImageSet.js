import { Random } from 'meteor/random';
import { InstanceMetadata } from './metadata/InstanceMetadata';
import tests from '../lib/utils/tests';

/**
 * Constants
 */

const { isObject, isArray, isNumber } = tests;
const hasOwn = Object.prototype.hasOwnProperty;

/**
 * This class defines an ImageSet object which will be used across the viewer. This object represents
 * a list of images that are associated by any arbitrary criteria being thus content agnostic. Besides the
 * main attributes (images and uid) it allows additional attributes to be appended to it (currently
 * indiscriminately, but this should be changed).
 */
export class ImageSet {

    constructor(images) {

        if (!isArray(images) || !(images.every(image => image instanceof InstanceMetadata))) {
            throw new TypeError('ImageSet expects an array of images');
        }

        // @property "images"
        Object.defineProperty(this, 'images', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: images.slice() // make it a copy of the original array
        });

        // @property "uid"
        Object.defineProperty(this, 'uid', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: Random.id() // Unique ID of the instance
        });

    }

    getUID() {
        return this.uid;
    }

    setAttribute(attribute, value) {
        this[attribute] = value;
    }

    getAttribute(attribute) {
        return this[attribute];
    }

    setAttributes(attributes) {
        if (isObject(attributes)) {
            const imageSet = this;
            for (let attribute in attributes) {
                if (hasOwn.call(attributes, attribute)) {
                    imageSet[attribute] = attributes[attribute];
                }
            }
        }
    }

    getImage(index) {
        let image;
        if (isNumber(index)) {
            image = this.images[index];
        }
        return image;
    }

    sortBy(sortingCallback) {
        return this.images.sort(sortingCallback);
    }

    forEachImage(callback) {
        this.images.forEach(callback, this);
    }

}

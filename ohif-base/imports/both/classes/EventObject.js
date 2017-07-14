
import tests from '../lib/utils/tests';

const { isString } = tests;

export class EventObject {

    constructor(type, data, source) {

        if (!isString(type)) {
            throw new TypeError('EventObject::constructor Invalid Arguments');
        }

        // define immutable properties
        Object.defineProperties(this, {
            type: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: type
            },
            time: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: Date.now()
            },
            data: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: data
            },
            source: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: source
            }
        });

    }

    getType() {
        return this.type;
    }

    getTime() {
        return this.time;
    }

    getData() {
        return this.data;
    }

    getSource() {
        return this.source;
    }

}

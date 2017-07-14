
import { EventObject } from './EventObject';
import tests from '../lib/utils/tests';

const { isString, isFunction, isObject } = tests;

export class EventHandler {

    constructor(type, handler, context, object, once) {

        // validate arguments
        if (!isString(type) || !isFunction(handler)) {
            throw new TypeError('EventHandler::constructor Invalid Arguments');
        }

        // define immutable properties
        Object.defineProperties(this, {
            type: {
                configurable: false,
                enumerable: true,
                writable: false,
                value: type
            },
            handler: {
                configurable: false,
                enumerable: true,
                writable: false,
                value: handler
            },
            context: {
                configurable: false,
                enumerable: true,
                writable: false,
                value: context
            },
            object: {
                configurable: false,
                enumerable: true,
                writable: false,
                value: isObject(object) ? object : null
            },
            once: {
                configurable: false,
                enumerable: true,
                writable: false,
                value: once === true
            }
        });

    }

    dispatch(event) {
        if (event instanceof EventObject && event.getType() === this.type) {
            this.handler.call(this.object, event, this.context);
        }
    }

}

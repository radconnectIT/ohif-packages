
import { EventObject } from './EventObject';
import { EventHandler } from './EventHandler';

import tests from '../lib/utils/tests';

const { isFunction } = tests;

export class EventSource {

    constructor() {
        Object.defineProperty(this, '_eventHandlersMap', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: Object.create(null)
        });
    }

    on(type, handler, context, object, once) {
        const eventHandler = new EventHandler(type, handler, context, object, once);
        const eventHandlersMap = this._eventHandlersMap;
        let handlers = eventHandlersMap[eventHandler.type];
        if (!(handlers instanceof Array)) {
            handlers = [];
            eventHandlersMap[eventHandler.type] = handlers;
        }
        handlers.push(eventHandler);
    }

    once(type, handler, context, object) {
        this.on(type, handler, context, object, true);
    }

    off(type, handler) {
        const eventHandlersMap = this._eventHandlersMap;
        const eventHandlers = eventHandlersMap[type];
        if (eventHandlers instanceof Array) {
            if (isFunction(handler)) {
                const found = eventHandlers.findIndex(eventHandler => eventHandler instanceof EventHandler && eventHandler.handler === handler);
                if (found >= 0) {
                    eventHandlers.splice(found, 1);
                }
            } else {
                eventHandlers.splice(0);
            }
        }
    }

    dispatchAsync(type, data) {
        const event = new EventObject(type, data, this);
        setTimeout(() => {
            this.dispatchEvent(event);
        }, 0);
    }

    dispatch(type, data) {
        const event = new EventObject(type, data, this);
        this.dispatchEvent(event);
    }

    dispatchEvent(event) {
        if (event instanceof EventObject) {
            const eventHandlersMap = this._eventHandlersMap;
            const handlers = eventHandlersMap[event.type];
            if (handlers instanceof Array) {
                for (let i = 0, limit = handlers.length; i < limit; ++i) {
                    const handler = handlers[i];
                    if (handler instanceof EventHandler) {
                        handler.dispatch(event);
                        if (handler.once) {
                            handlers.splice(i, 1);
                            --i, --limit;
                        }
                    }
                }
            }
        }
    }

}


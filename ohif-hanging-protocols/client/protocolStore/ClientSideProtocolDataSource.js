// OHIF Modules
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:hanging-protocols-base';

/**
 * Constants
 */

const { ProtocolDataSource, entity: { Protocol } } = OHIF.hangingprotocols;
const { isString, isArray, isFunction } = OHIF.base.utils.tests;
const Storage = HP.ProtocolStore; // use global definition since no import option is given

/**
 * Class Definition
 */

export class ClientSideProtocolDataSource extends ProtocolDataSource {

    constructor() {
        super();
        const subscription = new Promise((resolve, reject) => {
            Storage.onReady((success, error) => {
                if (success) {
                    resolve(Storage);
                } else {
                    reject(error);
                }
            });
        });
        // make "subscription" a hidden read-only property
        Object.defineProperty(this, 'subscription', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: subscription
        });
    }

    // @Override
    forEach(callback) {
        const timerStart = Date.now();
        return this.subscription.then(storage => {
            if (!isFunction(callback)) {
                throw new TypeError('ClientSideProtocolDataSource::forEach callback argument is not a function');
            }
            // load protocols just as it is being done by now
            const protocols = storage.getProtocol();
            if (!isArray(protocols)) {
                throw new Error('ClientSideProtocolDataSource::forEach Unexpected return from storage');
            }
            // define result structure
            const result = {
                completed: true,
                items: 0,
                iterations: 0,
                duration: 0
            };
            let i, limit = protocols.length;
            result.items = limit;
            for (i = 0; i < limit; ++i) {
                if (callback.call(null, protocols[i], i) === false)  {
                    result.completed = (++i === limit); // "++i" is necessary here to get the correct number of iterations below...
                    break;
                }
            }
            result.iterations = i;
            result.duration = Date.now() - timerStart;
            return result;
        });
    }

    // @Override
    findById(id) {
        const timerStart = Date.now();
        return this.subscription.then(storage => {
            if (!isString(id) || id.length < 1) {
                throw new TypeError('ClientSideProtocolDataSource::findById Invalid ID');
            }
            const protocol = storage.getProtocol(id);
            const result = {
                found: false,
                duration: 0,
                index: 0, // within the result set... not meaniful right now.
                item: null
            };
            if (protocol instanceof Protocol) {
                result.found = true;
                result.item = protocol;
            }
            result.duration = Date.now() - timerStart;
            return result;
        });
    }

}

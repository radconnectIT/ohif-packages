import { _ } from 'meteor/underscore';

// OHIF modules
import { OHIF } from 'meteor/ohif:core';

/*
 *  Object that represents a state history of an object. It has three properties 
 *  (past, current, future) that caches the history of states of an object.
 *  Example: 
 *      {
 *          past: [ 0, 1, 2, 3, 4, 5, 6, 7 ],
 *          current: 8,
 *          future: [ 9, 10 ]
 *      }
 */
export class StateManager {

    constructor(current = Object.create(null)) {
        // Initialize Private Properties
        Object.defineProperty(this,
        '_past', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: []
        });

         Object.defineProperty(this,
        '_current', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: current
        });

        Object.defineProperty(this,
        '_future', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: []
        });

        Object.defineProperty(this,
        '_diff', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: []
        });
    }

    get pristine() {
        return this._past[0] || this._current;
    }

    get current() {
        return this._current;
    }

    get future() {
        return this._future;
    }

    get past() {
        return this._past;
    }

    get diff() {
        return this._diff;
    }

    get lastPast() {
        return this._past[this._past.length - 1];
    }

    redo() {
        if (this._future[0] === void 0) {
            OHIF.log.info('StateManager::redo no future state to set as current');
        }

        // Add current state as the last past element
        this._past.push(this._current);

        // Remove the first element from the future and set it as current
        this._current = this._future.shift()
    }

    undo() {
        if (this._past.length === 0) {
            OHIF.log.info('StateManager::undo no past state to set as current');
        }

        // Add current state as the first future element
        this._future.unshift(this._current);

        // Remove the last element from the past and set it as current
        this._current = this._past.pop();
    }

    add(newState, diff) {
        // Check if the new stage is not the same as the current
        if (_.isEqual(newState, this.current)) {
            return;
        }

        // Move current state to the past
        if (!_.isEmpty(this._current)) {
            this._past.push(this._current);

            if (diff !== void 0 && !_.isEmpty(diff)) {
                if (diff instanceof Array) {
                    this._diff.push.apply(this._diff, diff);
                } else {
                    this._diff.push(diff);
                }
            }
        }

        // Set current state
        this._current = newState;

        // Clear future states
        this._future.length = 0;
    }

    clear(current = {}) {
        this._current = current;
        this._past.length = 0;
        this._future.length = 0;
        this._diff.length = 0;
    }

    hasPastStates() {
        return this._past.length > 0;
    }

    hasDiffs() {
        return this._diff.length > 0;
    }

    hasChanges() {
        return this.hasPastStates() || this.hasDiffs() || this.hasFutureStates();
    }

    hasFutureStates() {
        return this._future.length > 0;
    }

    forEachDiff(callback) {
        this._diff.forEach((diff, index) => {
            callback.call(null, diff, index);
        });
    }

}
import { OHIF } from 'meteor/ohif:core';

/**
 * An object of this class can be used to manager multiple promises at a same time.
 * It encapsulate a list of promises that when all of them resolve.
 */
export class PromiseManager {
  constructor() {
    // Array of promises
    this._promises = [];

    // Map object to map promise's name to its index
    this._dictionary = new Map();

    // Cache for the current index
    this._currentIndex = 0;
  }

  /**
   * Return all the added promises.
   * @return {Array} Array of added promises
   */
  getPromises() {
    return this._promises;
  }

  /**
   * Get the promise index by its name. If not found, undefined is returned.
   * @param  {String} name        Name of the added promise
   * @return {Integer|undefined}  The index of the given Promise Name or undefined if not found
   */
  getPromiseIndexByName(name) {
    const promiseIndex = this._dictionary.get(name);

    return promiseIndex;
  }

  /**
   * Get a promise by its index. If not found, undefined is returned.
   * @param  {Integer} index      Index of the requested Promise
   * @return {Promise|undefined}  Promise if it exists, or undefined.
   */
  getPromiseByIndex(index) {
    const promise = this._promises[index];

    return promise;
  }

   /**
   * Get a promise by its name. If not found, undefined is returned.
   * @param  {String} name        Name of the requested promise
   * @return {Promise|undefined}  Promise if it exists, or undefined.
   */
  getPromiseByName(name) {
    let promise;

    const promiseIndex = this.getPromiseIndexByName(name);

    if (promiseIndex !== void 0) {
      promise = this._promises[promiseIndex];
    }

    return promise;
  }

  /**
   * Returns a single Promise that resolves when all of the promises have resolved, 
   * or rejects with the reason of the first promise that rejects.
   * @return {Promise} A single Promise that contains all the resolved results or a 
   *                   reject, if one of them fails
   */
  all() {
    return Promise.all(this._promises);
  }

  /**
   * Add multiple promises at a time.
   * @param {Array} promises An array that which item has "name" and "promise"
   *                         properties.
   */
  addPromises(promises) {
    if (!promises || !(promises instanceof Array)) {
      throw new OHIF.base.OHIFError('PromiseManager::addPromises promises is not valid');
    }

    promises.forEach(promiseInfo => {
      const { name, promise } = promiseInfo;

      this.addPromise(name, promise);
    });
  }

  /**
   * Add a single Promise for the given name. This name is used to get the promise
   * index. This way, it can access the result by this index.
   * @param {String} name     Name of the Promise
   * @param {Promise} promise A promise 
   */
  addPromise(name, promise) {
    if (!name) {
      throw new OHIF.base.OHIFError('PromiseManager::addPromise name is not valid');
    }

    if (promise === void 0) {
      throw new OHIF.base.OHIFError('PromiseManager::addPromise promise is not valid');
    }

    this._dictionary.set(name, this._currentIndex);

    // Add the given promise
    this._promises.push(promise);

    // Update the current index
    this._currentIndex++;
  }

  removePromiseByName(name) {
    throw new OHIF.base.OHIFError('PromiseManager::removePromiseByName not implemented yet');
  }

  removePromiseByIndex(index) {
    throw new OHIF.base.OHIFError('PromiseManager::removePromiseByIndex not implemented yet');
  }

}
/**
 * This *abstract* class is a DAL abstraction to facilitate asynchronous access to sequential data coming
 * from different storage types or endpoints.
 */
export class AsyncDataSource {

    /**
     * Use this method to retrieve the amount of items the data source holds.
     * @returns {Promise} A promise which, when fulfilled, receives the amount of items the data source holds.
     * If an error occurs during the process, the promise will be rejected with error details.
     */
    count() {
        return Promise.reject(new Error('AsyncDataSource::count Method not implemented'));
    }

    /**
     * Use this method to retrieve a specific item from the data source.
     * @returns {Promise} A promise which, when fulfilled, receives the item found at the given index
     * within the data source. If the index is out of bounds, undefined will be provided.
     * If an error occurs during the process, the promise will be rejected with error details.
     */
    get(index) {
        return Promise.reject(new Error('AsyncDataSource::get Method not implemented'));
    }

    /**
     * Use this method to iterate over the entire list of items the data source holds.
     * @param {function} callback A callback function to be executed asynchronous for each item in the data source
     * in a predefined and immutable order. The callback function will be given two arguments: the item itself and
     * its numerical index within the data source. If the callback returns boolean false, the iteration process will
     * be aborted. In either case, the returned promise shall be resolved with an object that provides information
     * about the iterarion process as in the following example:
     * { completed: true, items: 1234, iterations: 1234, duration: 1.2345 }
     * @returns {Promise} A promise that will be fulfilled when the iteration process is complete or aborted by the user.
     * In either case, the iteration promise will be resolved with information about the iteration process. If an error
     * occurs, the promise will be rejected with error details.
     */
    forEach(callback) {
        return Promise.reject(new Error('AsyncDataSource::forEach Method not implemented'));
    }

    /**
     * Use this method to create another data source containing only items that match the given criteria. No assumptions
     * are made or constraints are enforced for its single "criteria" parameter leaving it entirely up to the implementers
     * the responsability of defining a data structue that best suits their needs.
     * @param {any} criteria The domain specific information necessary to filter the current data set.
     * @returns {Promise} A promise that when fulfilled will receive another data source instance holding the items
     * that match the given criteria. If an error prevents the new data source instance from being created, the
     * promise will be rejected with error details.
     */
    filter(criteria) {
        return Promise.reject(new Error('AsyncDataSource::filter Method not implemented'));
    }

    /**
     * Use this method to search for a specific item in the data source. No assumptions are made or constraints are
     * enforced for its single "criteria" parameter leaving it entirely up to the implementers the responsability
     * of defining a data structue that best suits their needs. Whether an item is found or not, the returned promise
     * shall be resolved with an object that provides information about the search process as in the following example:
     * { found: true, duration: 1.2345, index: 1234, item: { name: 'John Doe', email: 'johndoe@example.com' } }
     * If an error occurs during the process, the promise will be rejected with error details.
     * @param {any} criteria The domain specific information to be used as search criteria.
     * @returns {Promise} A promise that will be fulfilled when the search process is complete or rejected on error.
     */
    find(criteria) {
        return Promise.reject(new Error('AsyncDataSource::find Method not implemented'));
    }


}

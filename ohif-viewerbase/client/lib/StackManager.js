import { OHIF } from 'meteor/ohif:core';
import { getImageId } from './getImageId';

let stackMap = {};
let configuration = {};
const stackUpdatedCallbacks = [];

/**
 * Loop through the current series and add metadata to the
 * Cornerstone meta data provider. This will be used to fill information
 * into the viewport overlays, and to calculate reference lines and orientation markers
 * @param  {Object} stackMap              stackMap object
 * @param  {Object} study                 Study object
 * @param  {Object} displaySet            The set of images to make the stack from
 * @return {Array}                        Array with image IDs
 */
const createAndAddStack = (stackMap, study, displaySet) => {
    const metadataProvider = OHIF.viewer.metadataProvider;
    const numImages = displaySet.images.length;
    const imageIds = [];
    let imageId;

    displaySet.images.forEach((instance, imageIndex) => {
        const image = instance.getData();
        const metaData = {
            instance: image, // in this context, instance will be the data of the InstanceMetadata object...
            series: displaySet, // TODO: Check this
            study: study,
            numImages: numImages,
            imageIndex: imageIndex + 1
        };

        const numberOfFrames = image.numberOfFrames;
        if (numberOfFrames > 1) {
            OHIF.log.info('Multiframe image detected');
            for (let i = 0; i < numberOfFrames; i++) {
                metaData.frame = i;
                imageId = getImageId(image, i);
                imageIds.push(imageId);
                metadataProvider.addMetadata(imageId, metaData);
            }
        } 
        else {
            imageId = getImageId(image);
            imageIds.push(imageId);
            metadataProvider.addMetadata(imageId, metaData);
        }
    });

    const stack = {
        displaySetInstanceUid: displaySet.displaySetInstanceUid,
        imageIds: imageIds,
        frameRate: displaySet.frameRate,
        isClip: displaySet.isClip
    };

    stackMap[displaySet.displaySetInstanceUid] = stack;

    return stack;
};

/**
 * Return all imageIds from a stack with the given displaySetInstanceUid
 * @param  {Object}          stackMap              stackMap object
 * @param  {String}          displaySetInstanceUid The UID of the stack to find
 * @return {Array|undefined}                       Array of imageIds for the given stack
 */
const getImageIds = (stackMap, displaySetInstanceUid) => {
    const stack = stackMap[displaySetInstanceUid];

    return stack && stack.imageIds;
};

configuration = {
    createAndAddStack,
    getImageIds
};

/**
 * This object contains all the functions needed for interacting with the stack manager.
 * Generally, findStack is the only function used. If you want to know when new stacks
 * come in, you can register a callback with addStackUpdatedCallback.
 */
const StackManager = {
    /**
     * Removes all current stacks
     */
    clearStacks() {
        stackMap = {};
    },
    /**
     * Create a stack from an image set, as well as add in the metadata on a per image bases.
     * @param  study      The study who's metadata will be added
     * @param  displaySet The set of images to make the stack from
     * @return {Array}    Array with image IDs
     */
    makeAndAddStack(study, displaySet) {
        return configuration.createAndAddStack(stackMap, study, displaySet, stackUpdatedCallbacks);
    },
    /**
     * Find a stack from the currently created stacks.
     * @param  {String} displaySetInstanceUid The UID of the stack to find
     * @return {*}                            undefined if not found, otherwise the stack object
     */
    findStack(displaySetInstanceUid) {
        return stackMap[displaySetInstanceUid];
    },
    /**
     * Gets the underlying map of displaySetInstanceUid to stack object.
     * WARNING: Do not change this object. It directly affects the manager.
     * @return {{}} map of displaySetInstanceUid -> stack.
     */
    getAllStacks() {
        return stackMap;
    },
    /**
     * Return all imageIds from a stack with the given displaySetInstanceUid
     * @param {String}           displaySetInstanceUid The UID of the stack to find
     * @return {Array|undefined}                       Array of imageIds for the given stack
     */
    getImageIds(displaySetInstanceUid) {
        return configuration.getImageIds(stackMap, displaySetInstanceUid);
    },
    /**
     * Adds in a callback to be called on a stack being added / updated.
     * @param (Function) callback Must accept at minimum one argument,
     *                            which is the stack that was added / updated.
     */
    addStackUpdatedCallback(callback) {
        if (typeof callback !== 'function') {
            throw new OHIF.base.OHIFError('StackManager::addStackUpdatedCallback callback must be a function');
        }
        stackUpdatedCallbacks.push(callback);
    },
    /**
     * Return configuration
     */
    getConfiguration() {
        return configuration;
    },
    /**
     * Set configuration, in order to provide compatibility
     * with other systems by overriding this functions
     * @param {Object} config object with functions to be overrided
     *
     * For now, only makeAndAddStack and getImageIds can be overrided
     */
    setConfiguration(config) {
        Object.keys(config).forEach(key => {
            this.setConfigurationProperty(key, config[key]);
        });
    },
    /**
     * Set a single configuration property
     * @param {String}   property Name of the configuration property to be set
     * @param {Function} fn       Function to set
     *
     * For now, only makeAndAddStack and getImageIds can be overrided
     */
    setConfigurationProperty(property, fn) {
        if (!(property in configuration)) {
            throw new OHIF.base.OHIFError('StackManager::setConfigurationProperty the given property can not be overrided');
        }

        if (typeof fn !== 'function') {
            throw new OHIF.base.OHIFError('StackManager::setConfigurationProperty fn must be a function');
        }

        configuration[property] = fn;
    }
};

export { StackManager };

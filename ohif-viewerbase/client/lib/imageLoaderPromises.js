import { PromiseManager } from './classes/PromiseManager';
/**
 * This method returns a Viewerbase.PromiseManager instance that
 * encapsulates all the image loading promises, that once resolved, 
 * guarantees that all data associated with this imageId are already
 * resolved. For now, it only supports Cornerstone loadAndCacheImage
 * @param  {String} imageId ImageID string
 * @return {PromiseManager} An instance of PromiseManager containing all image loading promises
 */
export function imageLoaderPromises(imageId) {
    const imagePromise = cornerstone.loadAndCacheImage(imageId);

    const promiseManager = new PromiseManager();

    // Add a single promise. For multiple one, use promiseManager.addPromises instead
    promiseManager.addPromise('image', imagePromise);

    return promiseManager;
}

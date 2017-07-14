import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { StackManager } from './StackManager.js';

/**
 * This function enables stack prefetching for a specified element (viewport)
 * It first disables any prefetching currently occurring on any other viewports.
 *
 * @param element
 */
export function enablePrefetchOnElement(element, viewportIndex) {
    OHIF.log.info('enablePrefetchOnElement');

    // If the stack in the active viewport has more than one image,
    // enable prefetching for the element
    const cornerstoneStack = cornerstoneTools.getToolState(element, 'stack');
    if (!cornerstoneStack || cornerstoneStack.data.length < 1) {
        throw Error('Element stack not available');
    }

    if (cornerstoneStack.data[0].imageIds.length > 1) {
        const contentId = Session.get('activeContentId');
        // @TODO Find a better way to find the displaySetInstanceUid of the given element.
        const displaySetInstanceUid = ViewerData[contentId].loadedSeriesData[viewportIndex].displaySetInstanceUid;

        const stack = StackManager.findStack(displaySetInstanceUid);

        if (!stack) {
            throw new OHIF.base.OHIFError(`Requested stack ${displaySetInstanceUid} was not created`);
        }

        cornerstoneTools.stackPrefetch.enable(element);
    }

}

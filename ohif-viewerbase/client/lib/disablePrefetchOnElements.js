import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

/**
 * This function enables stack prefetching for a specified element (viewport)
 * It first disables any prefetching currently occurring on any other viewports.
 *
 * @param element
 */
export function disablePrefetchOnElements(element) {
    if (element instanceof Element) {
        try {
            cornerstoneTools.stackPrefetch.disable(element);
        } catch (error) { /* silence is golden */ }
    }
}

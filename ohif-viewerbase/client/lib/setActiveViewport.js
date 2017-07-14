import { OHIF } from 'meteor/ohif:core';

/**
 * Sets a viewport element active
 * @param  {node} element DOM element to be activated
 */
export function setActiveViewport(element) {

    const { layoutManager } = OHIF.viewer;

    if (layoutManager) {
        layoutManager.setActiveViewport(element);
    }

}

import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

const VIEWPORT_SELECTOR = '.imageViewerViewport';

/**
 * This function disables reference lines for a specific viewport element.
 * It also enables reference lines for all other viewports with the
 * class .imageViewerViewport.
 *
 * @param element {node} DOM Node representing the viewport element
 */
export function displayReferenceLines(element) {

    const referenceLines = OHIF.viewer.tools.referenceLines;
    if (!referenceLines) {
        return;
    }

    // Clear reference lines tool
    referenceLines.clear();

    if (element instanceof Element) {
        // Check if image plane (orientation / loction) data is present for the current image
        const enabledElement = cornerstone.getEnabledElement(element);
        // Check if element is already enabled and it's image was rendered
        if (enabledElement && enabledElement.image) {
            const imageId = enabledElement.image.imageId;
            const imagePlane = cornerstoneTools.metaData.get('imagePlane', imageId);
            if (imagePlane && imagePlane.frameOfReferenceUID) {
                // Make the current element a source for reference lines
                referenceLines.addSource(element);
            } else {
                OHIF.log.info('displayReferenceLines No imagePlane nor frameOfReferenceUID for given element');
            }
        } else {
            OHIF.log.info('displayReferenceLines enabled element is undefined or its image is not rendered');
        }
    }

    // Loop through all other viewport elements and enable reference lines
    $(VIEWPORT_SELECTOR).not(element).each((viewportIndex, viewportElement) => {
        try {
            referenceLines.addTarget(viewportElement);
        } catch(error) {
            OHIF.log.info(`displayReferenceLines Reference Lines could not be enabled for viewport #${viewportIndex}... ${error}`);
        }
    });

}

import { OHIF } from 'meteor/ohif:core';
import { ReferenceLines } from './ReferenceLines';
import { viewportUtils } from '../../viewportUtils';
import { displayReferenceLines } from '../../displayReferenceLines';

const { getActiveViewportElement } = viewportUtils;

export class DefaultReferenceLinesTool extends ReferenceLines {

    // @Override
    addSource(element) {
        if (this.isEnabled()) {
            OHIF.viewer.updateImageSynchronizer.addSource(element);
        }
    }

    // @Override
    removeSource(element) {
        // Same as remove target...
        cornerstoneTools.referenceLines.tool.disable(element);
    }

    // @Override
    addTarget(element) {
        if (this.isEnabled()) {
            cornerstoneTools.referenceLines.tool.enable(element, OHIF.viewer.updateImageSynchronizer);
        }
    }

    // @Override
    removeTarget(element) {
        cornerstoneTools.referenceLines.tool.disable(element);
    }

    // @Override
    isEnabled() {
        return OHIF.viewer.refLinesEnabled;
    }

    // @Override
    clear() {
        // Loop through all other viewport elements and disable reference lines
        $('.imageViewerViewport').each((viewportIndex, viewportElement) => {
            try {
                // Make sure reference lines are disabled for all tools
                cornerstoneTools.referenceLines.tool.disable(viewportElement);
            } catch (error) { /* silence is golden */ }
        });
    }

    // @Override
    enable() {
        const element = getActiveViewportElement();
        displayReferenceLines(element);
        OHIF.log.info('DefaultReferenceLinesTool has been enabled.');
    }

    // @Override
    disable() {
        this.clear();
        OHIF.log.info('DefaultReferenceLinesTool has been disabled.');
    }

}

import { OHIF } from 'meteor/ohif:core';

/**
 * Get a specific metadata from a viewport by the given viewport index. It uses data saved in LayoutManager
 * and StackManager to get the imageId instead of cornerstone. This way, this function can be called for
 * not-enabled elements (cornerstone).
 * @param  {String}              metadataType  Type of the metadata to retrieve (ex: 'series', 'study')
 * @param  {Integer}             viewportIndex Index of the viewport to get the metadata
 * @return {Object|undefined}                  Metadata object of the given viewport or undefined if not found.
 */
export const getViewportMetadata = (metadataType, viewportIndex) => {
  // Get the displaySetInstanceUid to find the stack
  const { layoutManager: { viewportData }, stackManager } = OHIF.viewerbase;
  const displaySetInstanceUid = viewportData[viewportIndex] ? viewportData[viewportIndex].displaySetInstanceUid : void 0;

  // Check if displaySetInstanceUid is valid
  if (!displaySetInstanceUid) {
    OHIF.log.info('lib::getViewportMetadata no displaySetInstanceUid');
    return;
  }

  // Get the imageIds for the viewport
  const imageIds = stackManager.getImageIds(displaySetInstanceUid);
  
  // Check if imageIds is a valid array
  if (!imageIds || !imageIds[0]) {
    OHIF.log.info(`lib::getViewportMetadata no registered imageIds for ${displaySetInstanceUid}`);
    return;
  }

  // Based on the imageIds, get the metadata
  const metadata = cornerstone.metaData.get(metadataType, imageIds[0]);

  return metadata;
};
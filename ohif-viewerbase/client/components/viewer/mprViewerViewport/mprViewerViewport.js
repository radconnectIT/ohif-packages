import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { $ } from 'meteor/jquery';

// OHIF Modules
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

// Local Modules
import { StackManager } from '../../../lib/StackManager';
import { setActiveViewport } from '../../../lib/setActiveViewport';
import { imageViewerViewportData } from '../../../lib/imageViewerViewportData';
import { updateCrosshairsSynchronizer } from '../../../lib/updateCrosshairsSynchronizer';
import { toolManager } from '../../../lib/toolManager';
import { updateOrientationMarkers } from '../../../lib/updateOrientationMarkers';
import { getInstanceClassDefaultViewport } from '../../../lib/instanceClassSpecificViewport';
import { imageLoaderPromises } from '../../../lib/imageLoaderPromises';
import { VolumeManager } from 'meteor/mpr-rendering';
import { MultiPlanarReconstructionTools } from 'meteor/mpr-tools';

const allCornerstoneEvents =
  'CornerstoneToolsMouseDown CornerstoneToolsMouseDownActivate ' +
  'CornerstoneToolsMouseClick CornerstoneToolsMouseDrag CornerstoneToolsMouseUp ' +
  'CornerstoneToolsMouseWheel CornerstoneToolsTap CornerstoneToolsTouchPress ' +
  'CornerstoneToolsTouchStart CornerstoneToolsTouchStartActive ' +
  'CornerstoneToolsMultiTouchDragStart';

/**
 * This function loads a study series into a viewport element.
 *
 * @param data {object} Object containing the study, series, and viewport element to be used
 */
const loadDisplaySetIntoViewport = (data, templateData) => {
  OHIF.log.info('imageViewerViewport loadDisplaySetIntoViewport');

  // Make sure we have all the data required to render the series
  if (!data.study || !data.displaySet || !data.element) {
    OHIF.log.warn('loadDisplaySetIntoViewport: No Study, Display Set, or Element provided');
    return;
  }

  // Get the current element and it's index in the list of all viewports
  // The viewport index is often used to store information about a viewport element
  const element = data.element;
  const viewportIndex = $('.imageViewerViewport').index(element);

  const layoutManager = OHIF.viewerbase.layoutManager;
  layoutManager.viewportData = layoutManager.viewportData || {};
  layoutManager.viewportData[viewportIndex] = layoutManager.viewportData[viewportIndex] || {};
  layoutManager.viewportData[viewportIndex].viewportIndex = viewportIndex;

  // Get the contentID of the current study list tab, if the viewport is running
  // alongside the study list package
  const contentId = Session.get('activeContentId');

  // If the viewer is inside a tab, create an object related to the specified viewport
  // This data will be saved so that the tab can be reloaded to the same state after tabs
  // are switched
  if (contentId) {
    if (!ViewerData[contentId]) {
      return;
    }

    ViewerData[contentId].loadedSeriesData[viewportIndex] = {};
  }

  // Create shortcut to displaySet
  const displaySet = data.displaySet;

  // Get stack from Stack Manager
  let stack = StackManager.findStack(displaySet.displaySetInstanceUid);
  // Make sure if the stack is already loaded in the stack manager, otherwise create it
  if (!stack || !stack.imageIds) {
    stack = StackManager.makeAndAddStack(data.study, displaySet);
  }

  // If is a clip, updates the global FPS for cine dialog
  if (stack.isClip && stack.frameRate > 0) {
    // Sets the global variable
    OHIF.viewer.cine.framesPerSecond = parseFloat(stack.frameRate);
    // Update the cine dialog FPS
    Session.set('UpdateCINE', Random.id());
  }

  // Shortcut for array with image IDs
  const imageIds = stack.imageIds;

  // Define the current image stack using the newly created image IDs
  stack = {
    currentImageIdIndex: data.currentImageIdIndex > 0 && data.currentImageIdIndex < imageIds.length
      ? data.currentImageIdIndex
      : 0,
    imageIds: imageIds,
    displaySetInstanceUid: data.displaySetInstanceUid,
  };

  // Get the current image ID for the stack that will be rendered
  const imageId = imageIds[stack.currentImageIdIndex];

  // Save the current image ID inside the template data so it can be
  // retrieved from the template helpers
  templateData.imageId = imageId;

  // Save the current image ID inside the ViewportLoading object.
  //
  // The ViewportLoading object relates the viewport elements with whichever
  // image is currently being loaded into them. This is useful so that we can
  // place progress (download %) for each image inside the proper viewports.
  window.ViewportLoading[viewportIndex] = imageId;

  // Enable Cornerstone for the viewport element
  const options = {
    renderer: 'webgl',
  };

  // NOTE: This uses the experimental WebGL renderer for Cornerstone!
  // If you have problems, replace it with this line instead:
  // cornerstone.enable(element);

  // Get the handler functions that will run when loading has finished or thrown
  // an error. These are used to show/hide loading / error text boxes on each viewport.
  const endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
  const errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();
  cornerstone.enable(element);
  let enabledElement = cornerstone.getEnabledElement(element);
  // Get the current viewport settings
  const viewport = cornerstone.getViewport(element);

  const { studyInstanceUid, seriesInstanceUid, displaySetInstanceUid, currentImageIdIndex } = data;

  // Store the current series data inside the Layout Manager
  layoutManager.viewportData[viewportIndex] = {
    imageId,
    studyInstanceUid,
    seriesInstanceUid,
    displaySetInstanceUid,
    currentImageIdIndex,
    viewport: viewport || data.viewport,
    viewportIndex,
  };

  // TODO: Move tool selection in toolManager to the MultiPlanarReconstructionTools.
  // TODO: What to do with the slider? disabled in updateSeriesInViewport.js for now.
  // TODO: StackManager keeps reference to the entire collection of image objects. (commented out for now)

  // we don't want any cache..
  // FIXME: Breaks the thumbnails.
  cornerstone.imageCache.setMaximumSizeBytes(0);

  let vm = new VolumeManager();

  var image;
  const volumeManager = new VolumeManager();
  let volume = volumeManager.getOrCreateVolume(displaySetInstanceUid, imageIds);

  STATRAD.viewer.tagsVisible = false;
  Session.set('imageViewerTagsVisible', STATRAD.viewer.tagsVisible);

  image = volume.createProjectionImage(element.offsetWidth, element.offsetHeight);

  const frameOfReference = MultiPlanarReconstructionTools.frameOfReferenceManager.createFrameOfReference(
    image.frameOfReferenceID
  );

  image.volumeView.isInteracting = true;

  image.volumeView.color = '#FFFFFF';

  enabledElement.viewport = cornerstone.internal.getDefaultViewport(enabledElement.canvas, image);
  enabledElement.viewport.pixelReplication = true;
  cornerstone.displayImage(element, image);
  MultiPlanarReconstructionTools.mouseInput.enable(element);
  MultiPlanarReconstructionTools.mouseWheelInput.enable(element);
  MultiPlanarReconstructionTools.keyboardInput.enable(element);
  MultiPlanarReconstructionTools.touchInput.enable(element);
  // MultiPlanarReconstructionTools.wwwc.activate(element, 1);
  MultiPlanarReconstructionTools.pan.activate(element, 1, undefined, 32);
  MultiPlanarReconstructionTools.zoom.activate(element, 4);
  MultiPlanarReconstructionTools.stackWheel.activate(element);
  MultiPlanarReconstructionTools.stack.activate(element, 2);
  MultiPlanarReconstructionTools.rotate.activate(element, 1, undefined, 17);
  MultiPlanarReconstructionTools.zoomTouchDrag.activate(element);
  MultiPlanarReconstructionTools.referenceLines.enable(element);
  MultiPlanarReconstructionTools.lengthTool.enable(element);
  // MultiPlanarReconstructionTools.lengthTool.activate(element, 1, undefined, 18);
  MultiPlanarReconstructionTools.angleTool.enable(element);
  // MultiPlanarReconstructionTools.angleTool.activate(element, 1, undefined, 18);
  MultiPlanarReconstructionTools.ellipticalProbe.enable(element);
  // MultiPlanarReconstructionTools.ellipticalProbe.activate(element, 1, undefined, 18);
  MultiPlanarReconstructionTools.pixelProbe.enable(element);
  // MultiPlanarReconstructionTools.pixelProbe.activate(element, 1, undefined, 18);
  MultiPlanarReconstructionTools.localizer.enable(element);
  MultiPlanarReconstructionTools.localizer.activate(element, 1);
  MultiPlanarReconstructionTools.arrowAnnotate.enable(element);

  MultiPlanarReconstructionTools.orientationMarker.enable(element);
  MultiPlanarReconstructionTools.performanceOverlay.enable(element);

  // FIXME: remove slider consistently. This does not work properly.
  $('.imageViewerViewportOverlay').each(function(index, value) {
    $(this).find('.imageControls').hide();
    $(this).removeClass('hasSlider');
  });

  volume.addProgressCallback(function(volume) {
    image.volumeView.needsReRender = true;
    cornerstone.invalidate(element);
  });

  volume.addDoneCallback(function(volume) {
    image.volumeView.isInteracting = false;
    image.volumeView.needsReRender = true;
    cornerstone.invalidate(element);
  });

  $(element).on('CornerstoneElementResized', (event, eventData) => {
    const image = cornerstone.getEnabledElement(eventData.element).image;
    const canvas = cornerstone.getEnabledElement(eventData.element).canvas;
    image.resize(canvas.width, canvas.height);
    cornerstone.invalidate(element);
  });

  // Define a function to trigger an event whenever a new viewport is being used
  // This is used to update the value of the "active viewport", when the user interacts
  // with a new viewport element
  const sendActivationTrigger = (event, eventData) => {
    // Attention: Adding OHIF.log.info in this function decrease the performance
    // since this callback function is called multiple times (eg: when a tool is
    // enabled/disabled -> cornerstone[toolName].tool.enable)

    const element = eventData.element;
    const activeViewportIndex = Session.get('activeViewport');
    const viewportIndex = $('.imageViewerViewport').index(element);

    // Reset the focus, even if we don't need to re-enable reference lines or prefetching
    $(element).focus();

    // Check if the current active viewport in the Meteor Session
    // Is the same as the viewport in which the activation event was fired.
    // If it was, no changes are necessary, so stop here.
    if (viewportIndex === activeViewportIndex) {
      return;
    }

    OHIF.log.info('imageViewerViewport sendActivationTrigger');

    // Otherwise, trigger an 'OHIFActivateViewport' event to be handled by the Template event
    // handler
    eventData.viewportIndex = viewportIndex;
    const customEvent = $.Event('OHIFActivateViewport', eventData);

    // Need to overwrite the type set in the original event
    customEvent.type = 'OHIFActivateViewport';
    $(event.target).trigger(customEvent, eventData);
  };

  // Attach the sendActivationTrigger function to all of the Cornerstone interaction events
  $(element).off(allCornerstoneEvents, sendActivationTrigger);
  $(element).on(allCornerstoneEvents, sendActivationTrigger);
};

/**
 * This function sets the display set for the study and calls LoadDisplaySetIntoViewport function
 *
 * @param data includes study data
 * @param displaySetInstanceUid Display set information which is loaded in Template
 * @param templateData currentData of Template
 *
 */
const setDisplaySet = (data, displaySetInstanceUid, templateData) => {
  const study = data.study;
  if (!study || !study.displaySets) {
    throw new OHIF.base.OHIFError('Study does not exist or has no display sets');
  }

  study.displaySets.every(displaySet => {
    if (displaySet.displaySetInstanceUid === displaySetInstanceUid) {
      data.displaySet = displaySet;
      return false;
    }

    return true;
  });

  // If we didn't find anything, stop here
  if (!data.displaySet) {
    throw new OHIF.base.OHIFError('Display set not found in specified study!');
  }

  // Otherwise, load pass the data object into loadSeriesIntoViewport
  loadDisplaySetIntoViewport(data, templateData);
};

Meteor.startup(() => {
  window.ViewportLoading = window.ViewportLoading || {};
  OHIF.viewerbase.toolManager.configureLoadProcess();
});

Template.imageViewerViewport.onRendered(function() {
  const templateData = Template.currentData();
  OHIF.log.info('imageViewerViewport onRendered');

  // When the imageViewerViewport template is rendered
  const element = this.find('.imageViewerViewport');
  this.element = element;

  // Display the loading indicator for this element
  $(element).siblings('.imageViewerLoadingIndicator').css('display', 'block');

  // Get the current active viewport index, if this viewport has the same index,
  // add the CSS 'active' class to highlight this viewport.
  const activeViewport = Session.get('activeViewport');

  let { currentImageIdIndex } = templateData;
  const { viewport, studyInstanceUid, seriesInstanceUid, renderedCallback, displaySetInstanceUid } = templateData;

  if (!currentImageIdIndex) {
    currentImageIdIndex = 0;
  }

  // Calls extendData function to provide flexibility between systems
  imageViewerViewportData.extendData(templateData);

  // Create a data object to pass to the series loading function (loadSeriesIntoViewport)
  const data = {
    element,
    viewport,
    currentImageIdIndex,
    displaySetInstanceUid,
    studyInstanceUid,
    seriesInstanceUid,
    renderedCallback,
    activeViewport,
  };

  // If no displaySetInstanceUid was supplied, display the drag/drop
  // instructions and then stop here since we don't know what to display in the viewport.
  if (!displaySetInstanceUid) {
    element.classList.add('empty');
    $(element).siblings('.imageViewerLoadingIndicator').css('display', 'none');
    $(element).siblings('.viewportInstructions').show();
    return;
  }

  // @TypeSafeStudies
  const study = OHIF.viewer.Studies.findBy({ studyInstanceUid });

  data.study = study;
  setDisplaySet(data, displaySetInstanceUid, templateData);
});

Template.imageViewerViewport.onDestroyed(function() {
  OHIF.log.info('imageViewerViewport onDestroyed');

  // When a viewport element is being destroyed
  var element = this.find('.imageViewerViewport');
  if (!element || $(element).hasClass('empty') || !$(element).find('canvas').length) {
    return;
  }

  // TODO: Disable mouse functions
  // cornerstoneTools.mouseInput.disable(element);
  // cornerstoneTools.touchInput.disable(element);
  // cornerstoneTools.mouseWheelInput.disable(element);

  OHIF.viewer.updateImageSynchronizer.remove(element);

  // TODO: Clear the stack prefetch data
  let stackPrefetchData = cornerstoneTools.getToolState(element, 'stackPrefetch');
  stackPrefetchData = [];
  cornerstoneTools.stackPrefetch.disable(element);

  // Try to stop any currently playing clips
  // Otherwise the interval will continuously throw errors
  try {
    const enabledElement = cornerstone.getEnabledElement(element);
    if (enabledElement) {
      cornerstoneTools.stopClip(element);
    }
  } catch (error) {
    OHIF.log.warn(error);
  }

  // Trigger custom Destroy Viewport event
  // for compatibility with other systems
  $(element).trigger('OHIFDestroyedViewport');

  // clear all callback.
  let enabledElement = cornerstone.getEnabledElement(element);
  enabledElement.image.volume.clearAllCallbacks();

  MultiPlanarReconstructionTools.referenceLines.disable(element);
  MultiPlanarReconstructionTools.lengthTool.disable(element);
  MultiPlanarReconstructionTools.angleTool.disable(element);
  MultiPlanarReconstructionTools.localizer.disable(element);
  // Disable the viewport element with Cornerstone
  // This also triggers the removal of the element from all available
  // synchronizers, such as the one used for reference lines.
  cornerstone.disable(element);
});

Template.imageViewerViewport.events({
  'OHIFActivateViewport .imageViewerViewport'(event) {
    OHIF.log.info('imageViewerViewport OHIFActivateViewport');
    setActiveViewport(event.currentTarget);
  },

  'CornerstoneToolsMouseDoubleClick .imageViewerViewport, CornerstoneToolsDoubleTap .imageViewerViewport'(event) {
    // Get the double clicked viewport index
    const viewportIndex = $('.imageViewerViewport').index(event.currentTarget);

    // Enlarge the double clicked viewport
    const layoutManager = OHIF.viewerbase.layoutManager;
    layoutManager.toggleEnlargement(viewportIndex);

    const currentOverlay = $('.imageViewerViewportOverlay').eq(viewportIndex);
    const imageControls = currentOverlay.find('.imageControls');
    imageControls.hide();
    currentOverlay.removeClass('hasSlider');

    // Wait for DOM re-rendering and update the active viewport
    Tracker.afterFlush(() => {
      let viewportIndexToZoom;
      // Check if the viewer is zoomed
      if (layoutManager.isZoomed) {
        // Set the active viewport as the only one visible
        viewportIndexToZoom = 0;
      } else {
        // Set the active viewport as the previous zoomed viewport
        viewportIndexToZoom = layoutManager.zoomedViewportIndex || 0;
      }
      // Set zoomed viewport as active...
      const element = $('.imageViewerViewport').get(viewportIndexToZoom);
      setActiveViewport(element);
    });
  },
});

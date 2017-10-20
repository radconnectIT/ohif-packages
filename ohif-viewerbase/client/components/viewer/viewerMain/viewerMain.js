import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';
// Local Modules
import { unloadHandlers } from '../../../lib/unloadHandlers';
// import { hotkeyUtils } from '../../../lib/hotkeyUtils';
import { ResizeViewportManager } from '../../../lib/classes/ResizeViewportManager';
import { LayoutManager } from '../../../lib/classes/LayoutManager';

// Viewport Action Hooks
import { displayReferenceLines } from '../../../lib/displayReferenceLines';
import { enablePrefetchOnElement } from '../../../lib/enablePrefetchOnElement';
import { disablePrefetchOnElements } from '../../../lib/disablePrefetchOnElements';

Meteor.startup(() => {
    window.ResizeViewportManager = window.ResizeViewportManager || new ResizeViewportManager();

    // Set standard viewport activation/deactivation hooks
    //LayoutManager.addViewportActivationHook(enablePrefetchOnElement);
    //LayoutManager.addViewportActivationHook(displayReferenceLines);
    //LayoutManager.addViewportDeactivationHook(disablePrefetchOnElements);
    //LayoutManager.addViewportDeactivationHook(function disableReferenceLines() {
        //displayReferenceLines(null);
    //});

    //if (OHIF.viewer.stackImagePositionOffsetSynchronizer) {
        //LayoutManager.addViewportActivationHook(function () {
            //OHIF.viewer.stackImagePositionOffsetSynchronizer.update();
        //});
    //}

    // Set initial value for OHIFViewerMainRendered 
    // session variable. This can used in viewer main template
    Session.set('OHIFViewerMainRendered', false);

    OHIF.viewer.loadIndicatorDelay = 200;
    OHIF.viewer.defaultTool = 'wwwc';
    OHIF.viewer.refLinesEnabled = true;
    OHIF.viewer.isPlaying = {};
    OHIF.viewer.cine = {
        framesPerSecond: 24,
        loop: true
    };
    // OHIF.viewer.toolManager = new OHIF.viewerbase.ToolManager();
    OHIF.viewer.loadedSeriesData = {};
});

Template.viewerMain.onCreated(() => {
    // Attach the Window resize listener
    // Don't use jQuery here. "window.onresize" will always be null
    // If its necessary, check all the code for window.onresize getter
    // and change it to jQuery._data(window, 'events')['resize']. 
    // Otherwise this function will be probably overrided.
    // See cineDialog instance.setResizeHandler function
    window.addEventListener('resize', window.ResizeViewportManager.getResizeHandler());

    // Add beforeUnload event handler to check for unsaved changes
    window.addEventListener('beforeunload', unloadHandlers.beforeUnload);
});

Template.viewerMain.onRendered(() => {
    const instance = Template.instance();
    const parentElement = instance.$('#layoutManagerTarget').get(0);

    // Moving global object instances to OHIF.viewer namespace
    OHIF.viewer.layoutManager = new LayoutManager(parentElement, OHIF.viewer.Studies);
    OHIF.viewerbase.layoutManager = OHIF.viewer.layoutManager;

    // Enable hotkeys
    // this should be enabled by each viewer, not here
    // hotkeyUtils.enableHotkeys();

    Session.set('OHIFViewerMainRendered', Random.id());
});

Template.viewerMain.onDestroyed(() => {
    OHIF.log.info('viewerMain onDestroyed');

    // Remove the Window resize listener
    window.removeEventListener('resize', window.ResizeViewportManager.getResizeHandler());

    // Remove beforeUnload event handler...
    window.removeEventListener('beforeunload', unloadHandlers.beforeUnload);

    // Destroy the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer.destroy();

    delete OHIF.viewer.layoutManager;
    delete OHIF.viewerbase.layoutManager;
    delete ProtocolEngine;

    Session.set('OHIFViewerMainRendered', false);
});

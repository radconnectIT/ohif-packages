import { Viewerbase } from '../namespace';

/**
 * Imports file with side effects only (files that do not export anything...)
 */

import './definitions';
import './collections';
import './lib/debugReactivity';

/**
 * Exported Functions
 */

// getElementIfNotEmpty
import { getElementIfNotEmpty } from './lib/getElementIfNotEmpty';
Viewerbase.getElementIfNotEmpty = getElementIfNotEmpty;

// getStackDataIfNotEmpty
import { getStackDataIfNotEmpty } from './lib/getStackDataIfNotEmpty';
Viewerbase.getStackDataIfNotEmpty = getStackDataIfNotEmpty;

// getFrameOfReferenceUID
import { getFrameOfReferenceUID } from './lib/getFrameOfReferenceUID';
Viewerbase.getFrameOfReferenceUID = getFrameOfReferenceUID;

// updateCrosshairsSynchronizer
import { updateCrosshairsSynchronizer } from './lib/updateCrosshairsSynchronizer';
Viewerbase.updateCrosshairsSynchronizer = updateCrosshairsSynchronizer;

// getImageId
import { getImageId } from './lib/getImageId';
Viewerbase.getImageId = getImageId;

// setActiveViewport
import { setActiveViewport } from './lib/setActiveViewport';
Viewerbase.setActiveViewport = setActiveViewport;

// setFocusToActiveViewport
import { setFocusToActiveViewport } from './lib/setFocusToActiveViewport';
Viewerbase.setFocusToActiveViewport = setFocusToActiveViewport;

// getWADORSImageId
import { getWADORSImageId } from './lib/getWADORSImageId';
Viewerbase.getWADORSImageId = getWADORSImageId;

// updateAllViewports
import { updateAllViewports } from './lib/updateAllViewports';
Viewerbase.updateAllViewports = updateAllViewports;

// sortStudy
import { sortStudy } from './lib/sortStudy';
Viewerbase.sortStudy = sortStudy;

// updateOrientationMarkers
import { updateOrientationMarkers } from './lib/updateOrientationMarkers';
Viewerbase.updateOrientationMarkers = updateOrientationMarkers;

// isImage
import { isImage } from './lib/isImage';
Viewerbase.isImage = isImage;

// getInstanceClassDefaultViewport, setInstanceClassDefaultViewportFunction
import { getInstanceClassDefaultViewport, setInstanceClassDefaultViewportFunction } from './lib/instanceClassSpecificViewport';
Viewerbase.getInstanceClassDefaultViewport = getInstanceClassDefaultViewport;
Viewerbase.setInstanceClassDefaultViewportFunction = setInstanceClassDefaultViewportFunction;

// displayReferenceLines
import { displayReferenceLines } from './lib/displayReferenceLines';
Viewerbase.displayReferenceLines = displayReferenceLines;

// imageLoaderPromises
import { imageLoaderPromises } from './lib/imageLoaderPromises';
Viewerbase.imageLoaderPromises = imageLoaderPromises;

// getViewportMetadata
import { getViewportMetadata } from './lib/getViewportMetadata';
Viewerbase.getViewportMetadata = getViewportMetadata;


/**
 * Exported Namespaces (sub-namespaces)
 */

// imageViewerViewportData.*
import { imageViewerViewportData } from './lib/imageViewerViewportData';
Viewerbase.imageViewerViewportData = imageViewerViewportData;

// panelNavigation.*
import { panelNavigation } from './lib/panelNavigation';
Viewerbase.panelNavigation = panelNavigation;

// WLPresets.*
import { WLPresets } from './lib/WLPresets';
Viewerbase.wlPresets = WLPresets;

// hotkeyUtils.*
import { hotkeyUtils } from './lib/hotkeyUtils';
Viewerbase.hotkeyUtils = hotkeyUtils;

// viewportOverlayUtils.*
import { viewportOverlayUtils } from './lib/viewportOverlayUtils';
Viewerbase.viewportOverlayUtils = viewportOverlayUtils;

// viewportUtils.*
import { viewportUtils } from './lib/viewportUtils';
Viewerbase.viewportUtils = viewportUtils;

// thumbnailDragHandlers.*
import { thumbnailDragHandlers } from './lib/thumbnailDragHandlers';
Viewerbase.thumbnailDragHandlers = thumbnailDragHandlers;

// dialogUtils.*
import { dialogUtils } from './lib/dialogUtils';
Viewerbase.dialogUtils = dialogUtils;

// unloadHandlers.*
import { unloadHandlers } from './lib/unloadHandlers';
Viewerbase.unloadHandlers = unloadHandlers;

// sortingManager.*
import { sortingManager } from './lib/sortingManager';
Viewerbase.sortingManager = sortingManager;

// crosshairsSynchronizers.*
import { crosshairsSynchronizers } from './lib/crosshairsSynchronizers';
Viewerbase.crosshairsSynchronizers = crosshairsSynchronizers;

// annotateTextUtils.*
import { annotateTextUtils } from './lib/annotateTextUtils';
Viewerbase.annotateTextUtils = annotateTextUtils;

// textMarkerUtils.*
import { textMarkerUtils } from './lib/textMarkerUtils';
Viewerbase.textMarkerUtils = textMarkerUtils;

// createStacks.*
import { createStacks } from './lib/createStacks';
Viewerbase.createStacks = createStacks;


/**
 * Exported Singletons
 */

// StackManager as "stackManager" (since it's a plain object instance, the exported name starts with a lowercase letter)
import { StackManager } from './lib/StackManager';
Viewerbase.stackManager = StackManager;

// ToolManager
import { ToolManager } from './lib/classes/ToolManager';
Viewerbase.ToolManager = ToolManager;


/**
 * Exported Helpers
 */

import { helpers } from './lib/helpers/';
Viewerbase.helpers = helpers;

/**
 * Exported Collections
 */

// sopClassDictionary
import { sopClassDictionary } from './lib/sopClassDictionary';
Viewerbase.sopClassDictionary = sopClassDictionary;

/**
 * Exported Classes
 */

// LayoutManager
import { LayoutManager } from './lib/classes/LayoutManager';
Viewerbase.LayoutManager = LayoutManager;

// ResizeViewportManager
import { ResizeViewportManager } from './lib/classes/ResizeViewportManager';
Viewerbase.ResizeViewportManager = ResizeViewportManager;

// TypeSafeCollection
import { TypeSafeCollection } from './lib/classes/TypeSafeCollection';
Viewerbase.TypeSafeCollection = TypeSafeCollection;

// StackImagePositionOffsetSynchronizer
import { StackImagePositionOffsetSynchronizer } from './lib/classes/StackImagePositionOffsetSynchronizer';
Viewerbase.StackImagePositionOffsetSynchronizer = StackImagePositionOffsetSynchronizer;

// PromiseManager
import { PromiseManager } from './lib/classes/PromiseManager';
Viewerbase.PromiseManager = PromiseManager;

// StateManager
import { StateManager } from './lib/classes/StateManager';
Viewerbase.StateManager = StateManager;

// Viewerbase Tools
import tools from './lib/classes/tools';
Viewerbase.tools = tools;

import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { getFrameOfReferenceUID } from '../getFrameOfReferenceUID';
import { updateCrosshairsSynchronizer } from '../updateCrosshairsSynchronizer';
import { crosshairsSynchronizers } from '../crosshairsSynchronizers';
import { annotateTextUtils } from '../annotateTextUtils';
import { textMarkerUtils } from '../textMarkerUtils';
import { StackManager } from '../StackManager';

/**
 * Imported Symbols
 */

const { isString, isFunction } = OHIF.base.utils.tests;

/**
 * Exported "toolManager" Singleton
 */

export class ToolManager {
    constructor(defaultTool, defaultStates) {
        const gestures = {
            zoomTouchPinch: {
                enabled: true
            },
            panMultiTouch: {
                enabled: true
            },
            stackScrollMultiTouch: {
                enabled: true
            },
            doubleTapZoom: {
                enabled: true
            }
        };

        const toolDefaultStates = {
            activate: [],
            deactivate: ['length', 'angle', 'annotate', 'ellipticalRoi', 'rectangleRoi', 'spine'],
            enable: [],
            disable: [],
            disabledToolButtons: [],
            shadowConfig: {
                shadow: false,
                shadowColor: '#000000',
                shadowOffsetX: 0,
                shadowOffsetY: 0
            },
            textBoxConfig: {
                centering: {
                    x: true,
                    y: true
                }
            }
        };

        // Initialize Private Properties
         Object.defineProperties(this, {
            '_defaultTool': {
                configurable: false,
                enumerable: false,
                writable: true,
                value: defaultTool || 'wwwc'
            },
            '_activeTool': {
                configurable: false,
                enumerable: false,
                writable: true,
                value: null
            },
            '_tools': {
                configurable: false,
                enumerable: false,
                writable: false,
                value: Object.create(null)
            },
            '_gestures': {
                configurable: false,
                enumerable: false,
                writable: true,
                value: gestures
            },
            '_toolDefaultStates': {
                configurable: false,
                enumerable: false,
                writable: false,
                value: defaultStates || toolDefaultStates
            },
            '_initialized': {
                configurable: false,
                enumerable: false,
                writable: true,
                value: false
            },
            '_toolActivationHooks': {
                configurable: false,
                enumerable: false,
                writable: false,
                value: new Set()
            },
            '_executingActivationHooks': {
                configurable: false,
                enumerable: false,
                writable: true,
                value: false
            }
        });
    }

    /**
     * Static Methods
     */

    /**
     * Whenever the CornerstoneImageLoadProgress is fired, identify which viewports the 
     * "in-progress" image is to be displayed in. Then pass the percent complete via the
     * Meteor Session to the other templates to be displayed in the relevant viewports.
     */
    static configureLoadProcess() {
        $(cornerstone).on('CornerstoneImageLoadProgress', (e, eventData) => {
            const viewportIndices = Object.keys(window.ViewportLoading).filter(key => object[key] === eventData.imageId)
            viewportIndices.forEach(viewportIndex => {
                Session.set('CornerstoneLoadProgress' + viewportIndex, eventData.percentComplete);
            });

            const encodedId = OHIF.string.encodeId(eventData.imageId);
            Session.set('CornerstoneThumbnailLoadProgress' + encodedId, eventData.percentComplete);
        });
    }

    /**
     * Static Methods
     */


    /**
     * Private functions
     */


    /**
     * Deactivate all the middle mouse, right click, and scroll wheel tools from CornerstoneTools
     * @param {DOM} element DOM element to disable tools
     */
    _deactivateCornerstoneMouseTools(element) {
        cornerstoneTools.pan.deactivate(element);
        cornerstoneTools.zoom.deactivate(element);
        cornerstoneTools.zoomWheel.deactivate(element);
        cornerstoneTools.stackScrollWheel.deactivate(element);
        cornerstoneTools.panMultiTouch.disable(element);
        cornerstoneTools.zoomTouchPinch.disable(element);
        cornerstoneTools.stackScrollMultiTouch.disable(element);
        cornerstoneTools.doubleTapZoom.disable(element);
    }

    /**
     * Reactivate the relevant scrollwheel tool for the given element based on current
     * imageIds.
     * @param {DOM}   element  Element to reactivate relevant scroolwheel
     * @param {Array} imageIds Array of imageIds in the given element
     */
    _reactivateScrollWheel(element, imageIds) {
        let multiTouchPanConfig;
        if (imageIds.length > 1) {
            // scroll is the default tool for middle mouse wheel for stacks
            cornerstoneTools.stackScrollWheel.activate(element);

            if (this._gestures['stackScrollMultiTouch'].enabled === true) {
                cornerstoneTools.stackScrollMultiTouch.activate(element); // Three finger scroll
            }

            multiTouchPanConfig = {
                testPointers(eventData) {
                    return (eventData.numPointers === 2);
                }
            };
        } else {
            // zoom is the default tool for middle mouse wheel for single images (non stacks)
            cornerstoneTools.zoomWheel.activate(element);

            multiTouchPanConfig = {
                testPointers(eventData) {
                    return (eventData.numPointers >= 2);
                }
            };
        }

        cornerstoneTools.panMultiTouch.setConfiguration(multiTouchPanConfig);
    }

    /**
     * Activate gestures, if available, for the given element
     * @param {DOM} element Viewport DOM element
     */
    _activateGestures(element) {
        const gestures = this._gestures;

        if (gestures['zoomTouchPinch'].enabled === true) {
            cornerstoneTools.zoomTouchPinch.activate(element); // Two finger pinch
        }

        if (gestures['panMultiTouch'].enabled === true) {
            cornerstoneTools.panMultiTouch.activate(element); // Two or >= Two finger pan
        }

        if (gestures['doubleTapZoom'].enabled === true) {
            cornerstoneTools.doubleTapZoom.activate(element);
        }
    }

    /**
     * Set a state of the given tool for the given viewport DOM element.
     * @param {String} toolName Name of the tool to set the state
     * @param {String} state    State to be set. It can be 'disable', 'enable', 'deactivate', 'activate'
     * @param {DOM}    element  Viewport DOM element
     */
    _setToolState(toolName, state, element) {
        const tool = this._tools[toolName];

        if (!tool) {
            OHIF.log.info(`ToolManager::_setToolState given tool ${toolName} does not exist`);
            return;
        }
        if (tool.mouse && state in tool.mouse) {
            tool.mouse[state](element);
        }
        if (tool.touch && state in tool.touch) {
            tool.touch[state](element);
        }
    }

    /**
     * Set a state for all current tools for the given viewport DOM element.
     * @param {String} state   State to be set. It can be 'disable', 'enable', 'deactivate', 'activate'
     * @param {DOM}    element Viewport DOM element
     */
    _setToolsState(state, element) {
        if (!this._initialized) {
            this.init();
        }
        
        Object.keys(this._tools).forEach(toolName => {
            this._setToolState(toolName, state, element);
        });
    }

    /**
     * Execute registered activation hooks passing on the given parameters
     * @param {*} args The list of arguments to be passed to each registered hook
     */
    _triggerActivationHooks(...args) {
        try {
            this._executingActivationHooks = true;
            this._toolActivationHooks.forEach(hook => {
                if (isFunction(hook)) {
                    hook.apply(this, args);
                }
            });
        } finally {
            this._executingActivationHooks = false;
        }
    }

    /**
     * Public Methods
     */

    /**
     * Register an activation hook to the internal list of hooks
     * @param {function} hook The activation hook (function) which will be executed when a new tool is activated
     */
    addActivationHook(hook) {
        if (isFunction(hook)) {
            this._toolActivationHooks.add(hook);
        }
    }

    /**
     * Remove an activation hook from the internal list of hooks
     * @param {function} hook The activation hook (function) which will be removed from the internal list of hooks
     */
    removeActivationHook(hook) {
        this._toolActivationHooks.delete(hook);
    }

    setGestures(newGestures) {
        this._gestures = newGestures;
    }

    getGestures() {
        return this._gestures;
    }

    addTool(name, base) {
        this._tools[name] = base;
    }

    getTools() {
        return this._tools;
    }

    getToolDefaultStates() {
        return this._toolDefaultStates;
    }

    getActiveTool() {
        // If toolManager is not initialized, we should set as defaultTool
        if (!this._initialized) {
            this._activeTool = this._defaultTool;
        }

        return this._activeTool;
    }

    setDefaultTool(tool) {
        this._defaultTool = tool;
    }

    getDefaultTool() {
        return this._defaultTool;
    }

    enableTool(tool, element) {
        this._setToolState(tool, 'enable', element);
    }

    enableTools(element) {
        this._setToolsState('enable', element);
    }

    disableTool(tool, element) {
        this._setToolState(tool, 'disable', element);
    }

    disableTools(element) {
        this._setToolsState('disable', element);
    }

    deactivateTool(tool, element) {
        this._setToolState(tool, 'deactivate', element);
    }

    deactivateTools(element) {
        this._setToolsState('deactivate', element);
    }

    /**
     * Get imageIds from the given viewport element
     * @param  {DOM}             element Viewport DOM element to the imageIds
     * @return {Array|undefined}         Array of imageIds or undefined (if empty or there is no stack data)
     */
    getImageIdsFromElement(element) {
        // Get the stack toolData
        const toolData = cornerstoneTools.getToolState(element, 'stack');
        if (!toolData || !toolData.data || !toolData.data.length) {
            OHIF.log.info('ToolManager::getImageIdsFromElement There is no stack for the given element');
            return;
        }
        // Get the imageIds for this element
        const imageIds = StackManager.getImageIds(toolData.data[0].displaySetInstanceUid);

        return imageIds && imageIds.length > 0 && imageIds || void 0;
    }

    /**
     * Enable tools based on their default states
     * @param {DOM}    element        Viewport DOM element
     * @param {String} activeToolName Active tool name
     */
    setToolDefaultState(element, activeToolName) {
        const toolDefaultStates = this._toolDefaultStates;

        Object.keys(toolDefaultStates).forEach( action => {
            const relevantTools = toolDefaultStates[action];
            if (!relevantTools || !relevantTools.length || action === 'disabledToolButtons') {
                return;
            }
            relevantTools.forEach( toolType => {
                const tool = this._tools[toolType];
                // the currently active tool has already been deactivated or
                // it is not available so it and can be skipped
                if (action === 'deactivate' && toolType === activeToolName || !tool) {
                    return;
                }

                // Check if tool has mouse configuration
                if (tool.mouse) {
                    tool.mouse[action](
                        element,
                        (action === 'activate' || action === 'deactivate' ? 1 : void 0)
                    );
                }

                // Check if tool has touch configuration
                if (tool.touch) {
                    tool.touch[action](element);
                }
            });
        });
    }

    /**
     * Enable middle mouse and scroll tools for the given tool in the given viewport DOM element
     * @param {string} tool     Name of the tool to enable mouse and scroll tools
     * @param {DOM}    element  Viewport DOM element
     */
    enableMiddleMouseAndScrollTools(tool, element) {
        if (tool === 'pan') {
            cornerstoneTools.pan.activate(element, 3); // 3 means left mouse button and middle mouse button
        } else if (tool === 'crosshairs') {
            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
            const currentFrameOfReferenceUID = getFrameOfReferenceUID(element);
            if (currentFrameOfReferenceUID) {
                updateCrosshairsSynchronizer(currentFrameOfReferenceUID);
                const synchronizer = crosshairsSynchronizers.synchronizers[currentFrameOfReferenceUID];

                // Activate the chosen tool
                this._tools[tool].mouse.activate(element, 1, synchronizer);
            }
        } else if (tool === 'zoom') {
            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
            cornerstoneTools.zoom.activate(element, 5); // 5 means left mouse button and right mouse button
        } else {
            // Reactivate the middle mouse and right click tools
            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button

            // Activate the chosen tool
            this._tools[tool].mouse.activate(element, 1);
        }
    }

    setActiveToolForElement(tool, element) {
        const canvases = $(element).find('canvas');
        if (element.classList.contains('empty') || !canvases.length) {
            OHIF.log.info('ToolManager::setActiveToolForElement no canvas found in the given element');
            return;
        }

        const activeToolName = this.getActiveTool();
        const activeTool = this._tools[activeToolName];

        // First, deactivate the current active tool
        activeTool.mouse.deactivate(element);
 
        if (activeTool.touch) {
            activeTool.touch.deactivate(element);
        }

        // Enable tools setting them to their default state
        this.setToolDefaultState(element, activeToolName);

        const imageIds = this.getImageIdsFromElement(element);
        if (!imageIds) {
            return;
        }

        // Deactivate all the middle mouse, right click, and scroll wheel tools
        this._deactivateCornerstoneMouseTools(element);

        // Reactivate the middle mouse and right click tools
        this._tools.zoom.activate(element, 4); // zoom is the default tool for right mouse button

        // Reactivate the relevant scrollwheel tool for this element
        this._reactivateScrollWheel(element, imageIds);

        // Enable middle mouse and scroll tools
        this.enableMiddleMouseAndScrollTools(tool, element);

        // If touch is available for the current tool, actiavate it
        if (this._tools[tool].touch) {
            this._tools[tool].touch.activate(element);
        }

        // Activate gestures, if available
        this._activateGestures(element);
    }

    setActiveTool(givenTool, givenElements) {
        if (this._executingActivationHooks) {
            OHIF.log.warn('An activation hook attempted to recursively call setActiveTool', new Error('ToolManager::setActiveTool'));
            return;
        }

        if (!this._initialized) {
            this.init();
        }

        const activeTool = this.getActiveTool();
        let tool = isString(givenTool) ? givenTool : this.getDefaultTool();

        // @TODO: Add textMarkerDialogs template
        const dialog = document.getElementById('textMarkerOptionsDialog');
        if (dialog) {
            if (tool === 'spine') {
                // if the active tool is already spine, toggle it...
                if (activeTool === 'spine' && dialog.getAttribute('open') === 'open') {
                    dialog.close();
                    tool = this.getDefaultTool(); // considering the default tool is not spine... :-)
                } else if (dialog.getAttribute('open') !== 'open') {
                    dialog.show();
                }
            } else if (dialog.getAttribute('open') === 'open') {
                dialog.close();
            }
        }

        // Set the div to active for the tool
        $('.imageViewerButton').removeClass('active');
        const toolButton = document.getElementById(tool);
        if (toolButton) {
            toolButton.classList.add('active');
        }

        let elements = givenElements;
        if (!elements || !elements.length) {
            elements = $('.imageViewerViewport');
        }

        // Otherwise, set the active tool for all viewport elements
        $(elements).each((index, element) => {
            this.setActiveToolForElement(tool, element);
        });

        this._activeTool = tool;

        this._triggerActivationHooks(givenTool, givenElements);

        // Store the active tool in the session in order to enable reactivity
        Session.set('ToolManagerActiveTool', tool);
    }

    activateCommandButton(button) {
        const activeCommandButtons = Session.get('ToolManagerActiveCommandButtons') || [];

        if (activeCommandButtons.indexOf(button) === -1) {
            activeCommandButtons.push(button);
            Session.set('ToolManagerActiveCommandButtons', activeCommandButtons);
        }
    }

    deactivateCommandButton(button) {
        const activeCommandButtons = Session.get('ToolManagerActiveCommandButtons') || [];
        const index = activeCommandButtons.indexOf(button);

        if (index !== -1) {
            activeCommandButtons.splice(index, 1);
            Session.set('ToolManagerActiveCommandButtons', activeCommandButtons);
        }
    }

    init() {
        this.addTool('wwwc', {
            mouse: cornerstoneTools.wwwc,
            touch: cornerstoneTools.wwwcTouchDrag
        });
        this.addTool('zoom', {
            mouse: cornerstoneTools.zoom,
            touch: cornerstoneTools.zoomTouchDrag
        });
        this.addTool('wwwcRegion', {
            mouse: cornerstoneTools.wwwcRegion,
            touch: cornerstoneTools.wwwcRegionTouch
        });
        this.addTool('dragProbe', {
            mouse: cornerstoneTools.dragProbe,
            touch: cornerstoneTools.dragProbeTouch
        });
        this.addTool('pan', {
            mouse: cornerstoneTools.pan,
            touch: cornerstoneTools.panTouchDrag
        });
        this.addTool('stackScroll', {
            mouse: cornerstoneTools.stackScroll,
            touch: cornerstoneTools.stackScrollTouchDrag
        });
        this.addTool('length', {
            mouse: cornerstoneTools.length,
            touch: cornerstoneTools.lengthTouch
        });
        this.addTool('angle', {
            mouse: cornerstoneTools.simpleAngle,
            touch: cornerstoneTools.simpleAngleTouch
        });
        this.addTool('magnify', {
            mouse: cornerstoneTools.magnify,
            touch: cornerstoneTools.magnifyTouchDrag
        });
        this.addTool('ellipticalRoi', {
            mouse: cornerstoneTools.ellipticalRoi,
            touch: cornerstoneTools.ellipticalRoiTouch
        });
        this.addTool('rectangleRoi', {
            mouse: cornerstoneTools.rectangleRoi,
            touch: cornerstoneTools.rectangleRoiTouch
        });
        this.addTool('annotate', {
            mouse: cornerstoneTools.arrowAnnotate,
            touch: cornerstoneTools.arrowAnnotateTouch
        });

        this.addTool('rotate', {
            mouse: cornerstoneTools.rotate,
            touch: cornerstoneTools.rotateTouchDrag
        });

        this.addTool('spine', {
            mouse: cornerstoneTools.textMarker,
            touch: cornerstoneTools.textMarkerTouch
        });

        this.addTool('crosshairs', {
            mouse: cornerstoneTools.crosshairs,
            touch: cornerstoneTools.crosshairsTouch
        });

        // if a default tool is globally defined, make it the default tool
        if (OHIF.viewer.defaultTool) {
            this.setDefaultTool(OHIF.viewer.defaultTool);
            this._activeTool = this._defaultTool;
        }

        this.configureTools();
        this._initialized = true;
    }

    /**
     * Configure multiple tools from cornerstoneTools
     */
    configureTools() {
        // Get Cornerstone Tools
        const { panMultiTouch, textStyle, toolStyle, toolColors,
                length, arrowAnnotate, zoom, ellipticalRoi,
                textMarker, magnify } = cornerstoneTools;

        // Set the configuration for the multitouch pan tool
        const multiTouchPanConfig = {
            testPointers: eventData => {
                return (eventData.numPointers >= 3);
            }
        };
        panMultiTouch.setConfiguration(multiTouchPanConfig);

        // Set text box background color
        textStyle.setBackgroundColor('transparent');

        // Set the tool font and font size
        // context.font = "[style] [variant] [weight] [size]/[line height] [font family]";
        const fontFamily = 'Roboto, OpenSans, HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif';
        textStyle.setFont('15px ' + fontFamily);

        // Set the tool width
        toolStyle.setToolWidth(2);

        // Set color for inactive tools
        toolColors.setToolColor('rgb(255, 255, 0)');

        // Set color for active tools
        toolColors.setActiveColor('rgb(0, 255, 0)');

        // Set shadow configuration
        const shadowConfig = this.getToolDefaultStates().shadowConfig;

        // Get some tools config to not override them
        const lengthConfig = length.getConfiguration();
        const ellipticalRoiConfig = ellipticalRoi.getConfiguration();

        // Add shadow to length tool
        length.setConfiguration({
            ...lengthConfig,
            ...shadowConfig,
            drawHandlesOnHover: true
        });

        // Add shadow to length tool
        ellipticalRoi.setConfiguration({
            ...ellipticalRoiConfig,
            ...shadowConfig
        });

        // Set the configuration values for the Text Marker (Spine Labelling) tool
        const startFrom = $('#startFrom');
        const ascending = $('#ascending');
        const textMarkerConfig = {
            markers: [ 'L5', 'L4', 'L3', 'L2', 'L1', // Lumbar spine
                         'T12', 'T11', 'T10', 'T9', 'T8', 'T7', // Thoracic spine
                         'T6', 'T5', 'T4', 'T3', 'T2', 'T1',
                         'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1', // Cervical spine
            ],
            current: startFrom.val(),
            ascending: ascending.is(':checked'),
            loop: true,
            changeTextCallback: textMarkerUtils.changeTextCallback,
            shadow: shadowConfig.shadow,
            shadowColor: shadowConfig.shadowColor,
            shadowOffsetX: shadowConfig.shadowOffsetX,
            shadowOffsetY: shadowConfig.shadowOffsetY
        };
        textMarker.setConfiguration(textMarkerConfig);

        // Set the configuration values for the text annotation (Arrow) tool
        const annotateConfig = {
            getTextCallback: annotateTextUtils.getTextCallback,
            changeTextCallback: annotateTextUtils.changeTextCallback,
            drawHandles: false,
            arrowFirst: true
        };
        arrowAnnotate.setConfiguration(annotateConfig);

        const zoomConfig = {
            minScale: 0.05,
            maxScale: 10
        };
        zoom.setConfiguration(zoomConfig);

        const magnifyConfig = {
            magnifySize: 300,
            magnificationLevel: 3
        };
        magnify.setConfiguration(magnifyConfig);
    }
}
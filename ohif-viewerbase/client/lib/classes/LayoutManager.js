import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { Random } from 'meteor/random';
import { _ } from 'meteor/underscore';
import { $, jQuery } from 'meteor/jquery';

import { OHIF } from 'meteor/ohif:core';

/**
 * Import Related Constants
 */

const { EventSource } = OHIF.base.events;
const { isString, isFunction, isArray, isObject, isUndefined } = OHIF.base.utils.tests;

/**
 * Definitions
 */

const VIEWPORT_ELEMENT_SELECTOR = '.imageViewerViewport';
const DEFAULT_TEMPLATE_NAME = 'gridLayout';

// Displays Series in Viewports given a Protocol and list of Studies
export class LayoutManager extends EventSource {
    /**
     * Constructor: initializes a Layout Manager object.
     * @param {DOM element}    parentNode DOM element representing the parent node, which wraps the Layout Manager content
     * @param {TypeSafeCollection} studies  TypeSafeCollection of studies that will be rendered in the Viewer. Each object will be rendered in a div.imageViewerViewport
     */
    constructor(parentNode, studies) {

        // Necessary since it extends OHIF.base.events.EventSource class
        super();

        OHIF.log.info('LayoutManager constructor');

        this.parentNode = parentNode;
        this.studies = studies;
        this.viewportData = [];
        this.layoutTemplateName = DEFAULT_TEMPLATE_NAME;
        this.layoutProps = {
            rows: 1,
            columns: 1
        };
        this.layoutClassName = this.getLayoutClass();

        // Active Viewport Management
        this.currentWindowIndex = 0;
        this.activeViewportIndex = -1;
        this.activeViewportElement = null;
        this.activeViewportSeriesInstanceUid = null;
        this.activationHooksExecutedSuccessfully = false;
        this.remoteActiveViewportIndex = -1;
        this.remoteActiveViewportWindowIndex = -1;

        // Flags to prevent nested execution of methods that trigger event handlers or hooks
        this.flags = {
            setActiveViewportOnCallStack: false,
            previousActiveViewportsDeactivated: false,
            deactivateViewportsOnCallStack: false
        };

        this.isZoomed = false;
        this.lastRerenderedViewport = -1;

        this.updateSession = _.throttle(() => {
            Tracker.afterFlush(() => {
                Session.set('LayoutManagerUpdated', Random.id());
                // Dispatch viewportsUpdated event
                this.dispatch('viewportsUpdated', Object.assign({}, this.layoutProps));
            });
        }, 300);

    }

    /**
     * Static Methods
     */

    static getGlobalViewportActionHooks(action) {
        // Lazy initialization of globalViewportActionHooks
        let hooksMap = LayoutManager.globalViewportActionHooks;
        if (!isObject(hooksMap)) {
            hooksMap = Object.create(null);
            LayoutManager.globalViewportActionHooks = hooksMap;
        }
        let hooks = hooksMap[action];
        if (!isArray(hooks)) {
            hooks = [];
            hooksMap[action] = hooks;
        }
        return hooks;
    }

    static addViewportDeactivationHook(hook) {
        if (isFunction(hook)) {
            const hooks = LayoutManager.getGlobalViewportActionHooks('deactivation');
            // Make sure the given hook is not already present in the list
            if (hooks.indexOf(hook) === -1) {
                hooks.push(hook);
            }
        }
    }

    static addViewportActivationHook(hook) {
        if (isFunction(hook)) {
            const hooks = LayoutManager.getGlobalViewportActionHooks('activation');
            // Make sure the given hook is not already present in the list
            if (hooks.indexOf(hook) === -1) {
                hooks.push(hook);
            }
        }
    }

    static runViewportActionHooks(action, element, index) {
        const hooks = LayoutManager.getGlobalViewportActionHooks(action);
        for (let i = 0, limit = hooks.length; i < limit; ++i) {
            // We trust that each item in the list is fact a function since it has been checked in the setter...
            hooks[i].call(null, element, index);
        }
    }

    /**
     * Instance Methods
     */
    
    /**
     * Get the default template name
     * @return {String} Name of default template
     */
    getDefaultTemplateName() {
        return DEFAULT_TEMPLATE_NAME;
    }

    /**
     * Check if the current tamplate name is the default
     * @return {Boolean} True if the current template is the default or false otherwise
     */
    isDefaultTemplateName() {
        return this.layoutTemplate === DEFAULT_TEMPLATE_NAME;
    }

    getActiveViewportElement() {
        let activeViewport;
        const activeViewportIndex = this.activeViewportIndex;
        if (activeViewportIndex >= 0) {
            const viewportElements = jQuery(VIEWPORT_ELEMENT_SELECTOR);
            if (activeViewportIndex < viewportElements.length) {
                activeViewport = viewportElements.get(activeViewportIndex);
            }
        }
        return activeViewport;
    }

    forEachViewport(callback) {
        if (!isFunction(callback)) {
            throw TypeError('LayoutManager::forEachViewport A callback function is expected');
        }
        const viewportElements = jQuery(VIEWPORT_ELEMENT_SELECTOR);
        const viewportData = this.viewportData;
        if (viewportData.length !== viewportElements.length) {
            throw new Error('LayoutManager::forEachViewport Unexpected count of viewport elements');
        }
        for (let i = 0, limit = viewportData.length; i < limit; ++i) {
            if (callback.call(this, viewportData[i], viewportElements.get(i), i) === false) {
                break;
            }
        }
    }

    setActiveViewport(element) {

        // This is important to prevent event handlers and hooks from possibly
        // calling the setActiveViewport method during their execution which would
        // possibly cause a stack overflow.
        if (this.flags.setActiveViewportOnCallStack || this.flags.previousActiveViewportsDeactivated || this.flags.deactivateViewportsOnCallStack) {
            OHIF.log.warn('LayoutManager::setActiveViewport Viewport activation already on stack.');
            return;
        }

        const domElement = (element instanceof jQuery && element.get(0)) || element;
        if (!(domElement instanceof Element)) {
            OHIF.log.warn('LayoutManager::setActiveViewport Not a valid DOM Element');
            return;
        }

        const viewerports = $(VIEWPORT_ELEMENT_SELECTOR);
        const viewportIndex = viewerports.index(domElement);

        if (viewportIndex < 0) {
            OHIF.log.warn('LayoutManager::setActiveViewport Viewport element not found');
            return;
        }

        // Check if the current viewport is already activated
        if (this.activeViewportIndex === viewportIndex
            && this.activeViewportElement === domElement
            && this.activationHooksExecutedSuccessfully === true) {
            // ... if it's already active, nothing to do.
            return;
        }

        try {

            // Set busy flags to prevent nested execution
            this.flags.setActiveViewportOnCallStack = true;

            // Deactivating currently active viewport and prevent this function
            // from being put on stack again by setting additional the busyFlags
            this.deactivateViewports();

            // Set busy flag to prevent possible calls to deactivateViewports method
            // during viewport activation sequence.
            this.flags.previousActiveViewportsDeactivated = true;

            // Create jQuery wrap
            const jQueryElement = $(domElement);

            // If viewport is not active trigger an event for compatibility
            jQueryElement.trigger('OHIFBeforeActivateViewport');

            // Set new active viewport
            this.activeViewportIndex = viewportIndex;
            this.activeViewportElement = domElement;
            this.activeViewportSeriesInstanceUid = this.viewportData[this.activeViewportIndex].seriesInstanceUid;
            // Reset remote active viewport data
            this.remoteActiveViewportIndex = -1;
            this.remoteActiveViewportWindowIndex = -1;
            Session.set('activeViewport', viewportIndex);

            // Add the 'active' class to the parent container to highlight the active viewport
            jQueryElement.parents('.viewportContainer').addClass('active');

            // Run activation hooks
            try {
                LayoutManager.runViewportActionHooks('activation', domElement, viewportIndex);
                this.activationHooksExecutedSuccessfully = true;
            } catch (error) {
                this.activationHooksExecutedSuccessfully = false;
                OHIF.log.info(`LayoutManager::setActiveViewport Error when running viewport activation hooks for viewport #${viewportIndex}`, error);
            }

            const randomId = Random.id();

            // Update the Session variable to inform that a viewport is active
            Session.set('viewportActivated', randomId);

            // Update the Session variable to the UI re-renders
            Session.set('LayoutManagerUpdated', randomId);

            // Set the div to focused, so keypress events are handled
            //$(element).focus();
            //.focus() event breaks in FF&IE
            jQueryElement.triggerHandler('focus');

            // Trigger OHIFAfterActivateViewport event on activated instance
            // for compatibility with other systems
            jQueryElement.trigger('OHIFAfterActivateViewport');

            // Dispatch viewportActivated event
            this.dispatch('viewportActivated', {
                windowIndex: this.currentWindowIndex,
                viewportElement: this.activeViewportElement,
                viewportIndex: this.activeViewportIndex
            });

        } finally {

            // Clear busy flags otherwise this function won't be able to execute again.
            // IMPORTANT! For safety, this must be executed inside a "finally" block
            // otherwise this function might not be able to execute again. The finally
            // block will garantee this portion of code will always be executed.
            this.flags.setActiveViewportOnCallStack = false;
            this.flags.previousActiveViewportsDeactivated = false;

        }

    }

    setActiveViewportByIndex(viewportIndex, windowIndex) {
        if (viewportIndex >= 0) {
            if (windowIndex >= 0 && windowIndex != this.currentWindowIndex) {
                // Save index of remote active viewport
                this.remoteActiveViewportIndex = parseInt(viewportIndex);
                this.remoteActiveViewportWindowIndex = parseInt(windowIndex);
                // Deactivate local active viewport (if any)
                this.deactivateViewports();
                return;
            }
            const viewerports = $(VIEWPORT_ELEMENT_SELECTOR);
            if (viewportIndex < viewerports.length) {
                const element = viewerports.get(parseInt(viewportIndex));
                this.setActiveViewport(element);
            }
        }
    }

    hasActiveViewport() {
        return (
            this.activeViewportIndex >= 0 ||
            (this.remoteActiveViewportIndex >= 0 && this.remoteActiveViewportWindowIndex >= 0)
        );
    }

    getLastRerenderedViewportIndex() {
        return this.lastRerenderedViewport;
    }

    deactivateViewports() {

        // This is important to prevent event handlers and hooks from possibly
        // calling the deactivateViewports method during their execution which would
        // possibly cause a stack overflow.
        if (this.flags.deactivateViewportsOnCallStack || this.flags.previousActiveViewportsDeactivated) {
            OHIF.log.warn('LayoutManager::deactivateViewports Viewport deactivation already on stack.');
            return;
        }

        // Store references
        const viewportIndex = this.activeViewportIndex;
        const viewportElement = this.activeViewportElement;

        // Nothing to do if there's no active viewport
        if (viewportIndex < 0 || !(viewportElement instanceof Element)) {
            return;
        }

        try {

            // Set busy flag to prevent nested execution
            this.flags.deactivateViewportsOnCallStack = true;

            this.activeViewportIndex = -1;
            this.activeViewportElement = null;

            try {
                LayoutManager.runViewportActionHooks('deactivation', viewportElement, viewportIndex);
            } catch (error) {
                OHIF.log.info(`LayoutManager::deactivateViewports Error when running viewport deactivation hooks for viewport #${viewportIndex}`, error);
            }

            // Update session variable
            Session.set('activeViewport', void 0);

            // UI... Remove Active Classes
            $(viewportElement).parents('#imageViewerViewports .viewportContainer').removeClass('active');

        } finally {

            // Clear busy flags
            // IMPORTANT! For safety, this must be executed inside a "finally" block
            // otherwise this function might not be able to execute again. The finally
            // block will garantee this portion of code will always be executed.
            this.flags.deactivateViewportsOnCallStack = false;

        }

    }

    setWindowIndex(index) {
        if (index >= 0) {
            this.currentWindowIndex = parseInt(index);
        }
    }

    setCurrentImageIdIndex(viewportIdx, currentImageIdIndex, currentIndexRange) {
        this.viewportData[viewportIdx].currentImageIdIndex = currentImageIdIndex;
        this.viewportData[viewportIdx].currentIndexRange = currentIndexRange;
        Session.set('imageIndexUpdate', { viewport: viewportIdx, imageIndex: currentImageIdIndex });
    }
    
    getWindowIndex(index) {
        return this.currentWindowIndex;
    }

    getActiveViewportIndex() {
        return this.activeViewportIndex;
    }

    getDisplaySetFromViewport(index) {
        const uid = this.viewportData[index].displaySetInstanceUid;
        let displaySet = undefined;
        const allStudies = this.studies.all();
        for (let i = 0; i < this.studies.count() && !displaySet; i++) {
            const displaySets = allStudies[i].displaySets;
            for (let j = 0; j < displaySets.length && !displaySet; j++) {
              if (displaySets[j].uid === uid) {
                displaySet = displaySets[j];
              }
            }
        }
        return displaySet;
    }

    getAllViewableDisplaySets() {
        let displaySets = [];
        for (var i = 0; i < this.viewportData.length; i++) {
            displaySets.push(this.getDisplaySetFromViewport(i));
        }
        return displaySets;
    }

    getImageIndexFromViewport(index) {
        return this.viewportData[index].currentImageIdIndex;
    }

    getImageRangeFromViewport(index) {
        return this.viewportData[index].currentIndexRange;
    }

    getViewportsFromDisplaySet(uid) {
        let indexes = [];
        let i;
        for(i = 0; i < this.viewportData.length; i++)
            if (this.viewportData[i].displaySetInstanceUid === uid)
                indexes.push(i);
        return indexes;
    }

    getRangeOrIndexFromViewport(index) {
        const range = this.getImageRangeFromViewport(index);
        if (range && range.length) {
            return range;
        } else {
            return this.getImageIndexFromViewport(index);
        }
    }

    getActiveDisplaySetIndex() {
        if (this.activeViewportIndex === -1) {
            // no active viewport (mostly in multi-monitor setup)
            return;
        }

        return this.viewportData[this.activeViewportIndex].displaySetInstanceUid;
    }
  
    isViewportActive(viewportIndex, windowIndex) {
        return this.activeViewportIndex === viewportIndex && (this.currentWindowIndex === windowIndex || isUndefined(windowIndex));
    }

    isImageVisible(element, imageId) {
        const viewportIndex = $('.imageViewerViewport').index(element);
        if (viewportIndex === -1){
            return false;
        }

        const displaySet = this.getDisplaySetFromViewport(viewportIndex);
        const imageIds = OHIF.viewerbase.stackManager.getImageIds(displaySet.uid);
        const imageIndex = imageIds.findIndex( e => e === imageId);
        const indexFromViewport = this.getRangeOrIndexFromViewport(viewportIndex);
        if (Array.isArray(indexFromViewport)){
            return imageIndex >= indexFromViewport[0] &&  imageIndex <= indexFromViewport[1] ? indexFromViewport.length : false;
        }
        return indexFromViewport === imageIndex;
    }

    /**
     * Returns the number of viewports rendered, based on layoutProps
     * @return {integer} number of viewports
     */
    getNumberOfViewports() {
        if (this.layoutProps.viewportDimensions) {
            return this.layoutProps.viewportDimensions.length;
        }

        return this.layoutProps.rows * this.layoutProps.columns;
    }

    /**
     * It creates a new viewport data. This is useful for the first rendering when no viewportData is set yet.
     */
    setDefaultViewportData() {
        OHIF.log.info('LayoutManager setDefaultViewportData');

        const self = this;

        // Get the number of viewports to be rendered
        const viewportsAmount = this.getNumberOfViewports();

        // Store the old viewport data and reset the current
        const oldViewportData = self.viewportData;

        // Get the studies and display sets sequence map
        const sequenceMap = this.getDisplaySetSequenceMap();

        // Check if the display sets are sequenced
        const isSequenced = this.isDisplaySetsSequenced(sequenceMap);

        // Define the current viewport index and the viewport data array
        let currentViewportIndex = 0;
        if (viewportsAmount > oldViewportData.length && oldViewportData.length && isSequenced) {
            // Keep the displayed display sets
            self.viewportData = oldViewportData;
            currentViewportIndex = oldViewportData.length;
        } else if (viewportsAmount <= oldViewportData.length) {
            // Reduce the original displayed display sets
            self.viewportData = oldViewportData.slice(0, viewportsAmount);
            return;
        } else {
            // Reset all display sets
            self.viewportData = [];
        }

        // Get all the display sets for the viewer studies
        let displaySets = [];
        this.studies.forEach(study => {
            study.displaySets.forEach(dSet => dSet.images.length && displaySets.push(dSet));
        });

        // Get the display sets that will be appended to the current ones
        let appendix;
        const currentLength = self.viewportData.length;
        if (currentLength) {
            // TODO: isolate displaySets array by study (maybe a map?)
            const beginIndex = sequenceMap.values().next().value[0].displaySetIndex + currentLength;
            const endIndex = beginIndex + (viewportsAmount - currentLength);
            appendix = displaySets.slice(beginIndex, endIndex);
        } else {
            // Get available display sets from the first to the grid size
            appendix = displaySets.slice(0, viewportsAmount);
        }

        // Generate the additional data based on the appendix
        const additionalData = [];
        appendix.forEach((displaySet, index) => {
            const { images, studyInstanceUid, seriesInstanceUid, displaySetInstanceUid } = displaySet;
            const sopInstanceUid = images[0] && images[0].getSOPInstanceUID ? images[0].getSOPInstanceUID() : '';
            const viewportIndex = currentViewportIndex + index;
            const data = {
                viewportIndex,
                studyInstanceUid,
                seriesInstanceUid,
                displaySetInstanceUid,
                sopInstanceUid
            };

            additionalData.push(data);
        });

        // Append the additional data with the viewport data
        self.viewportData = self.viewportData.concat(additionalData);

        // Push empty objects if the amount is lesser than the grid size
        while (self.viewportData.length < viewportsAmount) {
            self.viewportData.push({});
        }
    }

    /**
     * Returns the name of the class to be added to the parentNode
     * @return {string} class name following the pattern layout-<rows>-<columns>. Ex: layout-1-1, layout-2-2
     */
    getLayoutClass() {
        const { rows, columns } = this.layoutProps;
        const layoutClass = `layout-${rows}-${columns}`;

        return layoutClass;
    }

    /**
     * Add a class to the parentNode based on the layout configuration.
     * This function is helpful to style the layout of viewports.
     * Besides that, each inner div.viewportContainer will have helpful classes
     * as well. See viewer/components/gridLayout/ component in this ohif-viewerbase package.
     */
    updateLayoutClass() {
        const newLayoutClass = this.getLayoutClass();

        // If layout has changed, change its class
        if (this.layoutClassName !== newLayoutClass) {
            this.parentNode.classList.remove(this.layoutClassName);
        }

        this.layoutClassName = newLayoutClass;

        this.parentNode.classList.add(newLayoutClass);
    }

    /**
     * Updates the grid with the new layout props.
     * It iterates over all viewportData to render the studies
     * in the viewports.
     * If no viewportData or no viewports defined, it renders the default viewport data.
     */
    updateViewports(viewportsState) {
        OHIF.log.info('LayoutManager updateViewports');

        if (!this.viewportData ||
            !this.viewportData.length ||
            this.viewportData.length !== this.getNumberOfViewports()) {
            this.setDefaultViewportData();
        }

        // imageViewerViewports occasionally needs relevant layout data in order to set
        // the element style of the viewport in question
        const layoutProps = this.layoutProps;
        const data = $.extend({
            viewportData: [],
            elementData: []
        }, layoutProps);

        this.viewportData.forEach((viewportData, viewportIndex) => {
            const viewportDataAndLayoutProps = $.extend(viewportData, layoutProps);
            data.viewportData.push(viewportDataAndLayoutProps);

            if (viewportsState && viewportsState.length) {
                const viewportState = viewportsState[viewportIndex] || {};
                data.elementData.push(viewportState.data);
            }
        });

        const layoutTemplate = Template[this.layoutTemplateName];
        const $parentNode = $(this.parentNode);

        $parentNode.html('');
        this.updateLayoutClass();
        Blaze.renderWithData(layoutTemplate, data, this.parentNode);

        this.updateSession();

        this.isZoomed = false;
    }

    /**
     * This function destroys and re-renders the imageViewerViewport template.
     * It uses the data provided to load a new display set into the produced viewport.
     * @param  {integer} viewportIndex index of the viewport to be re-rendered
     * @param  {Object} data           instance data object
     */
    rerenderViewportWithNewDisplaySet(viewportIndex, data) {
        OHIF.log.info(`LayoutManager rerenderViewportWithNewDisplaySet: ${viewportIndex}`);

        // The parent container is identified because it is later removed from the DOM
        const element = $(VIEWPORT_ELEMENT_SELECTOR).eq(viewportIndex);
        const container = element.parents('.viewportContainer').get(0);

        // Record the current viewportIndex so this can be passed into the re-rendering call
        data.viewportIndex = viewportIndex;

        // Update the dictionary of loaded displaySet for the specified viewport
        this.viewportData[viewportIndex] = {
            viewportIndex: viewportIndex,
            displaySetInstanceUid: data.displaySetInstanceUid,
            seriesInstanceUid: data.seriesInstanceUid,
            studyInstanceUid: data.studyInstanceUid,
            renderedCallback: data.renderedCallback,
            currentImageIdIndex: data.currentImageIdIndex || 0
        };

        // Remove the hover styling
        element.find('canvas').not('.magnifyTool').removeClass('faded');

        // Remove the whole template, add in the new one
        const viewportContainer = element.parents('.removable');

        const newViewportContainer = document.createElement('div');
        newViewportContainer.className = 'removable';

        // Remove the parent element of the template
        // This is a workaround since otherwise Blaze UI onDestroyed doesn't fire
        viewportContainer.remove();

        container.appendChild(newViewportContainer);

        // Render and insert the template
        Blaze.renderWithData(Template.imageViewerViewport, data, newViewportContainer);

        this.lastRerenderedViewport = viewportIndex;

        this.updateSession();
    }

    /**
     * Enlarge a single viewport. Useful when the layout has more than one viewport
     * @param  {integer} viewportIndex Index of the viewport to be enlarged
     */
    enlargeViewport(viewportIndex) {
        OHIF.log.info(`LayoutManager enlargeViewport: ${viewportIndex}`);

        if (!this.viewportData ||
            !this.viewportData.length) {
            return;
        }

        // Store the previous layout template name so we can go back to it
        this.previousLayoutTemplateName = this.layoutTemplateName;
        this.previousLayoutProps = this.layoutProps;

        // Clone the array for later use
        this.previousViewportData = this.viewportData.slice(0);

        // Backup previous element data to restore them later
        this.previousViewportsState = this.getViewportsState();

        const singleViewportData = $.extend({}, this.viewportData[viewportIndex]);
        singleViewportData.rows = 1;
        singleViewportData.columns = 1;
        singleViewportData.viewportIndex = 0;

        const enlargedElementState = this.previousViewportsState[viewportIndex];

        const data = {
            viewportData: [singleViewportData],
            elementData: [enlargedElementState.data],
            rows: 1,
            columns: 1
        };

        const layoutTemplate = Template.gridLayout;
        $(this.parentNode).html('');
        Blaze.renderWithData(layoutTemplate, data, this.parentNode);

        this.isZoomed = true;
        this.zoomedViewportIndex = viewportIndex;
        this.viewportData = data.viewportData;

        this.updateSession();

        // Deferring the execution because the element is not enabled yet
        Meteor.defer(() => {
            const viewportState = this.previousViewportsState[this.zoomedViewportIndex];
            this.updateViewportsState([viewportState]);
        });
    }

    getViewportsState() {
        const $elements = $(this.parentNode).find('.imageViewerViewport');

        return _.map($elements, element => {
            let data = {};
            let viewport;
            let enabled = true;

            try {
                const enabledElement = cornerstone.getEnabledElement(element);
                data = enabledElement.data;
                viewport = cornerstone.getViewport(element);
            } catch (e) {
                OHIF.log.warn('LayoutManager getViewportsState: element is not enabled');
                enabled = false;
            }

            return {
                data,
                viewport,
                enabled
            };
        });
    }

    updateViewportsState(viewportsState) {
        const $imageViewerViewports = $(this.parentNode).find('.imageViewerViewport');

        if (!$imageViewerViewports.length || !viewportsState) {
            return;
        }

        $imageViewerViewports.each((index, imageViewerViewport) => {
            const viewportState = viewportsState[index];
            this.restoreViewportState(imageViewerViewport, viewportState);
        });

        this.dispatch('enabledElementsStateUpdated');
    }

    restoreViewportState(element, viewportState) {
        let enabledElement;

        if (viewportState.enabled === false) {
            return;
        }

        try {
            enabledElement = cornerstone.getEnabledElement(element);
        } catch (error) {
            OHIF.log.warn('LayoutManager restoreViewportState: element is not enabled');
            return;
        }

        cornerstone.setViewport(element, viewportState.viewport);
    }

    /**
     * Set a viewport as active based on the active series instance UID. Useful when there is a new layout
     * and the old active viewport should maintain active in the new configuration.
     */
    setActiveViewportBySeries() {
        let activeViewportElement;
        // Check if old active series is in the new layout
        this.forEachViewport((viewportData, viewportElement, viewportIndex) => {
            if (viewportData.seriesInstanceUid === this.activeViewportSeriesInstanceUid) {
                activeViewportElement = viewportElement;
            }
        });

        // If the series was found in the new layout configuration set its viewport as active
        if (activeViewportElement){
            this.setActiveViewport(activeViewportElement);
        } else {
            // Set the viewport as active based on activeViewportIndex. If it is greater than the number
            // of viewports set the first one as active (default)
            const activeViewportIndex = this.getNumberOfViewports() > this.activeViewportIndex ? this.activeViewportIndex : 0;
            this.setActiveViewportByIndex(activeViewportIndex, this.currentWindowIndex);
        }
    }

    /**
     * Set a new layout for the Layout Manager.
     * @param {Object}  layoutProps        Object containing the layout properties (number of rows and columns)
     * @param {Array}   viewportData       Array of viewport data objects. Each object should have enough data to render the viewport (optional)
     * @param {String}  layoutTemplateName Name of the layout template. If not given, it uses the default. (optional)
     * @param {Boolean} updateViewports    If true, update viewports with the new given layout. Default is true (optional)
     */
    setNewLayout(layoutProps, viewportData = void 0, layoutTemplateName = DEFAULT_TEMPLATE_NAME, updateViewports = true) {
        const oldNumberOfViewports = this.getNumberOfViewports();

        if (viewportData !== void 0) {
            this.viewportData = viewportData;
        }

        this.layoutProps = layoutProps;
        this.layoutTemplateName = layoutTemplateName;
        
        if (updateViewports) {
            this.updateViewports();

            const numberOfViewports = this.getNumberOfViewports();

            // Check if some viewport has been removed
            if (numberOfViewports < oldNumberOfViewports) {
                this.setActiveViewportBySeries();
            }
        }

    }

    getDefaultViewportData(startingIndex = 0, givenViewportCount = 0, displaySetOverride) {
        const viewportData = [];

        // Get the number of viewports to be rendered
        const viewportCount = givenViewportCount > 0 ?
            givenViewportCount : this.getNumberOfViewports();

        // Get all the display sets for the viewer studies
        const displaySets = [];
        this.studies.forEach(study => {
            study.displaySets.forEach(displaySet => {
                if (Array.isArray(displaySet.images) && displaySet.images.length > 0) {
                    displaySets.push(displaySet)
                }
            });
        });

        // Count how many display sets are available
        const displaySetsLength = displaySets.length;

        // Build viewport data list
        for (let index = 0; index < viewportCount; index++) {
            const data = { viewportIndex: index };
            let selectedDisplaySet;
            // Check if an override has been specified and found
            const overrideId = displaySetOverride[index];
            if (overrideId) {
                selectedDisplaySet = displaySets.find(displaySet => {
                    return displaySet.displaySetInstanceUid === overrideId;
                });
            }
            // If not, just pick up one from the available display sets available
            if (!selectedDisplaySet && startingIndex + index < displaySetsLength) {
                selectedDisplaySet = displaySets[startingIndex + index];
            }
            // If a display set was found, add information to the viewport data structure
            if (selectedDisplaySet) {
                const {
                    images,
                    studyInstanceUid,
                    seriesInstanceUid,
                    displaySetInstanceUid
                } = selectedDisplaySet;
                const sopInstanceUid = images[0] && images[0].getSOPInstanceUID
                    ? images[0].getSOPInstanceUID()
                    : '';
                data.studyInstanceUid = studyInstanceUid;
                data.seriesInstanceUid = seriesInstanceUid;
                data.displaySetInstanceUid = displaySetInstanceUid;
                data.sopInstanceUid = sopInstanceUid;
            }
            // Append data to the viewport data list
            viewportData[index] = data;
        }

        return viewportData;
    }

    getCurrentViewportData() {
        return Array.isArray(this.viewportData) ? this.viewportData.slice() : [];
    }

    /**
     * Resets to the previous layout configuration.
     * Useful after enlarging a single viewport.
     */
    resetPreviousLayout() {
        OHIF.log.info('LayoutManager resetPreviousLayout');

        if (!this.isZoomed) {
            return;
        }

        this.previousViewportData[this.zoomedViewportIndex] = $.extend({}, this.viewportData[0]);
        this.previousViewportData[this.zoomedViewportIndex].viewportIndex = this.zoomedViewportIndex;
        this.viewportData = this.previousViewportData;
        this.layoutTemplateName = this.previousLayoutTemplateName;
        this.layoutProps = this.previousLayoutProps;

        const viewportsState = this.previousViewportsState.slice(0);
        const enlargedElementState = this.getViewportsState()[0];

        // Update the element at zoomedViewportIndex by its new state
        // The user could have updated something when it was enlarged
        viewportsState[this.zoomedViewportIndex] = enlargedElementState;

        this.updateViewports(viewportsState);

        // Deferring the execution because the element is not enabled yet
        Meteor.defer(() => {
            this.updateViewportsState(viewportsState);
        });
    }

    /**
     * Toogle viewport enlargement.
     * Useful for user to enlarge or going back to previous layout configurations
     * @param  {integer} viewportIndex Index of the viewport to be toggled
     */
    toggleEnlargement(viewportIndex) {
        OHIF.log.info(`LayoutManager toggleEnlargement: ${viewportIndex}`);

        this.dispatch('toggleEnlargement', { isZoomed: this.isZoomed });

        if (this.isZoomed) {
            this.resetPreviousLayout();
        } else if (this.isMultipleLayout()) {
            this.enlargeViewport(viewportIndex);
        }
    }

    /**
     * Return the display sets map sequence of display sets and viewports
     */
    getDisplaySetSequenceMap() {
        OHIF.log.info('LayoutManager getDisplaySetSequenceMap');

        // Get the viewport data list
        const viewportDataList = this.viewportData;

        // Create a map to control the display set sequence
        const sequenceMap = new Map();

        // Iterate over each viewport and register its  details on the sequence map
        viewportDataList.forEach((viewportData, viewportIndex) => {
            // Get the current study
            const currentStudy = this.studies.findBy({
                studyInstanceUid: viewportData.studyInstanceUid
            }) || this.studies.all()[0];

            // Get the display sets
            const displaySets = currentStudy.displaySets;

            // Get the current display set
            const displaySet = _.findWhere(displaySets, {
                displaySetInstanceUid: viewportData.displaySetInstanceUid
            });

            // Get the current instance index (using 9999 to sort greater than -1)
            let displaySetIndex = _.indexOf(displaySets, displaySet);
            displaySetIndex = displaySetIndex < 0 ? 9999 : displaySetIndex;

            // Try to get a map entry for current study or create it if not present
            let studyViewports = sequenceMap.get(currentStudy);
            if (!studyViewports) {
                studyViewports = [];
                sequenceMap.set(currentStudy, studyViewports);
            }

            // Register the viewport index and the display set index on the map
            studyViewports.push({
                viewportIndex,
                displaySetIndex
            });
        });

        // Return the generated sequence map
        return sequenceMap;
    }

    /**
     * Check if all the display sets and viewports are sequenced
     * @param  {Array}  definedSequenceMap Array of display set sequence map
     * @return {Boolean}                   Returns if the display set sequence map is sequenced or not
     */
    isDisplaySetsSequenced(definedSequenceMap) {
        OHIF.log.info('LayoutManager isDisplaySetsSequenced');

        let isSequenced = true;

        // Get the studies and display sets sequence map
        const sequenceMap = definedSequenceMap || this.getDisplaySetSequenceMap();

        sequenceMap.forEach((studyViewports, study) => {
            let lastDisplaySetIndex = null;
            let lastViewportIndex = null;
            studyViewports.forEach(({ viewportIndex, displaySetIndex }, index) => {
                // Check if the sequence is wrong
                if (
                    displaySetIndex !== 9999 &&
                    lastViewportIndex !== null &&
                    lastDisplaySetIndex !== null &&
                    displaySetIndex !== null &&
                    (viewportIndex - 1 !== lastViewportIndex ||
                    displaySetIndex - 1 !== lastDisplaySetIndex)
                ) {
                    // Set the sequenced flag as false;
                    isSequenced = false;
                }

                // Update the last viewport index
                lastViewportIndex = viewportIndex;

                // Update the last display set index
                lastDisplaySetIndex = displaySetIndex;
            });
        });

        return isSequenced;
    }

    /**
     * Check if is possible to move display sets on a specific direction.
     * It checks if looping is allowed by OHIF.uiSettings.displaySetNavigationLoopOverSeries
     * @param  {Boolean} isNext Represents the direction
     * @return {Boolean}        Returns if display sets can be moved
     */
    canMoveDisplaySets(isNext) {
        OHIF.log.info('LayoutManager canMoveDisplaySets');

        // Get the setting that defines if the display set navigation is multiple
        const isMultiple = OHIF.uiSettings.displaySetNavigationMultipleViewports;

        // Get the setting that allow display set navigation looping over series
        const allowLooping = OHIF.uiSettings.displaySetNavigationLoopOverSeries;

        // Get the studies and display sets sequence map
        const sequenceMap = this.getDisplaySetSequenceMap();

        // Check if the display sets are sequenced
        const isSequenced = this.isDisplaySetsSequenced(sequenceMap);

        // Get Active Viewport Index if isMultiple is false
        const activeViewportIndex = !isMultiple ? Session.get('activeViewport') : null;

        // Check if is next and looping is blocked
        if (isNext && !allowLooping) {
            // Check if the end was reached
            let endReached = true;

            sequenceMap.forEach((studyViewports, study) => {
                // Get active viewport index if isMultiple is false ortherwise get last
                const studyViewport = studyViewports[activeViewportIndex !== null ? activeViewportIndex : studyViewports.length - 1];
                if (!studyViewport) {
                    return;
                }

                const viewportIndex = studyViewport.displaySetIndex;
                const layoutViewports = studyViewports.length;
                const amount = study.displaySets.length;
                const move = !isMultiple ? 1 : ((amount % layoutViewports) || layoutViewports);
                const lastStepIndex = amount - move;

                // 9999 for index means empty viewport, see getDisplaySetSequenceMap function
                if (viewportIndex !== 9999 && viewportIndex !== lastStepIndex) {
                    endReached = false;
                }
            });

            // Return false if end is not reached yet
            if ((!isMultiple || isSequenced) && endReached) {
                return false;
            }
        }

        // Check if is previous and looping is blocked
        if (!isNext && !allowLooping) {
            // Check if the begin was reached
            let beginReached = true;

            if (activeViewportIndex >= 0) {
                sequenceMap.forEach((studyViewports, study) => {
                    // Get active viewport index if isMultiple is false ortherwise get first
                    const studyViewport = studyViewports[activeViewportIndex !== null ? activeViewportIndex : 0];
                    if (!studyViewport) {
                        return;
                    }

                    const viewportIndex = studyViewport.displaySetIndex;
                    const layoutViewports = studyViewports.length;

                    // 9999 for index means empty viewport, see getDisplaySetSequenceMap function
                    if (viewportIndex !== 9999 && viewportIndex - layoutViewports !== -layoutViewports) {
                        beginReached = false;
                    }
                });
            }

            // Return false if begin is not reached yet
            if ((!isMultiple || isSequenced) && beginReached) {
                return false;
            }
        }

        return true;
    }

    /**
     * Move display sets forward or backward in the given viewport index
     * @param  {integer}  viewportIndex Index of the viewport to be moved
     * @param  {Boolean} isNext         Represents the direction (true = forward, false = backward)
     */
    moveSingleViewportDisplaySets(viewportIndex, isNext) {
        OHIF.log.info(`LayoutManager moveSingleViewportDisplaySets: ${viewportIndex}`);

        // Get the setting that allow display set navigation looping over series
        const allowLooping = OHIF.uiSettings.displaySetNavigationLoopOverSeries;

        // Get the selected viewport data
        const viewportData = this.viewportData[viewportIndex];

        // Get the current study
        const currentStudy = this.studies.findBy({
            studyInstanceUid: viewportData.studyInstanceUid
        }) || this.studies.all()[0];

        // Get the display sets
        const displaySets = currentStudy.displaySets;

        // Get the current display set
        const currentDisplaySet = _.findWhere(displaySets, {
            displaySetInstanceUid: viewportData.displaySetInstanceUid
        });

        // Get the new index and ensure that it will exists in display sets
        let newIndex = _.indexOf(displaySets, currentDisplaySet);
        if (isNext) {
            newIndex++;
            if (newIndex >= displaySets.length) {
                // Stop here if looping is not allowed
                if (!allowLooping) {
                    return;
                }

                newIndex = 0;
            }
        } else {
            newIndex--;
            if (newIndex < 0) {
                // Stop here if looping is not allowed
                if (!allowLooping) {
                    return;
                }

                newIndex = displaySets.length - 1;
            }
        }

        // Get the display set data for the new index
        const newDisplaySetData = displaySets[newIndex];

        // Rerender the viewport using the new display set data
        this.rerenderViewportWithNewDisplaySet(viewportIndex, newDisplaySetData);
    }

    /**
     * Move multiple display sets forward or backward in all viewports
     * @param  {Boolean} isNext Represents the direction (true = forward, false = backward)
     */
    moveMultipleViewportDisplaySets(isNext) {
        OHIF.log.info('LayoutManager moveMultipleViewportDisplaySets');

        // Get the setting that allow display set navigation looping over series
        const allowLooping = OHIF.uiSettings.displaySetNavigationLoopOverSeries;

        // Create a map to control the display set sequence
        const sequenceMap = this.getDisplaySetSequenceMap();

        // Check if the display sets are sequenced
        const isSequenced = this.isDisplaySetsSequenced(sequenceMap);

        const displaySetsToRender = [];

        // Iterate over the studies map and move its display sets
        sequenceMap.forEach((studyViewports, study) => {
            // Sort the viewports on the study by the display set index
            studyViewports.sort((a, b) => a.displaySetIndex > b.displaySetIndex);

            // Get the study display sets
            const displaySets = study.displaySets;

            // Calculate the base index
            const firstIndex = studyViewports[0].displaySetIndex;
            const steps = studyViewports.length;
            const rest = firstIndex % steps;
            let baseIndex = rest ? firstIndex - rest : firstIndex;
            const direction = isNext ? 1 : -1;
            baseIndex += steps * direction;

            const amount = displaySets.length;

            // Check if the indexes are sequenced or will overflow the array bounds
            if (baseIndex >= amount) {
                const move = (amount % steps) || steps;
                const lastStepIndex = amount - move;
                if (firstIndex + steps !== lastStepIndex + steps) {
                    // Reset the index if the display sets are sequenced but shifted
                    baseIndex = lastStepIndex;
                } else if (!allowLooping) {
                    // Stop here if looping is not allowed
                    return;
                } else {
                    // Start over the series if looping is allowed
                    baseIndex = 0;
                }
            } else if (baseIndex < 0) {
                if (firstIndex > 0) {
                    // Reset the index if the display sets are sequenced but shifted
                    baseIndex = 0;
                } else if (!allowLooping) {
                    // Stop here if looping is not allowed
                    return;
                } else {
                    // Go to the series' end if looping is allowed
                    baseIndex = (amount - 1) - ((amount - 1) % steps);
                }
            } else if (!isSequenced) {
                // Reset the sequence if indexes are not sequenced
                baseIndex = 0;
            }

            // Iterate over the current study viewports
            studyViewports.forEach(({ viewportIndex }, index) => {
                // Get the new displaySet index to be rendered in viewport
                const newIndex = baseIndex + index;

                // Get the display set data for the new index
                const displaySetData = displaySets[newIndex] || {};

                // Add the current display set that on the render list
                displaySetsToRender.push(displaySetData);
            });
        });

        // Sort the display sets
        const sortingFunction = OHIF.utils.sortBy({
            name: 'studyInstanceUid'
        }, {
            name: 'instanceNumber'
        }, {
            name: 'seriesNumber'
        });
        displaySetsToRender.sort((a, b) => sortingFunction(a, b));

        // Iterate over each display set data and render on its respective viewport
        displaySetsToRender.forEach((data, index) => {
            this.rerenderViewportWithNewDisplaySet(index, data);
        });
    }

    /**
     * Move display sets forward or backward
     * @param  {Boolean} isNext Represents the direction (true = forward, false = backward)
     */
    moveDisplaySets(isNext) {
        OHIF.log.info('LayoutManager moveDisplaySets');

        //Check if navigation is on a single or multiple viewports
        if (OHIF.uiSettings.displaySetNavigationMultipleViewports) {
            // Move display sets on multiple viewports
            this.moveMultipleViewportDisplaySets(isNext);
        } else {
            // Get the selected viewport index
            const viewportIndex = Session.get('activeViewport');

            // Move display sets on a single viewport
            this.moveSingleViewportDisplaySets(viewportIndex, isNext);
        }
    }

    /**
     * Check if a study is loaded into a viewport
     * @param  {string}  studyInstanceUid Study instance Uid string
     * @param  {integer}  viewportIndex   Index of the viewport to be checked
     * @return {Boolean}                  Returns if the given study is in the given viewport or not
     */
    isStudyLoadedIntoViewport(studyInstanceUid, viewportIndex) {
        return (this.viewportData.find(item => item.studyInstanceUid === studyInstanceUid && item.viewportIndex === viewportIndex) !== void 0);
    }

    /**
     * Check if the layout has multiple rows and columns
     * @return {Boolean} Return if the layout has multiple rows and columns or not
     */
    isMultipleLayout() {
        return this.getNumberOfViewports() > 1;
    }

}

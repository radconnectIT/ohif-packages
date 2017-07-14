import { _ } from 'meteor/underscore';

// OHIF modules
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';
import 'meteor/ohif:hanging-protocols-base';

// Some important Classes
const { SeriesMatchingRule, ImageMatchingRule, StudyMatchingRule, Protocol, Stage, Screen, Viewport } = OHIF.hangingprotocols.entity;
const { StateManager } = OHIF.viewerbase;

/**
 * Import Constants
 */
const { OHIFError, DICOMTagDescriptions } = OHIF.base;

/**
 * This variable caches stages changes logs for each protocol. 
 * Useful when the user applies changes to a Protocol A, selects Protocol B and
 * selects back Protocol A. This way, it keeps the logs for Protocol A.
 */
const protocolStageLogCache = new Map();

export class ProtocolStateManager {

    /**
     * Constructor
     * @param  {Protocol} protocol   Protocol instance object
     * @param  {Integer} screenIndex Index of the current screen
     */
    constructor(protocol, screenIndex) {
        if (!(protocol instanceof Protocol)) {
            throw new OHIFError('ProtocolStateManager::constructor invalid Protocol instance');
        }

        if (!(protocol.stages instanceof Array) || protocol.stages.length === 0) {
            throw new OHIFError('ProtocolStateManager::constructor given Protocol instance has no stages');
        }

        if (screenIndex === void 0) {
            throw new OHIFError('ProtocolStateManager::constructor invalid screenIndex');
        }

        // Initialize Private Properties
        Object.defineProperty(this, '_log', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: Object.create(null)
        });

        // Initialize Private Properties
        Object.defineProperty(this, '_protocol', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: protocol
        });

        // Initialize Private Properties
        Object.defineProperty(this, '_screenIndex', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: screenIndex
        });

        // To keep track of changes
        this.setStatesLogs();
    }

    /**
     * Instantiate a StateManager for protocol and each of its stages or get them from a cache.
     * There is no need of cache for protocol log, since they are cleared after save or cancel.
     */
    setStatesLogs() {
        const protocol = this._protocol;
        const screenIndex = this._screenIndex;

        this._log.protocol = new StateManager(protocol);
        this._log.stages = [];

        // Check if there are cached logs for stages
        const cachedLogs = protocolStageLogCache.get(protocol.id);
        const hasCachedLogs = cachedLogs instanceof Array && cachedLogs.length > 0;
        const stateManagers = [];

        // For each stage, create a StateManager
        this.getProtocolStages().forEach((stage, index) => {
            const stageId = stage.id;
            let stateManager = new StateManager(this.cloneObject(stage));
            if (hasCachedLogs && stageId) {
                const cachedLog = cachedLogs.find(cachedLog => cachedLog.stageId === stageId);
                if (cachedLog && cachedLog.stateManager.hasChanges()) {
                    const screen = cachedLog.stateManager.current.screens[screenIndex];
                    if (screen) {
                        const currentStage = this.cloneObject(stage);
                        currentStage.screens[screenIndex] = screen;
                        stateManager.add(currentStage, cachedLog.stateManager.diff);
                    }
                }
            }
            this._log.stages.push(stateManager);
            if (stageId) {
                stateManagers.push({ stageId, stateManager });
            }
        });

        protocolStageLogCache.set(protocol.id, stateManagers);
    }

    /**
     * Set the current state of a StateManager. If stageIndex is provided, it considers the Stage StateManager, if not.
     * Protocol StateManager is used instead. (See this.getStateManager function)
     * @param {Object}  newCurrentState New state object to be set as current
     * @param {Integer} stageIndex      Index of the stage. If provided, it will set "newCurrentState" as Stage current version
     */
    setCurrentVersion(newCurrentState, stageIndex = -1) {
        const stateManager = this.getStateManager(stageIndex);
        stateManager.add(newCurrentState);
    }

    /**
     * Set new matching data or settings for a viewport.
     * @param {String}  type             Type of the matching data ('study', 'image' or 'series')
     * @param {Object}  viewport         Viewport instance object
     * @param {*}       value            The data to be set for the given viewport
     * @param {Object}  pristineViewport Pristine version of the viewport
     * @param {Integer} stageIndex       Index of the stage to set viewport data
     */
    setViewportData(type, viewport, value, pristineViewport, stageIndex) {
        if (this.isAMetadataChange(type)) {
            const changeRules = this.getNewMatchingRules(type, value);
            const currentRules = pristineViewport && pristineViewport[`${type}MatchingRules`] || [];
            let viewportRules;

            // Check if this is a new change indeed comparing new rules with pristine stage matching rules
            // by checking if later exists in the first: New rules are more restrict, i.e., they have
            // more rules to force matching (it add more attributes to the matching)
            if (currentRules.length === 0 || !currentRules.every(rule => changeRules.find(changeRule => changeRule.ruleIsEqual(rule)))) {
                viewportRules = changeRules;
            } else {
                 viewportRules = currentRules;
            }

            // If its a new series, its necessary to empty all macthing 
            // rules for the given viewport otherwise it might not match properly
            if (type ===  'series') {
                Object.keys(viewport).forEach(key => {
                    if (viewport[key] instanceof Array) {
                        viewport[key].length = 0;
                    }
                });
            }

            // Keep only the new matching rule
            viewport[`${type}MatchingRules`] = viewportRules;
        } else {
            // Check if pristine viewport has no settings for this viewport and the change
            // applies Default values. In this case, clear settings as default
            if (value === 'Default' && pristineViewport.viewportSettings[type] === void 0) {
                delete viewport.viewportSettings[type];
            } else {
                viewport.viewportSettings[type] = value;
            }
        }
    }

    /**
     * Set all viewport settings of the given stage as 'Default' values
     * @param {Integer} stageIndex Index of the stage
     */
    setViewportSettingsAsDefault(stageIndex) {
        const stateManager = this.getStateManager(stageIndex);
        const viewports = stateManager.current.screens[this._screenIndex].viewports;
        let dataChange;
        viewports.forEach((viewport, viewportIndex) => {
            // If there is no setting, nothing to do
            if (_.isEmpty(viewport.viewportSettings)) {
                return;
            }

            // For each current viewport settings track it as a new change
            Object.keys(viewport.viewportSettings).forEach(key => {
                dataChange = {
                    type: key,
                    value: 'Default',
                    viewportIndex
                };
                this.trackChange(dataChange, stageIndex);
            });
        });
    }

    /**
     * Set to the current protocol a new stage object
     * @param {Stage}   newStage   Stage instance of the new stage
     * @param {Integer} stageIndex Index of the new stage object
     */
    setProtocolStage(newStage, stageIndex) {
        if (!(newStage instanceof Stage)) {
            throw new OHIFError('setProtocolStage::constructor invalid Stage instance given');
        }

        this._protocol.stages[stageIndex] = newStage;
    }

    /**
     * Get the current state version of the Protocol or a Stage (if stageIndex if provided)
     * @param  {Integer}        stageIndex Index of the stage to create the new object after changes. Default is -1
     * @param  {Boolean}        resetIds   If true, reset the IDs of the objects (Useful when adding a new object)
     * @return {Protocol|Stage}            New Protocol|Stage instance object, depending on stageIndex param
     */
    getCurrentStateVersion(stageIndex = -1, resetIds = false) {
        const stateManager = this.getStateManager(stageIndex);
        const currentState = stateManager.current;

        // Instantiate the objects depending on stageIndex
        const instanceObject = stageIndex > -1 ? new Stage() : new Protocol();
        instanceObject.fromObject(currentState, resetIds);

        return instanceObject;
    }

    /**
     * Get the stage with the given stage index layout change. In case of multiple layout
     * changes it returns the last of them (most recent).
     * @param  {Integer} stageIndex  Index of the stage to check if its layout has changed
     * @param  {Integer} screenIndex Index of the screen to check if its layout has changed
     * @return {Object|undefined}    Given stage layout change or undefined if not found
     */
    getStageLayoutChange(stageIndex, screenIndex) {
        const stateManager = this.getStateManager(stageIndex);
        const currentLayout = stateManager.current.screens[screenIndex].viewportStructure.properties;
        const pristineLayout = stateManager.pristine.screens[screenIndex].viewportStructure.properties;

        // Check if the current layout is the same as pristine layout
        if (currentLayout.rows * currentLayout.columns === pristineLayout.rows * pristineLayout.columns) {
            // No layout changes
            return;
        }

        const diff = this.getDiffs(stageIndex);
        const layoutChanges = diff.filter(diff => diff.type === 'layout' && diff.screenIndex === screenIndex);
        const lastChange = layoutChanges[layoutChanges.length - 1];

        // Return the last layout change
        return lastChange;
    }

    /**
     * Get all stages of the current protocol
     * @return {Array} Array of Stage instances
     */
    getProtocolStages() {
        const stages = this._protocol.stages;
        return stages;
    }

    /**
     * Get the StateManager for Protocol or Stage. If stageIndex if provided, Stage StateManager is returned
     * @param  {Integer}      stageIndex Index of the stage
     * @return {StateManager} StateManager object of the Protocol or a single Stage, if stageIndex if provided.
     */
    getStateManager(stageIndex = -1) {
        const stateManager = stageIndex > -1 ? this._log.stages[stageIndex] : this._log.protocol;

        if (!(stateManager instanceof StateManager)) {
            throw new OHIFError('ProtocolStateManager::getStateManager StateManager was not instantiated properly');
        }

        return stateManager;
    }

    /**
     * Get all the diff (changes) of a StateManager. Each diff object represents what was changed in the stage. 
     * If stageIndex is provided, it gets a diff from a Stage StageManager for the given stageIndex.
     * @param  {Integer} stageIndex Index of the stage to get the diffs. Default is -1
     * @return {Array}              Array of diffs
     */
    getDiffs(stageIndex = -1) {
        const stateManager = this.getStateManager(stageIndex);

        return stateManager.diff.filter(d => !_.isEmpty(d));
    }

    /**
     * Get tag info from DicomTagDescriptions for the given metadata key and type ('study', 'image' or 'series').
     * @param  {String}           type Type of the metadata ()
     * @param  {String|Number}    key  DICOM attribute or custom attribute
     * @return {Object|undefined}      TagInfo object which contains the DICOM tag and its keyword or undefined if not found
     */
    getTagInfoFromMetadataKey(type, key) {
        const dicomCustomAttributeRegexp = /^(abstractPriorValue|displaySetNumber)$/;
        // It is a special case for abstract prior values or display set numbers
        if (DICOMTagDescriptions.isValidTag(key) || dicomCustomAttributeRegexp.test(key)) {
            return {
                tag: key
            };
        }

        const capitalizedType = type.capitalize();
        const expression = `^${capitalizedType}`;
        const regExp = new RegExp(expression);

        // Check if the key follows the DICOM standard for tag name
        let tagName = '';
        if (!regExp.test(key)) {
            tagName = capitalizedType + key.capitalize();
        } else {
            tagName = key;
        }

        tagName = tagName.replace(/uid/i, 'UID');

        // Get the tag info for the DICOM tag
        return DICOMTagDescriptions.find(tagName);
    }

    /**
     * Create one or more matching rules (Series, Image or Study) based on the given metadata.
     * @param  {String} type     Type of the matching rule ('study', 'image' or 'series')
     * @param  {Object} metadata Metadata object to create the rules
     * @return {Array}           Array of Rule object instances (SeriesMatchingRule, ImageMatchingRule, StudyMatchingRule) based on given metadata
     */
    getNewMatchingRules(type, metadata) {
        const matchingRules = [];
        let rule;
        let weight;

        Object.keys(metadata).forEach(key => {
            const tagInfo = this.getTagInfoFromMetadataKey(type, key);

            // If tag exists, create a rule for it
            if (tagInfo && tagInfo.tag) {
                if (type === 'series') {
                    rule = new SeriesMatchingRule();
                    weight = 2;
                } else if (type === 'study') {
                    rule = new StudyMatchingRule();
                    weight = 3;
                } else if (type === 'image') {
                    rule = new ImageMatchingRule();
                    weight = 1;
                } else {
                    return;
                }
                rule.fromObject({
                    attribute: tagInfo.tag,
                    constraint: rule.mountConstraintByValue(metadata[key]),
                    weight
                });
                matchingRules.push(rule);
            }
        });

        return matchingRules;
    }

    /**
     * Get viewport object from the current state of the given stageIndex
     * @param  {Integer}          stageIndex    Index of the stage to get the viewport
     * @param  {Integer}          screenIndex   Index of the screen to get the viewport
     * @param  {Integer}          viewportIndex Index of the requested viewport
     * @return {Object|undefined}               Viewport object from the current stage state of the given stageIndex
     *                                          or undefined if viewport does not exist
     */
    getCurrentViewport(stageIndex, screenIndex, viewportIndex) {
        const stateManager = this.getStateManager(stageIndex);
        const currentScreen = stateManager.current.screens[screenIndex];

        if (!currentScreen) {
            throw new OHIFError(`ProtocolStateManager::getCurrentViewport Invalid screen index for stage #${stageIndex}`);
        }

        return currentScreen.viewports[viewportIndex];
    }

    /**
     * Return a deep copy of the given object without memory references
     * @param  {Object} object Object to be copied
     * @return {Object}        Deep copy of the given object
     */
    cloneObject(object) {
        // Clone stage object, removing all references
        // Ex: $.extend(true, {}, this._protocol.stages) does not work here since this._protocol.stages is 
        // not a jQuery.isPlainObject (created using "{}" or "new Object") so it does not copy recursively
        const clone = JSON.parse(JSON.stringify(object));

        return clone;
    }

    /**
     * Check if the given change type is a metadata change type
     * @param  {String}  type Type of the change
     * @return {Boolean}      True if the change is a metadata change type or false otherwise
     */
    isAMetadataChange(type) {
        return type === 'series' || type === 'study' || type === 'image';
    }

    /**
     * Create a new empty screen for a protocol with default settings. Useful when adding a new screen
     * to the protocol in a MultiMonitor environment.
     * It returns a screen plain object with default 2x2 layout. Each viewport has a ImageMatchingRules
     * to force it being an empty viewport (no match).
     * @return {Object} Screen plain object with 4 empty viewports (2x2 layout)
     */
    createEmptyProtocolScreen() {
        const screen = Screen.withGridLayout(2, 2);
        const rule = new ImageMatchingRule('displaySetNumber', { equals: { value: -1 } }, false, 1);
        screen.forEachViewport(viewport => {
            viewport.addRule(rule);
        });
        return screen.toPlainObject();
    }

    /**
     * Create a new screen for a protocol for the given display.
     * @param  {Object} display Display object that will receive the new screen object
     * @return {Object}         New screen object (see "createEmptyProtocolScreen") for more info
     */
    getNewProtocolScreen(display) {
        const newScreen = this.createEmptyProtocolScreen();
        if (display instanceof Object) {
            if (display.positionDescriptor instanceof Object) {
                newScreen.position = display.positionDescriptor.position;
            }
            if (display.displaySelectors instanceof Array) {
                newScreen.selectors = display.displaySelectors;
            }
        }
        return newScreen;
    }

    /**
     * Apply display changes to the given protocol object.
     * @param {Array} displayChanges Array of display changes to be applied to the given protocol
     * @param {Object} protocol      Protocol object to apply the given changes
     */
    applyProtocolDisplayChanges(displayChanges, protocol) {
        protocol.stages.forEach(stage => {
            const currentScreens = stage.screens;
            const newScreens = [];
            displayChanges.forEach(display => {
                if (!display.selected) {
                    return;
                }
                if (display.windowIndexes instanceof Array) {
                    display.windowIndexes.forEach(windowIndex => {
                        let oldScreen = windowIndex >= 0 && windowIndex < currentScreens.length ? currentScreens[windowIndex] : null;
                        if (oldScreen instanceof Object) {
                            if (display.positionDescriptor instanceof Object) {
                                oldScreen.position = display.positionDescriptor.position;
                            }
                            if (display.displaySelectors instanceof Array) {
                                oldScreen.selectors = display.displaySelectors;
                            }
                        } else {
                            oldScreen = this.getNewProtocolScreen(display);
                        }
                        newScreens.push(oldScreen);
                    });
                } else {
                    newScreens.push(this.getNewProtocolScreen(display));
                }
            });
            stage.screens = newScreens;
        });
    }

    /**
     * Apply a change to a protocol object. It is also possible to apply some stage property 
     * change at this function like: reorder, rename, delete, duplicate and add a new stage. 
     * But for more specific stage changes like viewport changes use "applyChangesToStageObject"
     * function instead.
     * @param {Object} protocolChange Change to be applied to the given protocol object
     * @param {Object} protocol       Protocol object to apply the given change
     */
    applyChangesToProtocolObject(protocolChange, protocol) {
        if (_.isEmpty(protocolChange)) {
            return;
        }

        const { type, value, stageIndex } = protocolChange;

        // Is a protocol unique stage change
        if (stageIndex !== void 0) {
            // Duplicate the given stage
            if (type === 'duplicate') {
                // Create a new Stage object, reseting all ids
                const stageObject = new Stage();
                stageObject.fromObject(protocol.stages[stageIndex], true);

                // Make a deep copy of the stage object
                const stageClone = this.cloneObject(stageObject);
                const newStageIndex = stageIndex + 1;

                // Add the new stage right after the base stage
                protocol.stages.splice(newStageIndex, 0, stageClone);

                // Instantiate a State Manager for the new Stage
                this.addStageStateManager(stageIndex);

                return {
                    stageIndex: newStageIndex,
                    stage: stageClone
                };
            } else if (type === 'delete') {
                // Remove the given stage
                protocol.stages.splice(stageIndex, 1);

                // Remove the Stage StateManager
                this.removeStageStateManager(stageIndex);
            } else if (type === 'newStage') {
                protocol.stages[stageIndex] = value;
            } else if (stageIndex < protocol.stages.length && type in protocol.stages[stageIndex]) {
                // Stage property change
                protocol.stages[stageIndex][type] = value;
            }
        } else if (type === 'stageOrder') {
            // Stage order changed
            
            if (!(value instanceof Array)) {
                return;
            }

            const newStagesOrder = [];
            value.forEach(oldStageIndex => {
                newStagesOrder.push(protocol.stages[oldStageIndex]);
            });

            protocol.stages = newStagesOrder;

        } else if (type === 'displayChanges') {
            this.applyProtocolDisplayChanges(value, protocol);
        } else {
            // Protocol changes (Name, description, etc)
            protocol[type] = value;
        }
    }

    /**
     * Apply a change to a stage. It may use pristine state of the stage to decide how a change should be handled in case of viewport changes.
     * @param {Object}  stageChange   Change to be applied to the given stage
     * @param {Object}  stage         Stage object to apply the given change
     * @param {Object}  pristineStage Pristine state of the given stage
     * @param {Integer} stageIndex    Index of the stage to apply the changes
     */
    applyChangesToStageObject(stageChange, stage, pristineStage, stageIndex) {
        if (_.isEmpty(stageChange)) {
            return;
        }

        const currentScreen = stage.screens && stage.screens[this._screenIndex];

        if (!currentScreen) {
            OHIF.log.info('ProtocolStateManager::applyChangesToStageObject given stage has invalid screen definitions');
            return;
        }

        const { viewports, viewportStructure } = currentScreen;
        const { type, value, viewportIndex } = stageChange;

        // Layout changes
        if (type === 'layout') {
            // Check if the number of viewports has changed
            const numberOfViewports = value.rows * value.columns;
            const oldNumberOfViewports = viewports.length;

            if (oldNumberOfViewports < numberOfViewports) {
                // Add basic viewports that simply match series by index
                for (let i = oldNumberOfViewports; i < numberOfViewports; i++) {
                    viewports.push(new Viewport());
                }
            } else if (oldNumberOfViewports > numberOfViewports) {
                // Remove old/unused viewports
                viewports.splice(value.rows * value.columns);
            }

            // The number of viewports has changed
            if (oldNumberOfViewports !== numberOfViewports) {
                // Set the new layout
                viewportStructure.properties = value;
            }

            // Set all viewports settings to the 'Default'
            viewports.forEach((viewport, viewportIndex) => {
                // If there is no setting, nothing to do
                if (_.isEmpty(viewport.viewportSettings)) {
                    return;
                }

                // Remove each current viewport settings (following same behaviour as the viewer)
                Object.keys(viewport.viewportSettings).forEach(key => {
                    delete viewport.viewportSettings[key];
                });
            });

        } else if (viewportIndex !== void 0) {
            const pristineScreen = pristineStage.screens && pristineStage.screens[this._screenIndex];
            const pristineViewport = pristineScreen.viewports[viewportIndex];
            // Viewport changes (WL, zoom, new series, etc)
            this.setViewportData(type, viewports[viewportIndex], value, pristineViewport, stageIndex);
        } else if (type in stage) {
            // Stage changes (Name, date, etc)
            stage[type] = value;
        }
    }

    /**
     * Add a change and its diff to a StateManager object. If a stageIndex is provided, it add changes to the
     * Stage StateManager of the given stageIndex
     * @param {Object|Array} dataChange    Object or an array of objects that contains the changes to be 
     *                                     applied to the current version of the object in the given StateManager
     * @param {Integer}      stageIndex    Index of the Stage, required only in case of a stage change.
     */
    trackChange(dataChange, stageIndex = -1) {
        // Get the StateManager. If stageIndex if provided its a Stage StateManager, otherwise is a Protocol StateManager
        const stateManager = this.getStateManager(stageIndex);
        const dataChanges = [];

        // Choose the apply function based on stageIndex param. If provided, its a Stage Change
        const applyFunction = stageIndex > -1 ? this.applyChangesToStageObject : this.applyChangesToProtocolObject;

        if (!(dataChange instanceof Array)) {
            dataChange = [ dataChange ];
        }

        const currentState = stateManager.current;
        if (!currentState) {
            OHIF.log.info('ProtocolStateManager::trackChange invalid current state');
            return;
        }

        const pristineState = stateManager.pristine;
        let newState = this.cloneObject(currentState);

        // Loop through all the changes
        dataChange.forEach(newData => {
            // Additional info should not be applied to a stage
            const { info, ...stateData } = newData;

            dataChanges.push(newData);

            applyFunction.call(this, stateData, newState, pristineState, stageIndex);
        });

        // Save snapshot of the new state with the diff
        stateManager.add(newState, dataChanges);
    }


    /**
     * Clear track of changes of the Protocol StateManager or, if a stageIndex is provided, the Stage StateManager of the 
     * given stageIndex (See this.getStateManager function).
     * @param {Integer} stageIndex   If provided, is the index of the stage to clear changes. If not, clears Protocol StateManager.
     * @param {Object}  currentState Object to be set as the current state after clearing StateManager.
     */
    clearTrackChange(currentState, stageIndex = -1) {
        const stateManager = this.getStateManager(stageIndex);

        stateManager.clear(currentState && this.cloneObject(currentState));
    }

    /**
     * Add a new stage StateManager at the given stageIndex position. Useful after adding a stage.
     * @param {Integer} stageIndex The index of the stage that was just added
     */
    addStageStateManager(stageIndex) {
        this._log.stages.splice(stageIndex, 0, new StateManager(this._protocol.stages[stageIndex]));
    }

    /**
     * Remove a stage StateManager at the given stageIndex position. Useful after removing a stage.
     * @param {Integer} stageIndex The index of the stage that was just removed
     */
    removeStageStateManager(stageIndex) {
        this._log.stages.splice(stageIndex, 1);
    }

    /**
     * Compare if two objects are equal. Note: when comparing instances, both objects
     * should be of a same instance.
     * @param  {Object} stageA Object to compare
     * @param  {Object} stageB Object to compare
     * @return {Boolean}       True if both objects are equal
     */
    objectsAreEqual(stageA, stageB) {
        let areEqual = true;

        Object.keys(stageA).forEach(key => {
            if (areEqual) {
                areEqual = _.isEqual(stageA[key], stageB[key]);
            }
        });

        return areEqual;
    }

    /**
     * Check if a stage with the given stage index has been changed.
     * @param  {Integer} stageIndex Index of the stage to check if it has been changed
     * @return {Boolean}            True if the given stage has changed or false otherwise
     */
    stageHasChanged(stageIndex) {
        try {
            const stateManager = this.getStateManager(stageIndex);
            const { current, pristine } = stateManager;

            return current && pristine && !this.objectsAreEqual(current, pristine);
        } catch(error) {
            return false;
        }
    }

    /**
     * Reset the current stage. Useful when user wants to revert some changes applied to the current stage.
     * E.g.: 
     *     - when a layout has changed and user wants to revert to the original
     *       layout for that stage
     *     - when new series is dragged to a viewport and user wants to revert
     *       to the original series for that viewport in that stage
     * @param {Integer}  stageIndex Index of the stage to be reset
     * @param {Function} callback   Callback function to be executed after changes are applied.
     *                              It is called with two arguments in this order "the current stage" and "error message".
     *                              In case of success, "error message" is null. In case of error "the current stage" is null.
     */
    resetStage(stageIndex, callback = () => {}) {
        OHIF.log.info(`ProtocolStateManager::resetStage stage = ${stageIndex}`);

        const stateManager = this.getStateManager(stageIndex);
        const pristineStage = stateManager.pristine;

        // Dont need to set the given stage as current stage, just reset it
        this.clearTrackChange(pristineStage, stageIndex);

        // Call callback function with original/pristine Stage object
        const stage = new Stage();
        stage.fromObject(pristineStage);

        callback.call(null, stage);
        
        return stage;
    }

    /**
     * Apply changes to a stage with the given stage index.
     * @param {Integer}  stageIndex Index of the stage to be reset
     * @param {Function} callback   Callback function to be executed after changes are applied remotely
     *                              It is called with two arguments in this order "the current stage" and "error message".
     *                              In case of success, "error message" is null. In case of error "the current stage" is null.
     */
    updateStage(stageIndex, callback = () => {}) {
        OHIF.log.info(`ProtocolStateManager::updateStage stage = ${stageIndex}`);
        
        const newStage = this.getCurrentStateVersion(stageIndex);

        if (!newStage) {
            callback.call(null, void 0, 'ProtocolStateManager::updateStage error mounting a new stage object');
            return;
        }

        this.setProtocolStage(newStage, stageIndex);

        Viewer.NucleusHangingProtocolServices.put(this._protocol.documentId, this._protocol)
        .then(() => {
            // Dont need to set the given stage as current stage, just reset it
            this.clearTrackChange(newStage, stageIndex);

            callback.call(null, newStage);
        })
        .catch(error => {
            callback.call(null, null, error);
        });
    }

    /**
     * Save a new stage based on the given stage index.
     * @param {Integer}  stageIndex Index of the stage to be reset
     * @param {Function} callback   Callback function to be executed after changes are applied remotely
     *                              It is called with two arguments in this order "the current stage" and "error message".
     *                              In case of success, "error message" is null. In case of error "the current stage" is null.
     */
    saveNewStage(stageIndex, callback = () => {}) {
        OHIF.log.info(`ProtocolStateManager::saveNewStage stage = ${stageIndex}`);
        
        const newStage = this.getCurrentStateVersion(stageIndex, true);
        if (!newStage) {
            callback.call(null, void 0, 'ProtocolStateManager::saveNewStage error mounting a new stage object');
            return;
        }

        const newStageIndex = stageIndex + 1;

        // Add the new stage right after the base stage
        const protocolStages = this.getProtocolStages();
        protocolStages.splice(newStageIndex, 0, newStage);

         Viewer.NucleusHangingProtocolServices.put(this._protocol.documentId, this._protocol)
        .then(() => {
            // Add a new StateManager for the new stage
            this.addStageStateManager(newStageIndex);

            // Reset the base stage
            this.resetStage(stageIndex);

            // Dont need to set the given stage as current stage, just reset it
            this.clearTrackChange(newStage, stageIndex);

            callback.call(null, newStage);
        })
        .catch(error => {
            callback.call(null, null, error);
        });
    }

    /**
     * Update all stages pristine state. It resets the pristine state but keeps all changes
     * not saved yet.
     * Useful scenario: 
     * - Stage has multiple changes thet are not saved yet and some other component
     * saved a new state for this Stage. So now, this Stage should have a new pristine
     * state. 
     * @param {Object} protocol Protocol object that contains stages objects to set new pristine state
     */
    updateStagesPristineState(protocol) {
        protocol.stages.forEach((stage, stageIndex) => {
            // Get diffs from the current Stage StateManager
            const stageDiffs = this.getDiffs(stageIndex);

            // Clear the current Stage StateManager and set current
            // state as the new stage state
            const stateManager = this.getStateManager(stageIndex);
            stateManager.clear(stage);

            // Apply each diff that was applied before
            this.trackChange(stageDiffs, stageIndex);
        });
    }

    /**
     * Save a new protocol based on the current state of the protocol.
     * @param {Function} callback Callback function to be executed after changes are applied remotely
     *                            It is called with two arguments in this order "the new protocol" and "error message".
     *                            In case of success, "error message" is null. In case of error "the new protocol" is null.
     */
    saveNewProtocol(callback = () => {}) {
        OHIF.log.info('ProtocolStateManager::saveNewProtocol Saving protocol as a new protocol');
        
        const protocol = this.getCurrentStateVersion(-1, true);
        if (!protocol) {
            callback.call(null, void 0, 'ProtocolStateManager::saveNewProtocol invalid protocol object');
            return;
        }

        Viewer.NucleusHangingProtocolServices.post(protocol)
        .then(({ data: newProtocol }) => {
            // Base protocol: the protocol which the new protocol was copied from
            const baseProtocol = this._protocol;
            // Copy cache changes for the base protocol to the new protocol
            protocolStageLogCache.set(protocol.id, protocolStageLogCache.get(baseProtocol.id));
            // Delete cache changes for the base protocol
            protocolStageLogCache.delete(baseProtocol.id);

            // Set the current version of the protocol
            this.setCurrentVersion(newProtocol);

            // Reset all cached protocol changes
            this.clearTrackChange(newProtocol);

            // Stages may have changes not saved yet, so make sure all stages
            //  have the correct pristine state
            this.updateStagesPristineState(newProtocol);

            callback.call(null, newProtocol);
        })
        .catch(error => {
            callback.call(null, null, error);
        });
    }

    /**
     * Update protocol based on the current state of the protocol.
     * @param {Function} callback Callback function to be executed after changes are applied remotely
     *                            It is called with two arguments in this order "the updated protocol" and "error message".
     *                            In case of success, "error message" is null. In case of error "the updated protocol" is null.
     */
    updateProtocol(callback = () => {}) {
        const protocol = this.getCurrentStateVersion();
        if (!protocol) {
            callback.call(null, void 0, 'ProtocolStateManager::updateProtocol invalid protocol object');
            return;
        }
        OHIF.log.info(`ProtocolStateManager::updateProtocol Updating protocol with id: ${protocol.id}`);

        Viewer.NucleusHangingProtocolServices.put(protocol.documentId, protocol)
        .then(() => {
            // Reset all cached protocol changes and set the new protocol state as current
            this.clearTrackChange(protocol);

            // Set protocol as the new protocol state
            this._protocol = protocol;

            // Stages may have changes not saved yet, so make sure all stages
            //  have the correct pristine state
            this.updateStagesPristineState(protocol);

            callback.call(null, protocol);
        })
        .catch(error => {
            callback.call(null, null, error);
        });
    }

    /**
     * Delete the current protocol.
     * @param {Function} callback Callback function to be executed after changes are applied remotely
     *                            It is called with two arguments in this order "the deleted protocol" and "error message".
     *                            In case of success, "error message" is null. In case of error "the deleted protocol" is null.
     */
    deleteProtocol(callback = () => {}) {
        const protocol = this._protocol;

        OHIF.log.info(`ProtocolStateManager::deleteProtocol Deleting protocol with id: ${protocol.id}`);

        Viewer.NucleusHangingProtocolServices.delete(protocol.documentId)
        .then(() => {
            // Reset all cached protocol changes
            this.clearTrackChange();

            // Delete cached changes for the removed protocol
            protocolStageLogCache.delete(protocol.id);

            callback.call(null, protocol);
        })
        .catch(error => {
            callback.call(null, null, error);
        });
    }
}
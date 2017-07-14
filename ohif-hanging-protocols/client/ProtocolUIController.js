import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

// OHIF Modules
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:hanging-protocols-base';
import 'meteor/ohif:viewerbase';

// Hanging Protocol local imports
import './customAttributes'
import './customViewportSettings';
import { ProtocolStateManager } from './ProtocolStateManager';

/**
 * Import Constants
 */

const { OHIFError, events: { EventSource } } = OHIF.base;
const { LayoutManager } = OHIF.viewerbase;

/**
 * Initialization
 */

Meteor.startup(() => {
    Session.set('HangingProtocolName', void 0);
    Session.set('HangingProtocolStage', void 0);
    Session.set('HangingProtocolStagesSaved', void 0);
    Session.set('HangingProtocolCollectionChanged', void 0);
});

/**
 * Class Declaration
 */

export class ProtocolUIController extends EventSource {
    /**
     * Constructor
     * @param  {Object} layoutManager  Layout Manager Object
     * @param  {StudyMetadata} study The study metadata instance of the current study
     * @param  {Array} priors An array of prior studies
     * @param  {ProtocolDataSource} protocols An instance of the ProtocolDataSource
     * @param  {Object} preMatched A list of pre-matched protocols to be used instead of performing the 
     *                             actual protocol matching process.
     */
    constructor(layoutManager, study, priors, protocols, preMatched) {

        // Necessary since it extends OHIF.base.events.EventSource class
        super();

        // -----------
        // Type Validations

        if (!(layoutManager instanceof LayoutManager)) {
            throw new OHIFError('ProtocolUIController::constructor layoutManager is not an instance of LayoutManager');
        }

        // --------------
        // Initialization

        this.LayoutManager = layoutManager;
        this.screenIndex = 0;
        this.preMatched = preMatched;
        this.protocolEngine = new OHIF.hangingprotocols.ProtocolEngine(study, priors, protocols);
        this.stateManager = null;

        // Proxy local custom attribute retrieval callbacks to protocol engine matcher
        if (HP.CustomAttributeRetrievalCallbacks) {
            const matcher = this.protocolEngine.getMatcher();
            for (let item in HP.CustomAttributeRetrievalCallbacks) {
                const { id, name, callback } = HP.CustomAttributeRetrievalCallbacks[item];
                matcher.addCustomAttributeRetrievalCallback(id, name, callback);
            }
        }

        // Selected Protocol Data
        this.protocol = null;
        this.stage = 0;
        this.lastUpdateRequest = null;

        // Create an array for new stage ids to be stored
        // while editing a stage
        this.newStageIds = [];

        // Reset ProtocolUIController state
        this.reset();
    }

    isDefaultProtocolActive() {
        return this.isDefaultProtocol(this.protocol);
    }

    isDefaultProtocol(protocol) {
        return protocol && protocol.locked;
    }

    getScreenIndex(screenIndex) {
        return this.screenIndex;
    }

    setScreenIndex(screenIndex) {
        this.screenIndex = screenIndex || 0;
    }

    /**
     * Get currently selected hanging protocol
     * @returns {Object} The currently selected hanging protocol object.
     */
    getCurrentProtocol() {
        return this.protocol;
    }

    /**
     * Get currently selected hanging protocol
     * @returns {Object} The currently selected hanging protocol object.
     */
    getProtocolById(protocolId) {
        let protocol;
        if (protocolId) {
            const matchedProtocol = MatchedProtocols.findOne({
                'protocol.id': protocolId
            }, { reactive: false });
            if (matchedProtocol) {
                protocol = matchedProtocol.protocol;
            }
        }
        return protocol;
    }

    /**
     * Get currently selected hanging protocol ID
     * @returns {string} The currently selected hanging protocol ID.
     */
    getCurrentProtocolId() {
        return this.protocol instanceof HP.Protocol ? this.protocol.id : null;
    }

    /**
     * Get currently selected hanging protocol stage index
     * @returns {number} The currently selected stage index
     */
    getCurrentStageIndex() {
        return this.stage;
    }

    /**
     * Update internal list of matched protocols (MatchedProtocols collection)
     * @param  {Array} matchedProtocols Array of pre-matched protocol objects
     */
    updateMatchedProtocols(matchedProtocols) {
        // Update internal list of matched protocols
        MatchedProtocols.remove({});
        matchedProtocols.forEach(protocol => {
            const matchedProtocol = {
                protocol,
                score: protocol.score,
                id: protocol.id
            };
            MatchedProtocols.insert(matchedProtocol);
        });
    }

    /**
     * Resets the ProtocolEngine to the best match.
     */
    reset() {
        if (this.preMatched && this.preMatched.protocols.length > 0) {
            const selectedProtocolId = this.preMatched.selectedProtocolId;
            const protocol = this.preMatched.protocols.find(protocol => protocol.id === selectedProtocolId);
            this.setScreenIndex(this.preMatched.windowIndex);

            // Update internal list of matched protocols
            this.updateMatchedProtocols(this.preMatched.protocols);

            // Get the best match and set it as the current protocol
            this.setHangingProtocol(protocol);
        } else {
            this.protocolEngine.getMatchedProtocols().then(matchedProtocols => {
                // Update internal list of matched protocols
                this.updateMatchedProtocols(matchedProtocols);
                this.protocolEngine.getBestProtocolMatch().then(protocol => {
                    // Get the best match and set it as the current protocol
                    this.setHangingProtocol(protocol);
                });
            });
        }
    }

    /**
     * Set pre-matched during run-time.
     * @param {Object} preMatched A list of pre-matched protocols to be used instead of performing 
     *                            the actual protocol matching process.
     */
    setPreMatchedProtocols(preMatched) {
        this.preMatched = preMatched;
    }

    /**
     * Retrieves the current Stage from the current Protocol and stage index.
     * @return {*} The Stage model for the currently displayed Stage
     */
    getCurrentStageModel() {
        return this.protocol.stages[this.stage];
    }

    /**
     * Get the stage in the given index.
     * @param  {Integer} stageIndex Index of the stage to clear changes
     * @return {Stage|undefined}    Instance of Stage object or undefined if index is invalid
     */
    getStageByIndex(stageIndex) {
        if (!this.isStageIndexValid(stageIndex)) {
            OHIF.log.info('ProtocolUIController::getStageByIndex invalid stage index');
            return;
        }

        return this.protocol.stages[stageIndex];
    }

    /**
     * Rerenders viewports that are part of the current ProtocolUIController's LayoutManager
     * using the matching rules internal to each viewport.
     *
     * If this function is provided the index of a viewport, only the specified viewport
     * is rerendered.
     *
     * @param givenViewportIndex
     */
    updateViewports(givenViewportIndex) {

        // Update lastUpdateRequest property to correctly point to the updateRequest generated
        // by the latest call to updateViewports.
        const updateRequest = { startTime: Date.now(), endTime: -1, duration: -1 };
        this.lastUpdateRequest = updateRequest;

        OHIF.log.info(`ProtocolUIController::updateViewports Initiated @ ${updateRequest.startTime}`);

        // Make sure we have an active protocol with a non-empty array of display sets
        if (!this.getNumProtocolStages()) {
            return Promise.resolve(false);
        }

        // Retrieve the current display set in the display set sequence
        const stageModel = this.getCurrentStageModel();
        const screen = stageModel.screens[this.screenIndex];

        // If the current display set does not fulfill the requirements to be displayed,
        // stop here.
        if (!screen ||
            !screen.viewportStructure ||
            !screen.viewports ||
            !screen.viewports.length) {
            return Promise.resolve(false);
        }

        // Retrieve the layoutTemplate associated with the current display set's viewport structure
        // If no such template name exists, stop here.
        const layoutTemplateName = screen.viewportStructure.getLayoutTemplateName();
        if (!layoutTemplateName) {
            return Promise.resolve(false);
        }

        // Retrieve the properties associated with the current display set's viewport structure template
        // If no such layout properties exist, stop here.
        const layoutProps = screen.viewportStructure.properties;
        if (!layoutProps) {
            return Promise.resolve(false);
        }

        // Create an empty array to store the output viewportData
        const viewportData = [];

        // Empty the matchDetails associated with the ProtocolUIController.
        // This will be used to store the pass/fail details and score
        // for each of the viewport matching procedures
        const matchDetails = [];

        // List of promises returned by ProtocolEngine::matchImages method
        const matchPromises = [];

        screen.viewports.forEach((viewport, viewportIndex) => {
            matchPromises.push(this.protocolEngine.matchImages(viewport).then(details => {
                return { viewport, viewportIndex, details };
            }));
        });

        return Promise.all(matchPromises).then(viewportMatches => {

            if (updateRequest !== this.lastUpdateRequest) {
                OHIF.log.info(`ProtocolUIController::updateViewports Skipping viewport update requested @ ${updateRequest.startTime}`);
                return false; // resolve returned promise with falsy value
            }

            viewportMatches.forEach(viewportMatch => {

                const { viewport, viewportIndex, details } = viewportMatch;

                matchDetails[viewportIndex] = details;

                // Convert any YES/NO values into true/false for Cornerstone
                const cornerstoneViewportParams = {};

                // Cache viewportSettings keys
                const viewportSettingsKeys = Object.keys(viewport.viewportSettings);

                viewportSettingsKeys.forEach(key => {
                    let value = viewport.viewportSettings[key];
                    if (value === 'YES') {
                        value = true;
                    } else if (value === 'NO') {
                        value = false;
                    }

                    cornerstoneViewportParams[key] = value;
                });

                // imageViewerViewports occasionally needs relevant layout data in order to set
                // the element style of the viewport in question
                const currentViewportData = {
                    viewportIndex,
                    viewport: cornerstoneViewportParams,
                    ...layoutProps
                };

                const customSettings = [];
                viewportSettingsKeys.forEach(id => {
                    const setting = HP.CustomViewportSettings[id];
                    if (!setting) {
                        return;
                    }

                    customSettings.push({
                        id: id,
                        value: viewport.viewportSettings[id]
                    });
                });

                currentViewportData.renderedCallback = element => {
                    //console.log('renderedCallback for ' + element.id);
                    customSettings.forEach(customSetting => {
                        OHIF.log.info(`ProtocolUIController::currentViewportData.renderedCallback Applying custom setting: ${customSetting.id}`);
                        OHIF.log.info(`ProtocolUIController::currentViewportData.renderedCallback with value: ${customSetting.value}`);

                        const setting = HP.CustomViewportSettings[customSetting.id];
                        setting.callback(element, customSetting.value);

                        this.dispatch('customSettingsApplied', customSetting);
                    });
                };

                const { matchingScores, bestMatch } = details;
                let currentPosition = 1;
                let currentMatch = bestMatch;

                if (bestMatch && bestMatch.matchingScore === 0) {
                    let currentData;
                    for (let i = viewportData.length - 1; i >= 0; i--) {
                        if (viewportData[i].studyInstanceUid === bestMatch.studyInstanceUid) {
                            currentData = viewportData[i];
                            break;
                        }
                    }
                    const displaySetNumber = (currentData && currentData.displaySetNumber || 0) + 1;

                    currentPosition = matchingScores.findIndex(score => score.sortingInfo.displaySetNumber === displaySetNumber);
                    currentMatch = matchingScores[currentPosition];
                }


                if (currentMatch && currentMatch.imageId) {
                    // Check if the image is already in the viewportData. If so, get the next match, i.e., next image
                    const scoresLength = matchingScores.length;
                    while (currentPosition > -1 && currentPosition < scoresLength && viewportData.find(data => data.imageId === currentMatch.imageId)) {
                        currentMatch = matchingScores[currentPosition++];
                    }

                    currentViewportData.studyInstanceUid = currentMatch.studyInstanceUid;
                    currentViewportData.seriesInstanceUid = currentMatch.seriesInstanceUid;
                    currentViewportData.sopInstanceUid = currentMatch.sopInstanceUid;
                    currentViewportData.currentImageIdIndex = currentMatch.currentImageIdIndex;
                    currentViewportData.displaySetInstanceUid = currentMatch.displaySetInstanceUid;
                    currentViewportData.displaySetNumber = currentMatch.sortingInfo.displaySetNumber;
                    currentViewportData.imageId = currentMatch.imageId;
                }

                viewportData.push(currentViewportData);

            });

            this.LayoutManager.setNewLayout(layoutProps, viewportData, layoutTemplateName, false);

            if (givenViewportIndex !== undefined && viewportData[givenViewportIndex]) {
                this.LayoutManager.rerenderViewportWithNewDisplaySet(givenViewportIndex, viewportData[givenViewportIndex]);
            } else {
                this.LayoutManager.updateViewports();
            }

            // Check if there is an active viewport element
            if (!this.LayoutManager.getActiveViewportElement()) {
                // No active viewport, set first as active (default)
                this.LayoutManager.setActiveViewportByIndex(0, this.screenIndex);
            }

            this.matchDetails = matchDetails;

            // Update stats in updateRequest
            updateRequest.endTime = Date.now();
            updateRequest.duration = updateRequest.endTime - updateRequest.startTime;

            // Log information
            OHIF.log.info(`ProtocolUIController::updateViewports Finished @ ${updateRequest.endTime} (${updateRequest.duration} ms)`);

            return true; // resolve returned promise with truthy value

        }, (error) => {
            OHIF.log.warn(`ProtocolUIController::updateViewports Unexpected Promise Failure`, error);
            return false;  // resolve returned promise with falsy value
        });

    }

    /**
     * Set a new matched hanging protocol by the given protocolId. It searches the protocol in
     * MatchedProtocols collection.
     * @param {String} protocolId Protocol Id to be applied
     */
    setMatchedProtocol(protocolId, newStageIndex = 0) {
        OHIF.log.info(`ProtocolUIController::setMatchedProtocol protocolId = ${protocolId}`);

        const matchedProtocol = MatchedProtocols.findOne({
            'protocol.id': protocolId
        });

        if (!matchedProtocol || !matchedProtocol.protocol) {
            throw new OHIFError(`ProtocolUIController::setMatchedProtocol no protocol found for ID: "${protocolId}"`);
        }

        this.setHangingProtocol(matchedProtocol.protocol, true, newStageIndex);
    }

    setMatchedProtocolWithHighestScore(stage = 0) {
        const cursor = MatchedProtocols.find({}, {
            limit: 1,
            sort: { score: -1 }
        });
        if (cursor.count() > 0) {
            const { protocol } = (cursor.fetch())[0];
            this.setHangingProtocol(protocol, true, stage);
            return true;
        }
        return false;
    }

    /**
     * Sets the current Hanging Protocol to the specified Protocol.
     * An optional argument can also be used to prevent the updating of the Viewports.
     *
     * @param newProtocol
     * @param updateViewports
     */
    setHangingProtocol(newProtocol, updateViewports = true, newStageIndex = 0) {
        OHIF.log.info('ProtocolUIController::setHangingProtocol newProtocol', newProtocol);
        OHIF.log.info(`ProtocolUIController::setHangingProtocol updateViewports = ${updateViewports}`);

        // Reset the array of newStageIds
        this.newStageIds = [];

        const previousProtocol = this.protocol;

        if (HP.Protocol.prototype.isPrototypeOf(newProtocol)) {
            this.protocol = newProtocol;
        } else {
            this.protocol = new HP.Protocol();
            this.protocol.fromObject(newProtocol);
        }

        const previousStage = this.stage;
        this.stage = newStageIndex;

        // before setting the new protocol
        this.dispatch('beforeActiveProtocolChange', {
            id: this.protocol.id,
            name: this.protocol.name,
            stage: this.stage,
            previousProtocol: previousProtocol ? {
                id: previousProtocol.id,
                name: previousProtocol.name,
                stage: previousStage
            } : null
        });

        // Update viewports by default
        const viewportUpdatePromise = updateViewports ? this.updateViewports() : Promise.resolve(false);

        viewportUpdatePromise.then(() => {
            MatchedProtocols.update({}, {
                $set: {
                    selected: false
                }
            }, {
                multi: true
            });
            MatchedProtocols.update({
                id: this.protocol.id
            }, {
                $set: {
                    selected: true
                }
            });
            this.stateManager = new ProtocolStateManager(this.protocol, this.screenIndex);

            // Check if current stage has uncommitted changes, if so apply them
            if (this.stateManager.stageHasChanged(this.stage)) {
               const stage = this.stateManager.getCurrentStateVersion(this.stage);
                this.protocol.stages[this.stage] = stage;
                this.updateViewports();
            } else {
                Session.set('HangingProtocolStage', this.stage);
            }

            Session.set('HangingProtocolName', this.protocol.name);
            this.dispatch('activeProtocolChanged', {
                id: this.protocol.id,
                name: this.protocol.name,
                stage: this.stage
            });
        });

    }

    /**
     * Check if the given stage index is valid.
     * @return {Boolean} True if stage index is valid or false otherwise
     */
    isStageIndexValid(stageIndex) {
        return !!this.protocol.stages[stageIndex];
    }

    /**
     * Changes the current stage to a new stage index in the display set sequence. 
     * It checks if the next stage exists.
     *
     * @param  {Number}  stageIndex The stage index to be applied
     * @return {Boolean}           True if new stage has set or false, otherwise
     */
    setCurrentProtocolStage(stageIndex) {
        // Check if the given stage index is invalid
        if (!this.isStageIndexValid(stageIndex)) {
            return false;
        }

        // Sets the new stage
        const previousStage = this.stage;
        this.stage = stageIndex;

        // before setting the new protocol
        this.dispatch('beforeActiveProtocolStageChange', {
            id: this.protocol.id,
            name: this.protocol.name,
            stage: this.stage,
            previousStage
        });

        // Log the new stage
        OHIF.log.info(`ProtocolUIController::setCurrentProtocolStage stage = ${this.stage}`);

        // Check if current stage has un commited changes, if so apply them
        if (this.stateManager.stageHasChanged(this.stage)) {
            // Get the modified version of the current stage and apply it
            const stage = this.stateManager.getCurrentStateVersion(stageIndex);
            this.protocol.stages[stageIndex] = stage;
        }

        // Set stage Session variable for reactivity
        Session.set('HangingProtocolStage', this.stage);

        // Since stage has changed, we need to update the viewports 
        // and redo matchings
        this.updateViewports().then(() => {
            this.dispatch('activeProtocolStageChanged', {
                id: this.protocol.id,
                name: this.protocol.name,
                stage: this.stage
            });
        });

        // Everything went well
        return true;
    }

    /**
     * Return the number of Stages in the current Protocol or undefined if no protocol or stages are set.
     * @return {Number|undefined}
     */
    getNumProtocolStages() {
        if (!this.protocol || !this.protocol.stages || !this.protocol.stages.length) {
            return;
        }

        return this.protocol.stages.length;
    }

    /**
     * Switches to the next protocol stage in the display set sequence.
     */
    nextProtocolStage() {
        OHIF.log.info('ProtocolUIController::nextProtocolStage');

        if (!this.setCurrentProtocolStage(this.stage + 1)) {
            // Just for logging purpose
            OHIF.log.info('ProtocolUIController::nextProtocolStage failed');
        }
    }

    /**
     * Switches to the previous protocol stage in the display set sequence.
     */
    previousProtocolStage() {
        OHIF.log.info('ProtocolUIController::previousProtocolStage');
        
        if (!this.setCurrentProtocolStage(this.stage - 1)) {
            // Just for logging purpose
            OHIF.log.info('ProtocolUIController::previousProtocolStage failed');
        }
    }

    /**
     * Apply an action with a stage with the given stage index.
     * @param {action}   String            Type of the action to apply
     * @param {Integer}  stageIndex        Index of the stage to apply the given action
     * @param {Function} callback          Callback function to be executed after action is applied
     *                                     It is called with two arguments in this order "the current protocol" and "error message".
     *                                     In case of success, "error message" is null. In case of error "the current protocol" is null.
     * @param {Boolean}  setAsCurrentStage If true set given stage as current after action. Default is false
     */
    applyStageAction(action, stageIndex, callback = () => {}, setAsCurrentStage = false) {
        let actionFunction;

        if (action === 'reset') {
            actionFunction = this.stateManager.resetStage;
        } else if (action === 'new') {
            actionFunction = this.stateManager.saveNewStage;
        } else if (action === 'update') {
            actionFunction = this.stateManager.updateStage;
        }

        if (actionFunction === void 0) {
            OHIF.log.info('ProtocolUIController::applyStageAction invalid action');
            return;
        }
        const callbackWrapper = (stage, error) => {
            if (error) {
                OHIF.log.info(error);
                callback.call(null, void 0, error);
                return;
            }

            // Stage was saved as new, so its index is right after the base stage index
            if (action === 'new') {
                stageIndex++;
            }

            this.protocol.stages[stageIndex] = stage;

            // Update internal collection with new protocol and trigger event
            this.updateProtocolObject(this.protocol);
            this.dispatch('newProtocol', { protocol: this.protocol });

            // For UI interaction purpose, set a Session variable
            Session.set('HangingProtocolStagesSaved', Random.id());

            if (setAsCurrentStage) {
                if (this.setCurrentProtocolStage(stageIndex)) {
                    callback.call(null, this.protocol);
                } else {
                    callback.call(null, void 0, error);
                }
            } else {
                callback.call(null, this.protocol);
            }

        };

        actionFunction.call(this.stateManager, stageIndex, callbackWrapper, setAsCurrentStage);
    }

    updateProtocolObject(protocol) {

        if (!(protocol instanceof Object)) {
            return false;
        }

        const protocolId = protocol.id;
        const cursor = MatchedProtocols.find({
            id: protocolId
        });

        if (cursor.count() > 0) {
            MatchedProtocols.update({
                id: protocolId
            }, {
                $set: { protocol }
            });
        } else {
            MatchedProtocols.insert({
                id: protocolId,
                score: protocol.score || 0,
                protocol
            });
        }

        // For UI interaction purpose, set a Session variable
        Session.set('HangingProtocolCollectionChanged', Random.id());

        return true;

    }

    removeProtocolById(protocolId) {

        MatchedProtocols.remove({
            id: protocolId
        });

        // Check if the deleted protocol is in the preMatched list. If so, remove it
        if (this.preMatched && this.preMatched.protocols.length > 0) {
            const preMatchedIndex = this.preMatched.protocols.findIndex(preMatchedProtocol => preMatchedProtocol.id === protocolId);
            if (preMatchedIndex > -1) {
                this.preMatched.protocols.splice(preMatchedIndex, 1);
            }
        }

        // For UI interaction purpose, set a Session variable
        Session.set('HangingProtocolCollectionChanged', Random.id());

    }

    /**
     * Apply an action with current protocol
     * @param {action}   String   Type of the action to apply ("new", "delete" or "update" available)
     * @param {Function} callback Callback function to be executed after action is applied
     *                            It is called with two arguments in this order "the current protocol" and "error message".
     *                            In case of success, "error message" is null. In case of error "the current protocol" is null.
     */
    applyProtocolAction(action, callback = () => {}) {
        let actionFunction;

        if (action === 'delete') {
            actionFunction = this.stateManager.deleteProtocol;
        } else if (action === 'new') {
            actionFunction = this.stateManager.saveNewProtocol;
        } else if (action === 'update') {
            actionFunction = this.stateManager.updateProtocol;
        }

        if (actionFunction === void 0) {
            OHIF.log.info('ProtocolUIController::applyProtocolAction invalid action');
            return;
        }
        const callbackWrapper = (protocol, error) => {
            if (error) {
                OHIF.log.info(error);
                callback.call(null, void 0, error);
                return;
            }

            if (action === 'new' || action === 'update') {
                this.updateProtocolObject(protocol);
                this.dispatch('newProtocol', { protocol });
                this.setMatchedProtocol(protocol.id);
            } else if (action === 'delete') {
                this.removeProtocolById(protocol.id);
                this.dispatch('protocolRemoved', { id: protocol.id });
                this.setMatchedProtocolWithHighestScore();
            }

            callback.call(null, this.protocol);
        };

        actionFunction.call(this.stateManager, callbackWrapper);
    }
};

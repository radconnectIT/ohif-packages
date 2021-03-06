import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

// Local imports
import { Stage } from './Stage';
import { ProtocolMatchingRule } from './rules/ProtocolMatchingRule';
import { removeFromArray } from '../lib/utils/removeFromArray';
import getDateFromValue from '../lib/utils/getDateFromValue';

/**
 * This class represents a Hanging Protocol at the highest level
 *
 * @type {Protocol}
 */
export class Protocol {
    /**
     * The Constructor for the Class to create a Protocol with the bare
     * minimum information
     *
     * @param name The desired name for the Protocol
     */
    constructor(name, description) {
        // Create a new UUID for this Protocol
        this.id = Random.id();

        // Protocol document id (which refers to the MongoDB document _id, for example)
        this.documentId = void 0;

        // Store a value which determines whether or not a Protocol is locked
        // This is probably temporary, since we will eventually have role / user
        // checks for editing. For now we just need it to prevent changes to the
        // default protocols.
        this.locked = false;

        // Boolean value to indicate if the protocol has updated priors information
        // it's set in "updateNumberOfPriorsReferenced" function
        this.hasUpdatedPriorsInformation = false;

        // Apply the desired name
        this.name = name;

        // Apply the desired description (not required)
        this.description = description;

        // Protocol user id (Default value)
        this.userId = '*';

        // Set the created and modified dates to Now
        this.createdDate = new Date();
        this.modifiedDate = new Date();

        // If we are logged in while creating this Protocol,
        // store this information as well
        if (Meteor.users && Meteor.userId) {
            this.createdBy = Meteor.userId;
            this.modifiedBy = Meteor.userId;
        }

        // Create two empty Sets specifying which roles
        // have read and write access to this Protocol
        this.availableTo = new Set();
        this.editableBy = new Set();

        // Define empty arrays for the Protocol matching rules
        // and Stages
        this.protocolMatchingRules = [];
        this.stages = [];

        // Define auxiliary values for priors
        this.numberOfPriorsReferenced = 0;
        this.numberOfPriorsReferencedCached = false;
    }

    getNumberOfPriorsReferenced(skipCache = false) {
        // Check if information is cached already
        if (!skipCache && this.numberOfPriorsReferencedCached) {
            return this.numberOfPriorsReferenced;
        }

        let numberOfPriorsReferenced = 0;

        // Search each study matching rule for prior rules
        // Each stage can have many viewports that can have
        // multiple study matching rules.
        this.stages.forEach(stage => {

            const allViewports = [];

            if (stage.screens instanceof Array) {
                stage.screens.forEach(screen => {
                    const viewports = screen.viewports;
                    if (viewports instanceof Array) {
                        viewports.forEach(viewport => {
                            allViewports.push(viewport);
                        });
                    }
                });
            }

            if (stage.viewports instanceof Array) {
                stage.viewports.forEach(viewport => {
                    allViewports.push(viewport);
                });
            }

            allViewports.forEach(viewport => {
                if (!viewport.studyMatchingRules) {
                    return;
                }

                viewport.studyMatchingRules.forEach(rule => {
                    // If the current rule is not a priors rule, it will return -1 then numberOfPriorsReferenced will continue to be 0
                    const priorsReferenced = rule.getNumberOfPriorsReferenced();
                    if (priorsReferenced > numberOfPriorsReferenced) {
                        numberOfPriorsReferenced = priorsReferenced;
                    }
                });
            });
        });

        this.numberOfPriorsReferenced = numberOfPriorsReferenced;
        this.numberOfPriorsReferencedCached = true;

        return numberOfPriorsReferenced
    }

    updateNumberOfPriorsReferenced() {
        this.getNumberOfPriorsReferenced(true);
    }

    /**
     * Method to update the modifiedDate when the Protocol
     * has been changed
     */
    protocolWasModified() {
        // If we are logged in while modifying this Protocol,
        // store this information as well
        if (Meteor.users && Meteor.userId) {
            this.modifiedBy = Meteor.userId;
        }

        // Protocol has been modified, so mark priors information
        // as "outdated"
        this.hasUpdatedPriorsInformation = false;

        // Update number of priors referenced info
        this.updateNumberOfPriorsReferenced();

        // Update the modifiedDate with the current Date/Time
        this.modifiedDate = new Date();
    }

    

    /**
     * Occasionally the Protocol class needs to be instantiated from a JavaScript Object
     * containing the Protocol data. This function fills in a Protocol with the Object
     * data.
     *
     * @param {Object}  input    A Protocol as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     * @param {Boolean} resetIds If true, create a new ID for the object
     */
    fromObject(input, resetIds = false) {
        // Check if the input already has an ID or it should be reset
        // If so, keep it. It not, create a new UUID
        this.id = (!resetIds && input.id) || Random.id();

        // Assign the document id (which refers to the MongoDB document _id, for example)
        this.documentId = input._id || input.documentId;

        // Assign the input name to the Protocol
        this.name = input.name;

        // Assign the input description to the Protocol
        this.description = input.description;

        // Retrieve locked status, use !! to make it truthy
        // so that undefined values will be set to false
        this.locked = !!input.locked;

        // User id assigned to the protocol
        this.userId = input.userId;

        // Created Date (useful for copies)
        if (input.createdDate) {
            this.createdDate = getDateFromValue(input.createdDate);
        }
        // Modified Date (useful for copies)
        if (input.modifiedDate) {
            this.modifiedDate = getDateFromValue(input.modifiedDate);
        }

        // TODO: Check how to regenerate Set from Object
        //this.availableTo = new Set(input.availableTo);
        //this.editableBy = new Set(input.editableBy);

        // If the input contains Protocol matching rules
        if (input.protocolMatchingRules) {
            input.protocolMatchingRules.forEach(ruleObject => {
                // Create new Rules from the stored data
                var rule = new ProtocolMatchingRule();
                rule.fromObject(ruleObject, resetIds);

                // Add them to the Protocol
                this.protocolMatchingRules.push(rule);
            });
        }

        // If the input contains data for various Stages in the
        // display set sequence
        if (input.stages) {
            input.stages.forEach(stageObject => {
                // Create Stages from the stored data
                var stage = new Stage();
                stage.fromObject(stageObject, resetIds);

                // Add them to the Protocol
                this.stages.push(stage);
            });
        }

        // If the input contains number of priors referenced
        if (input.numberOfPriorsReferenced !== void 0) {
            this.numberOfPriorsReferenced = input.numberOfPriorsReferenced;
        }
    }

    /**
     * Creates a clone of the current Protocol with a new name
     *
     * @param name
     * @returns {Protocol|*}
     */
    createClone(name) {
        // Create a new JavaScript independent of the current Protocol
        var currentProtocol = Object.assign({}, this);

        // Create a new Protocol to return
        var clonedProtocol = new Protocol();

        // Apply the desired properties
        currentProtocol.id = clonedProtocol.id;
        clonedProtocol.fromObject(currentProtocol);

        // If we have specified a name, assign it
        if (name) {
            clonedProtocol.name = name;
        }

        // Unlock the clone
        clonedProtocol.locked = false;

        // Return the cloned Protocol
        return clonedProtocol;
    }

    /**
     * Adds a Stage to this Protocol's display set sequence
     *
     * @param stage
     */
    addStage(stage) {
        this.stages.push(stage);

        // Update the modifiedDate and User that last
        // modified this Protocol
        this.protocolWasModified();
    }

    /**
     * Adds a Rule to this Protocol's array of matching rules
     *
     * @param rule
     */
    addProtocolMatchingRule(rule) {
        this.protocolMatchingRules.push(rule);

        // Update the modifiedDate and User that last
        // modified this Protocol
        this.protocolWasModified();
    }

    /**
     * Removes a Rule from this Protocol's array of matching rules
     *
     * @param rule
     */
    removeProtocolMatchingRule(rule) {
        var wasRemoved = removeFromArray(this.protocolMatchingRules, rule);

        // Update the modifiedDate and User that last
        // modified this Protocol
        if (wasRemoved) {
            this.protocolWasModified();
        }
    }
}

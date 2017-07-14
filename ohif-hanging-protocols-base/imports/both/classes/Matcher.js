// OHIF Modules
import { Base } from 'meteor/ohif:base';
import { validate } from 'meteor/ohif:validatejs';

/**
 * Import Constants
 */
const { OHIFError, metadata: { Metadata } } = Base;
const { isString, isFunction } = Base.utils.tests;

export class Matcher {

    constructor() {
        // Define immutable _customAttributeRetrievalCallbacks property
        Object.defineProperty(this, '_customAttributeRetrievalCallbacks', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: Object.create(null)
        });
    }

    addCustomAttributeRetrievalCallback(id, name, callback) {
        if (isString(id) && isString(name) && isFunction(callback)) {
            this._customAttributeRetrievalCallbacks[id] = {
                id,
                name,
                callback
            };
        }
    }

    /**
     * Match a Metadata instance against rules using Validate.js for validation.
     * @param {Metadata} metadata Metadata instance object.
     * @param {Array} rules Array of MatchingRules instances (StudyMatchingRule|SeriesMatchingRule|ImageMatchingRule) for the match.
     * @returns {Object} Matching Object with score and details (which rule passed or failed).
     */
    match(metadata, rules) {

        // Make sure the supplied arguments are valid.
        if (!(metadata instanceof Metadata)) {
            throw new OHIFError('Matcher::match metadata must be an instance of Metadata');
        }

        // create a local copy of current matcher attribute retrieval callbacks
        const customAttributeRetrievalCallbacks = this._customAttributeRetrievalCallbacks;

        const options = {
            format: 'grouped'
        };

        const details = {
            passed: [],
            failed: []
        };

        let requiredFailed = false;
        let score = 0;

        rules.forEach(rule => {
            const attribute = rule.attribute;
            let customAttributeExists = metadata.customAttributeExists(attribute);

            // If the metadataInstance we are testing (e.g. study, series, or instance MetadataInstance) do
            // not contain the attribute specified in the rule, check whether or not they have been
            // defined in the CustomAttributeRetrievalCallbacks Object.
            if (!customAttributeExists && attribute in customAttributeRetrievalCallbacks) {
                const customAttribute = customAttributeRetrievalCallbacks[attribute];
                metadata.setCustomAttribute(attribute, customAttribute.callback.call(this, metadata));
                customAttributeExists = true;
            }

            // Format the constraint as required by Validate.js
            const testConstraint = {
                [attribute]: rule.constraint
            };

            // Create a single attribute object to be validated, since metadataInstance is an 
            // instance of Metadata (StudyMetadata, SeriesMetadata, InstanceMetadata or StudySummary)
            const attributeValue = customAttributeExists ? metadata.getCustomAttribute(attribute) : metadata.getTagValue(attribute);
            const attributeMap = {
                [attribute]: attributeValue
            };

            // Use Validate.js to evaluate the constraints on the specified metadataInstance
            let errorMessages;
            try {
                errorMessages = validate(attributeMap, testConstraint, [options]);
            } catch (e) {
                errorMessages = [ 'Something went wrong during validation.', e ];
            }

            if (!errorMessages) {
                // If no errorMessages were returned, then validation passed.

                // Add the rule's weight to the total score
                score += parseInt(rule.weight, 10);

                // Log that this rule passed in the matching details object
                details.passed.push({
                    rule
                });
            } else {
                // If errorMessages were present, then validation failed

                // If the rule that failed validation was Required, then
                // mark that a required Rule has failed
                if (rule.required) {
                    requiredFailed = true;
                }

                // Log that this rule failed in the matching details object
                // and include any error messages
                details.failed.push({
                    rule,
                    errorMessages
                });
            }
        });

        // If a required Rule has failed Validation, set the matching score to zero
        if (requiredFailed) {
            score = 0;
        }

        return {
            score,
            details
        };
    }
}

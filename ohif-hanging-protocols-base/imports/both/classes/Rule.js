import { Random } from 'meteor/random';
import { _ } from 'meteor/underscore';

// OHIF Modules
import { OHIF } from 'meteor/ohif:base';

// Local Modules
import { comparators } from '../lib/utils/comparators';

const EQUALS_REGEXP = /^equals$/;

const { DICOMTagDescriptions } = OHIF.base;

/**
 * This Class represents a Rule to be evaluated given a set of attributes
 * Rules have:
 * - An attribute (e.g. 'seriesDescription')
 * - A constraint Object, in the form required by Validate.js:
 *
 * rule.constraint = {
 *   contains: {
 *      value: 'T-1'
 *      }
 *   };
 *
 *  Note: In this example we use the 'contains' Validator, which is a custom Validator defined in Viewerbase
 *
 * - A value for whether or not they are Required to be matched (default: False)
 * - A value for their relative weighting during Protocol or Image matching (default: 1)
 */
export class Rule {
    /**
     * The Constructor for the Class to create a Rule with the bare minimum information
     *
     * @param {String}  attribute  Name of the attribute
     * @param {Object}  constraint Constraint object
     * @param {Boolean} required   If rule is required (true) or not (false). Default is false
     * @param {Integer} weight     Weight of the rule. Default is 1
     */
    constructor(attribute, constraint, required = false, weight = 1) {
        // Create a new UUID for this Rule
        this.id = Random.id();

        // If an attribute is specified, assign it
        if (attribute) {
            this.attribute = attribute;
        }

        // If a constraint is specified, assign it
        if (constraint) {
            this.constraint = constraint;
        }

        // Set the Rule's weight
        this.weight = weight;

        // If no value was specified
        this.required = required;

        // Cache for constraint info object
        this._constraintInfo = void 0;

        // Cache for validator and value object
        this._validatorAndValue = void 0;
    }

    /**
     * Occasionally the Rule class needs to be instantiated from a JavaScript Object.
     * This function fills in a Protocol with the Object data.
     *
     * @param {Object}  input    A Rule as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     * @param {Boolean} resetIds If true, create a new ID for the object
     */
    fromObject(input, resetIds = false) {
        // Check if the input already has an ID or it should be reset
        // If so, keep it. If not, create a new UUID
        this.id = (!resetIds && input.id) || Random.id();

        // Assign the specified input data to the Rule
        this.required = input.required === void 0 ? false : input.required;
        this.weight = input.weight || 1;
        this.attribute = input.attribute;
        this.constraint = input.constraint;
    }

    /**
     * Get the constraint info object for the current constraint
     * @return {Object\undefined} Constraint object or undefined if current constraint 
     *                            is not valid or not found in comparators list
     */
    getConstraintInfo() {
        let constraintInfo = this._constraintInfo;
        // Check if info is cached already
        if (constraintInfo !== void 0) {
            return constraintInfo;
        }

        const ruleConstraint = Object.keys(this.constraint)[0];

        if (ruleConstraint !== void 0) {
            constraintInfo = comparators.find(comparator => ruleConstraint === comparator.id)
        }

        // Cache this information for later use
        this._constraintInfo = constraintInfo;

        return constraintInfo;
    }

     /**
     * Check if current rule is related to priors
     * @return {Boolean} True if the rule is related to priors or false otherwise
     */
    isRuleForPrior() {
        // @TODO: Should we check this too? this.attribute === 'relativeTime'
        return this.attribute === 'abstractPriorValue';
    }

    /**
     * Check if the current rule is for a description attribute, such as SeriesDescription, StudyDescription, etc
     * @return {Boolean} True if the rule is for a description attribute or false otherwise
     */
    isADescriptionRule() {
        const tagInfo = DICOMTagDescriptions.find(this.attribute);
        const tagKeyword = tagInfo && tagInfo.keyword;

        return  tagKeyword && tagKeyword.toLowerCase().indexOf('description') > -1;
    }

    /**
     * If the current rule is a rule for priors, returns the number of referenced priors. Otherwise, returns -1.
     * @return {Number} The number of referenced priors or -1 if not applicable. Returns zero if the actual value could not be determined.
     */
    getNumberOfPriorsReferenced() {
        if (!this.isRuleForPrior()) {
            return -1;
        }

        // Get rule's validator and value
        const ruleValidatorAndValue = this.getConstraintValidatorAndValue();
        const { value, validator } = ruleValidatorAndValue;
        const intValue = parseInt(value, 10) || 0; // avoid possible NaN

        // "Equal to" validators
        if (EQUALS_REGEXP.test(validator)) {
            // In this case, -1 (the oldest prior) indicates that at least one study is used
            return intValue < 0 ? 1 : intValue;
        }

        // Default cases return value
        return 0;
    }

    /**
     * Get the constraint validator and value
     * @return {Object|undefined} Returns an object containing the validator and it's value or undefined
     */
    getConstraintValidatorAndValue() {
        let validatorAndValue = this._validatorAndValue;
        
        // Check if validator and value are cached already
        if (validatorAndValue !== void 0) {
            return validatorAndValue;
        }

        // Get the constraint info object
        const constraintInfo = this.getConstraintInfo();

        // Constraint info object exists and is valid
        if (constraintInfo !== void 0) {
            const validator = constraintInfo.validator;
            const currentValidator = this.constraint[validator];

            if (currentValidator) {
                const constraintValidator = constraintInfo.validatorOption;
                const constraintValue = currentValidator[constraintValidator];

                validatorAndValue = {
                    value: constraintValue,
                    validator: constraintInfo.id
                };

                this._validatorAndValue = validatorAndValue;
            }
        }

        return validatorAndValue;
    }

    /**
     * Mount a constraint object by a value
     * @param  {Any} value Value to create the constraint
     * @return {Object}    Constraint object according to the value type
     */
    mountConstraintByValue(value) {
        const ruleConstraint = {};
        
        if (typeof value === 'number') {
            ruleConstraint.equals = { value };
        } else {
            ruleConstraint.contains = { value };
        }

        return ruleConstraint;
    }

    /**
     * Check if a given rule is equal to the current rule
     * @param  {Rule}    Rule object to compare
     * @return {Boolean} True if rules are equal or false otherwise
     */
    ruleIsEqual(rule) {
        if (!rule) {
            return false;
        }

        const { attribute, constraint } = rule;
        
        return _.isEqual(attribute, this.attribute) && _.isEqual(constraint, this.constraint);
    }
}


// Local imports
import { ImageMatchingRule } from './rules/ImageMatchingRule';
import { SeriesMatchingRule } from './rules/SeriesMatchingRule';
import { StudyMatchingRule } from './rules/StudyMatchingRule';
import { removeFromArray } from '../lib/utils/removeFromArray';

/**
 * Constants
 */

// Prior Selection Rule
const ABSTRACT_PRIOR_VALUE = 'abstractPriorValue';

/**
 * This Class defines a Viewport in the Hanging Protocol Stage. A Viewport contains
 * arrays of Rules that are matched in the ProtocolEngine in order to determine which
 * images should be hung.
 *
 * @type {Viewport}
 */
export class Viewport {

    constructor() {
        this.viewportSettings = {};
        this.imageMatchingRules = [];
        this.seriesMatchingRules = [];
        this.studyMatchingRules = [];
    }

    /**
     * Occasionally the Viewport class needs to be instantiated from a JavaScript Object.
     * This function fills in a Viewport with the Object data.
     *
     * @param input The Viewport as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     */
    fromObject(input) {
        // If ImageMatchingRules exist, create them from the Object data
        // and add them to the Viewport's imageMatchingRules array
        if (input.imageMatchingRules) {
            input.imageMatchingRules.forEach(ruleObject => {
                var rule = new ImageMatchingRule();
                rule.fromObject(ruleObject);
                this.imageMatchingRules.push(rule);
            });
        }

        // If SeriesMatchingRules exist, create them from the Object data
        // and add them to the Viewport's seriesMatchingRules array
        if (input.seriesMatchingRules) {
            input.seriesMatchingRules.forEach(ruleObject => {
                var rule = new SeriesMatchingRule();
                rule.fromObject(ruleObject);
                this.seriesMatchingRules.push(rule);
            });
        }

        // If StudyMatchingRules exist, create them from the Object data
        // and add them to the Viewport's studyMatchingRules array
        if (input.studyMatchingRules) {
            input.studyMatchingRules.forEach(ruleObject => {
                var rule = new StudyMatchingRule();
                rule.fromObject(ruleObject);
                this.studyMatchingRules.push(rule);
            });
        }

        // If ViewportSettings exist, add them to the current protocol
        if (input.viewportSettings) {
            this.viewportSettings = input.viewportSettings;
        }
    }

    /**
     * Add viewport rules
     * @param {Rule} rule The matching rule to be added to the viewport
     */
    addRule(rule) {
        if (rule instanceof StudyMatchingRule) {
            this.studyMatchingRules.push(rule);
        } else if (rule instanceof SeriesMatchingRule) {
            this.seriesMatchingRules.push(rule);
        } else if (rule instanceof ImageMatchingRule) {
            this.imageMatchingRules.push(rule);
        }
    }

    /**
     * Finds and removes a rule from whichever array it exists in.
     * It is not required to specify if it exists in studyMatchingRules,
     * seriesMatchingRules, or imageMatchingRules
     *
     * @param rule
     */
    removeRule(rule) {
        var array;
        if (rule instanceof StudyMatchingRule) {
            array = this.studyMatchingRules;
        } else if (rule instanceof SeriesMatchingRule) {
            array = this.seriesMatchingRules;
        } else if (rule instanceof ImageMatchingRule) {
            array = this.imageMatchingRules;
        }

        removeFromArray(array, rule);
    }

    getReferencedPrior(priors, matcher) {

        // List of rules that will define the set of relevant priors
        const filteringRules = [];

        // The variables that will be returned
        let abstractPriorValue, referredPrior, referencesFound = false;

        // Iterate over study matching rules in search for references to priors
        this.studyMatchingRules.forEach(rule => {
            // Note that if multiple rules for abstract priors exist, only the last one will be used.
            if (rule.attribute === ABSTRACT_PRIOR_VALUE) {
                // @TODO: The "Abstract Prior Value" rule only correctly supports the "equals" validator type...
                // But I'm not sure if it's "fixable". Also the "Relative Time" rule should be supported.
                const validatorType = Object.keys(rule.constraint)[0];
                const validator = Object.keys(rule.constraint[validatorType])[0];
                // set abstract prior value
                abstractPriorValue = parseInt(rule.constraint[validatorType][validator], 10);
                referencesFound = abstractPriorValue < 0 || abstractPriorValue > 0;
            } else {
                filteringRules.push(rule);
            }
        });

        // A reference to priors was found
        if (referencesFound) {
            // At first, let's consider all priors as relevant...
            let relevantPriors = priors;
            let relevantPriorsCount = relevantPriors.length;
            if (filteringRules.length > 0) {
                // Since applicable rules are available, only priors that match those rules will be
                // considered "relevant priors"...
                relevantPriors = relevantPriors.filter(prior => {
                    return (matcher.match(prior, filteringRules)).score > 0;
                });
                // Should we consider scores? Maybe we can take the following route:
                // let matchedPriors, highestScore = 0;
                // relevantPriors.forEach(prior => {
                //     const { score } = matcher.match(prior, applicableRules);
                //     if (score > highestScore) {
                //         matchedPriors = [ prior ]; // discard previous matches and
                //         highestScore = score;
                //     } else if (score === highestScore && score > 0) {
                //         matchedPriors.push(prior);
                //     }
                // });
                // relevantPriors = matchedPriors || [];
                relevantPriorsCount = relevantPriors.length;
            }
            // If abstract prior value (which is basically an index) is within relevant priors' bounds, we have a match!
            if (abstractPriorValue > 0 && abstractPriorValue <= relevantPriorsCount) { // [ <= ] since abstractPriorValue index is 1-based
                // Abstract Prior Found!
                referredPrior = relevantPriors[abstractPriorValue - 1];
            } else if (abstractPriorValue < 0 && (relevantPriorsCount + abstractPriorValue) >= 0) {
                referredPrior = relevantPriors[relevantPriorsCount + abstractPriorValue];
            }
        }

        return { referencesFound, referredPrior, abstractPriorValue };

    }

}

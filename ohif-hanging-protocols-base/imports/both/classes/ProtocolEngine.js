// OHIF Modules
import { OHIF } from 'meteor/ohif:base';
// Local Modules
import { Protocol } from './Protocol';
import { Viewport } from './Viewport';
import { Matcher } from './Matcher'
import { ProtocolDataSource } from './ProtocolDataSource';
import logger from '../lib/logger';

/**
 * Import Related Constants
 */

const { OHIFError, StudyMetadataSource } = OHIF.base;
const { sortObjectArrayBy, tests: { isString, isFunction } } = OHIF.base.utils;
const { StudyMetadata, SeriesMetadata, InstanceMetadata, StudySummary } = OHIF.base.metadata;

/**
 * Class Definition
 */

export class ProtocolEngine {

    /**
     * Constructor
     * @param {StudyMetadata} study The study which will be tested against the given list of protocols.
     * @param {Study} priors Map of prior studies
     * @param {ProtocolDataSource} protocols Instance of StudyMetadataSource (ohif-viewerbase) Object to get study metadata
     */
    constructor(study, priors, protocols) {

        // -----------
        // Type Validations

        if (!(study instanceof StudyMetadata)) {
            throw new TypeError('ProtocolEngine::constructor study is not an instance of StudyMetadata');
        }

        if (!(priors instanceof Array) || (!priors.every(prior => prior instanceof StudySummary || prior instanceof StudyMetadata))) {
            throw new TypeError('ProtocolEngine::constructor priors is not an array or its items are not instances of StudySummary or StudyMetadata');
        }

        if (!(protocols instanceof ProtocolDataSource)) {
            throw new TypeError('ProtocolEngine::constructor protocols is not an instance of ProtocolDataSource');
        }

        // --------------
        // Initialization

        this.study = study;
        this.priors = priors;
        this.protocols = protocols;
        this.matcher = new Matcher();

        // This attribute centralizes all promises related to engine API
        this.promises = Object.create(null);

    }

    /**
     * Retrieves the current protocol matcher of the engine.
     *
     * @returns {Matcher} The current matcher being used by the engine.
     */
    getMatcher() {
        return this.matcher;
    }

    getDefaultProtocol() {
        let defaultProtocol = this.promises.defaultProtocol;
        if (!(defaultProtocol instanceof Promise)) {
            defaultProtocol = this.protocols.findById('defaultProtocol').then(result => {
                if (result.found) {
                    logger('info', 'ProtocolEngine::getDefaultProtocol', 'Default Protocol Found', result.duration);
                    return result.item; // resolve the promise with the protocol found
                } else {
                    // log event and reject promise since no default protocol has been found
                    logger('warn', 'ProtocolEngine::getDefaultProtocol', 'Default Protocol Not Found');
                    throw new Error('ProtocolEngine::getDefaultProtocol Default Protocol Not Found');
                }
            }, error => {
                // On failure, discard original promise in order to make it possible for a new attempt...
                logger('warn', 'ProtocolEngine::getDefaultProtocol', 'Error while reaching for default protocol', error);
                delete this.promises.defaultProtocol;
                throw error; // reject original promise (the one created by ".then") with original error.
            });
            this.promises.defaultProtocol = defaultProtocol;
        }
        return defaultProtocol;
    }


    /**
     * Retrieves the current list of non-matched protocols.
     *
     * @returns {[Protocol]} The current list of matched protocols.
     */
    getNonMatchedProtocols() {
        let nonMatchedProtocols = this.promises.nonMatchedProtocols;
        if (!(nonMatchedProtocols instanceof Promise)) {
            this.exec();
            nonMatchedProtocols = this.promises.nonMatchedProtocols;
        }
        return nonMatchedProtocols;
    }

    /**
     * Retrieves the current list of matched protocols.
     *
     * @returns {[Protocol]} The current list of matched protocols.
     */
    getMatchedProtocols() {
        let matchedProtocols = this.promises.matchedProtocols;
        if (!(matchedProtocols instanceof Promise)) {
            matchedProtocols = this.exec();
        }
        return matchedProtocols;
    }

    /**
     * Creates a promise that resolves to all matched protocols.
     */
    exec() {

        logger('info', 'ProtocolEngine::exec', 'Init');

        const matchedProtocols = [];
        const nonMatchedProtocols = [];
        const studyInstance = this.study.getFirstInstance();
        const numberOfAvailablePriors = this.priors.length;

        const protocolMatchingPromise = this.protocols.forEach(protocol => {

            // Clone the protocol's protocolMatchingRules array
            // We clone it so that we don't accidentally add the
            // numberOfPriorsReferenced rule to the Protocol itself.
            const rules = protocol.protocolMatchingRules instanceof Array ? protocol.protocolMatchingRules.slice() : null;
            if (!rules) {
                return;
            }

            // Check if the study has the minimun number of priors used by the protocol.
            const numberOfPriorsReferenced = protocol.getNumberOfPriorsReferenced();
            if (numberOfPriorsReferenced > numberOfAvailablePriors) {
                return;
            }

            // Run the matcher and get matching details
            const details = this.matcher.match(studyInstance, rules);
            const score = details.score;

            // The protocol matched some rule, add it to the matched list
            if (score > 0) {
                matchedProtocols.push({
                    score,
                    protocol
                });
            } else {
                nonMatchedProtocols.push({
                    id: protocol.id,
                    name: protocol.name
                });
            }

        });

        // Create a promise with list of non-matched protocols...
        this.promises.nonMatchedProtocols = protocolMatchingPromise.then(stats => {
            return nonMatchedProtocols;
        });

        // ... and a promise with list of matched protocols!
        this.promises.matchedProtocols = protocolMatchingPromise.then(stats => {

            logger('info', 'ProtocolEngine::exec', 'Stats', stats);

            if (matchedProtocols.length > 0) {
                // Sort the matched list by score
                sortObjectArrayBy(matchedProtocols, [ [ 'score', 'desc' ] ]);
                return matchedProtocols;
            } else {
                // Find default protocol and add it to the list of matched protocols
                return this.getDefaultProtocol().then(protocol => {
                    logger('info', 'ProtocolEngine::exec', 'Using Default Protocol');
                    matchedProtocols.push({
                        protocol,
                        score: 1
                    });
                    return matchedProtocols;
                });
            }

        });

        // Returns the promise of matched protocols
        return this.promises.matchedProtocols;

    }

    /**
     * Return the best matched Protocol to the current study or set of studies
     * @returns {*}
     */
    getBestProtocolMatch() {

        let bestMatch = this.promises.bestMatch;

        if (!(bestMatch instanceof Promise)) {
            bestMatch = this.getMatchedProtocols().then(matchedProtocols => {
                logger('info', 'ProtocolEngine::getBestProtocolMatch', 'Best Match Found');
                return matchedProtocols[0].protocol; // since matched protocols are expected to be sorted by score, just pick up the first item
            }, error => {
                // On failure, discard original promise in order to make it possible for a new attempt...
                logger('warn', 'ProtocolEngine::getBestProtocolMatch', 'Error while reaching out for matched protocols', error);
                delete this.promises.bestMatch;
                throw error; // reject original promise (the one created by ".then") with original error.
            });
            this.promises.bestMatch = bestMatch;
        }

        return bestMatch;

    }

    // Match images given a list of Studies and a Viewport's image matching reqs
    matchImages(viewport) {

        logger('info', 'ProtocolEngine::matchImages', 'Initialized');

        if (!(viewport instanceof Viewport)) {
            throw new TypeError('ProtocolEngine::matchImages Viewport argument expected');
        }

        // Use viewport's studyMatchingRules to determine if a given viewport references priors
        const { referredPrior, referencesFound, abstractPriorValue } = viewport.getReferencedPrior(this.priors, this.matcher);

        // Define study promise
        let studyPromise;

        if (referencesFound) {
            // This viewport references a prior.
            if (referredPrior instanceof StudySummary) {
                studyPromise = referredPrior.getStudyMetadata();
            } else if (referredPrior instanceof StudyMetadata) {
                studyPromise = Promise.resolve(referredPrior);
            } else {
                studyPromise = Promise.reject(new Error('ProtocolEngine::matchImages Prior Study Not Found'));
            }
        } else {
            // Since no references to priors have been found, this viewport is referencing the current study.
            studyPromise = Promise.resolve(this.study);
        }

        return studyPromise.then(study => {

            // A list of images that match the given viewport's criteria
            const matchingScores = [];

            // The rules which will be tested. Only seriesMatchingRules and imageMatchingRules are used in this round since
            // the only studies involved in the matching process are the selected study itself and its priors. The studyMatchingRules
            // now are used to filter the list priors into a list of relevant priors.
            const { seriesMatchingRules, imageMatchingRules } = viewport;

            // @TODO: This value is only meaningful when used in conjunction with a protocol's study matching rules
            // and has no actual meaning here and should be removed since relying on this value is error prone.
            if (abstractPriorValue !== void 0) {
                study.setCustomAttribute('abstractPriorValue', abstractPriorValue);
            }

            // Iterate over all study series and its images matching them against series and image matching rules
            study.forEachSeries(series => {
                // Match series rules against current series. If any series matching rule is given and the resulting score
                // is 0 (zero), skip this entire series.
                const seriesMatchDetails = this.matcher.match(series.getFirstInstance(), seriesMatchingRules);
                if (seriesMatchDetails.score < 1 && seriesMatchDetails.details.failed.length > 0) {
                    return;
                }

                series.forEachInstance((instance, index) => {

                    // This tests to make sure there is actually image data in this instance
                    // TODO: Change this when we add PDF and MPEG support
                    // See https://ohiforg.atlassian.net/browse/LT-227
                    // sopClassUid = x00080016
                    // rows = x00280010
                    // The test [ OHIF.viewerbase.isImage(instance.getTagValue('x00080016')) ] has been removed
                    // since it seemed unnecessary and was intruducing dependency issues.
                    if (!(instance.getTagValue('x00280010') > 0)) {
                        return;
                    }

                    // Match image rules against current image.
                    const imageMatchDetails = this.matcher.match(instance, imageMatchingRules);

                    const matchDetails = {};
                    matchDetails.passed = seriesMatchDetails.details.passed.concat(imageMatchDetails.details.passed);
                    matchDetails.failed = seriesMatchDetails.details.failed.concat(imageMatchDetails.details.failed);

                    // Skip this image if total score is less than 1 (one)
                    const totalMatchScore = seriesMatchDetails.score + imageMatchDetails.score;

                    // @TODO Find an alternative to how the default protocol is matched. Wildcards in rules, maybe?
                    // The amount of failed matches are considered here to allow the default protocol to be applied.
                    // Instead of using rules which apply to every study, the default protocol is a protocol which has
                    // no rules. Thus, if the total score of an image is zero, we must also check if the amount
                    // of rules failed is greater than zero. The default protocol will have score zero with zero failed
                    // matches.
                    if (totalMatchScore < 1 && matchDetails.failed.length > 0) {
                        return;
                    }

                    const currentSOPInstanceUID = instance.getSOPInstanceUID();

                    const imageDetails = {
                        studyInstanceUid: study.getStudyInstanceUID(),
                        seriesInstanceUid: series.getSeriesInstanceUID(),
                        sopInstanceUid: currentSOPInstanceUID,
                        imageId: instance.getImageId(),
                        displaySetInstanceUid: instance.getCustomAttribute('displaySetUID'),
                        currentImageIdIndex: index,
                        matchingScore: totalMatchScore,
                        matchDetails: matchDetails,
                        sortingInfo: {
                            score: totalMatchScore,
                            displaySetNumber: instance.getCustomAttribute('displaySetNumber'),
                            displaySetImageNumber: instance.getCustomAttribute('displaySetImageNumber'),
                            // ~~ The match result will only have instances from the same study, so this information is useless for sorting...
                            // study: instance.getTagValue('x00080020') + instance.getTagValue('x00080030'), // StudyDate = x00080020 StudyTime = x00080030
                            series: parseInt(instance.getTagValue('x00200011')), // TODO: change for seriesDateTime SeriesNumber = x00200011
                            instance: parseInt(instance.getTagValue('x00200013')) // TODO: change for acquisitionTime InstanceNumber = x00200013
                        }
                    };

                    // ~~ The following code may still be necessary... Currently display set information is expected
                    // ~~ to be embedded into each image (instance) as custom attributes but this behaviour may change.
                    // Find the displaySet
                    // const displaySet = study.findDisplaySet(displaySet => displaySet.images.find(image => image.getSOPInstanceUID() === currentSOPInstanceUID));
                    // If the instance was found, set the displaySet ID
                    // if (displaySet) {
                    //     imageDetails.displaySetInstanceUid = displaySet.getUID();
                    // }

                    matchingScores.push(imageDetails);

                });
            });

            // Sort (and, in the future, group) matchingScores list
            sortObjectArrayBy(matchingScores, [
                [ 'sortingInfo.score', 'desc' ],
                [ 'sortingInfo.displaySetNumber', 'asc' ],
                [ 'sortingInfo.displaySetImageNumber', 'asc' ],
                [ 'currentImageIdIndex', 'asc' ],
                // [ 'sortingInfo.study', 'desc' ],
                [ 'sortingInfo.series', 'asc' ],
                [ 'sortingInfo.instance', 'asc' ]
            ]);

            // define best match based on best score
            const bestMatch = matchingScores[0];

            logger('info', 'ProtocolEngine::matchImages bestMatch', bestMatch);

            return { bestMatch, matchingScores };

        });

    }

};

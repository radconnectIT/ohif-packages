import { Metadata } from './Metadata';
import { DICOMTagDescriptions } from '../../lib/DICOMTagDescriptions';

/**
 * Constants
 */

const STUDY_INSTANCE_UID = 'x0020000d';
const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Class Definition
 */

export class StudySummary extends Metadata {

    constructor(tagMap, attributeMap, uid) {

        // Call the superclass constructor passing an plain object with no prototype to be used as the main "_data" attribute.
        const _data = Object.create(null);
        super(_data, uid);

        // Initialize internal tag map if first argument is given.
        if (tagMap !== void 0) {
            this.addTags(tagMap);
        }

        // Initialize internal property map if second argument is given.
        if (attributeMap !== void 0) {
            this.setCustomAttributes(attributeMap);
        }

    }

    getStudyInstanceUID() {
        // This method should return null if StudyInstanceUID is not available to keep compatibility StudyMetadata API
        return this.getTagValue(STUDY_INSTANCE_UID) || null;
    }

    /**
     * Append tags to internal tag map.
     * @param {Object} tagMap An object whose own properties will be used as tag values and appended to internal tag map.
     */
    addTags(tagMap) {
        const _data = this.getData();
        for (let tag in tagMap) {
            if (hasOwn.call(tagMap, tag)) {
                const description = DICOMTagDescriptions.find(tag);
                // When a description is available, use its tag as internal key...
                if (description) {
                    _data[description.tag] = tagMap[tag];
                } else {
                    _data[tag] = tagMap[tag];
                }
            }
        }
    }

    /**
     * Returns a promise that will resolve to the StudyMetadata instance relative to
     */
    getStudyMetadata() {
        return Promise.reject(new Error('StudySummary::getStudyMetadata Method not implemented'));
    }

    // @Override
    tagExists(tagName) {
        const _data = this.getData();
        const description = DICOMTagDescriptions.find(tagName);
        if (description) {
            return (description.tag in _data);
        }
        return (tagName in _data);
    }

    // @Override
    getTagValue(tagName, defaultValue) {
        let value;
        const _data = this.getData();
        const description = DICOMTagDescriptions.find(tagName);
        if (description !== void 0) {
            value = _data[description.tag];
        } else {
            value = _data[tagName];
        }
        return value !== void 0 ? value : defaultValue;
    }

}

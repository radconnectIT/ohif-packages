
/**
 * Abstract class to fetch study metadata.
 */
export class StudyMetadataSource {

    /**
     * Get study metadata for a study with given study InstanceUID.
     * @param {String} studyInstanceUID Study InstanceUID.
     * @returns {Promise} A promise that will be fulfilled with the study metadata related to the given studyInstanceUID.
     */
    getByInstanceUID(studyInstanceUID) {
        /**
         * Please override this method on a specialized class.
         */
        return Promise.reject(new Error('StudyMetadataSource::getByInstanceUID is not overriden. Please, override it in a specialized class. See OHIFStudyMetadataSource for example'));
    }

    /**
     * Load the full study metadata instance from a given study summary into the current execution context.
     * @param {StudySummary} study The StudySummary instance from which the StudyMetadata instance is expected.
     * @returns {Promise} A promise that will be fulfilled with the StudyMetadata instance related to the given StudySummary instance.
     */
    loadStudy(study) {
        /**
         * Please override this method on a specialized class.
         */
        return Promise.reject(new Error('StudyMetadataSource::loadStudy is not overriden. Please, override it in a specialized class. See OHIFStudyMetadataSource for example'));
    }

}

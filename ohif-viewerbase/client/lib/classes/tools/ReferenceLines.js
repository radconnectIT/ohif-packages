
import { OHIF } from 'meteor/ohif:core';

const { EventSource } = OHIF.base.events;

export class ReferenceLines extends EventSource {

    addSource(element) {
        throw new Error('ReferenceLines::addSource Method Not Implemented');
    }

    removeSource(element) {
        throw new Error('ReferenceLines::removeSource Method Not Implemented');
    }

    addTarget(element) {
        throw new Error('ReferenceLines::addTarget Method Not Implemented');
    }

    removeTarget(element) {
        throw new Error('ReferenceLines::removeTarget Method Not Implemented');
    }

    clear() {
        throw new Error('ReferenceLines::clear Method Not Implemented');
    }

    enable() {
        throw new Error('ReferenceLines::enable Method Not Implemented');
    }

    disable() {
        throw new Error('ReferenceLines::disable Method Not Implemented');
    }

    isEnabled() {
        throw new Error('ReferenceLines::isEnabled Method Not Implemented');
    }

}

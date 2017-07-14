import { OHIF } from 'meteor/ohif:base';

export class ProtocolDataSource extends OHIF.base.AsyncDataSource {

    findById(protocolId) {
        return Promise.reject(new Error('ProtocolDataSource::findById Method not implemented'));
    }

}

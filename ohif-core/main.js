import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:base';

/*
 * Defines properties of the base OHIF object
 */

Object.assign(OHIF, {
    log: {},
    ui: {},
    utils: {},
    viewer: {},
    cornerstone: {}
});

// Expose the OHIF object to the client if it is on development mode
// @TODO: remove this after applying namespace to this package
if (Meteor.isClient) {
    window.OHIF = OHIF;
}

export { OHIF };

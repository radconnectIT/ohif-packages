
Package.describe({
    name: 'ohif:hanging-protocols-base',
    summary: 'OHIF Hanging Protocols Base Package',
    version: '0.0.1'
});

Package.onUse(function(api) {

    // API Version
    api.versionsFrom('1.4');

    // Dependencies
    api.use('ecmascript');
    api.use('underscore');
    api.use('ohif:base');

    // @TODO: Make sure we need validate.js
    api.use('ohif:validatejs');

    // Entry Points
    api.mainModule('client/main.js', 'client');
    api.mainModule('server/main.js', 'server');

});

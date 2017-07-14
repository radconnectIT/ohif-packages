
Package.describe({
    name: 'ohif:base',
    summary: 'OHIF Base Libraries and Classes',
    version: '0.0.1'
});

Package.onUse(function(api) {

    // API Version
    api.versionsFrom('1.4');

    // Dependencies
    api.use('ecmascript');
    api.use('random');

    // Entry Points
    api.mainModule('client/main.js', 'client');
    api.mainModule('server/main.js', 'server');

});

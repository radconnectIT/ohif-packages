
Package.describe({
    name: 'ohif:validatejs',
    summary: 'OHIF Specific Version of Validade.js Library',
    version: '0.0.1'
});

Package.onUse(function(api) {

    // API Version
    api.versionsFrom('1.4');

    // Dependencies
    api.use('ecmascript');

    // Entry Point
    api.mainModule('main.js', [ 'client', 'server' ]);

});

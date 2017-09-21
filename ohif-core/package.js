Package.describe({
    name: 'ohif:core',
    summary: 'OHIF core components, helpers and UI functions',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4.2');

    api.use('ecmascript@0.8.2');
    api.use('standard-app-packages@1.0.9');
    api.use('jquery@1.11.10');
    api.use('stylus@2.513.9');
    api.use('underscore@1.0.10');
    api.use('templating@1.3.2');
    api.use('reactive-var@1.0.11');
    api.use('check@1.2.5');

    // Router dependencies
    api.use('iron:router@1.1.2', 'client');

    // Component's library dependencies
    api.use('natestrauser:select2@4.0.1', 'client');
    api.use('aldeed:simple-schema@1.5.3');

    // OHIF Packages
    api.use('ohif:base');
    api.use('ohif:design');

    // UI Styles
    api.addFiles([
        'client/ui/dimensional/dimensional.styl',
        'client/ui/resizable/resizable.styl',
        'client/components/bootstrap/dialog/loading.styl',
        'client/components/bootstrap/dialog/progress.styl',
        'client/components/bootstrap/dialog/unsavedChangesDialog.styl',
        'client/components/bootstrap/dropdown/dropdown.styl'
    ], 'client');

    api.mainModule('main.js', ['client', 'server']);

    // Client imports and routes
    api.addFiles('client/index.js', 'client');

    // Server imports and methods
    api.addFiles('server/index.js', 'server');

    // Client and server imports
    api.addFiles('both/index.js', ['client', 'server']);

});

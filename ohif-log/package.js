Package.describe({
  name: 'ohif:log',
  summary: 'OHIF Logging',
  version: '0.0.1'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4');

  api.use('ecmascript');

  // Control over logging
  api.use('practicalmeteor:loglevel');

  // Our custom packages
  api.use('ohif:core');

  api.addFiles('main.js', [ 'client', 'server' ]);
});

Package.onTest(function (api) {
  api.use('ecmascript@0.6.1');
  api.use('practicalmeteor:chai');
  api.use('practicalmeteor:mocha');
  api.use('practicalmeteor:sinon');

  // OHIF Packages
  api.use('ohif:core');
  api.addFiles('tests/ohifLog.test.js');
});

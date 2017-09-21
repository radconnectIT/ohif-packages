Package.describe({
  name: 'ohif:log',
  summary: 'OHIF Logging',
  version: '0.0.1'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2');

  api.use('ecmascript@0.8.2');

  // Control over logging
  api.use('practicalmeteor:loglevel@1.2.0_2');

  // Our custom packages
  api.use('ohif:core');

  api.addFiles('main.js', [ 'client', 'server' ]);
});

Package.onTest(function (api) {
  api.use('ecmascript@0.8.2');
  api.use('practicalmeteor:chai@2.1.0_1');
  api.use('practicalmeteor:mocha@2.4.5_6');
  api.use('practicalmeteor:sinon@1.14.1_2');

  // OHIF Packages
  api.use('ohif:core');
  api.addFiles('tests/ohifLog.test.js');
});

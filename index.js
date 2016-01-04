// Copyright 2015, EMC, Inc.

'use strict';

var di = require('di'),
    _ = require('lodash'),
    core = require('on-core')(di),
    injector = new di.Injector(
        _.flattenDeep([
            core.injectables,
            core.helper.requireWrapper('dgram'),
            require('./lib/app')
        ])
    ),
    logger = injector.get('Logger').initialize('Syslog'),
    syslog = injector.get('Syslog');

syslog.start()
.catch(function(err) {
  logger.error('Failure starting Syslog service' + err.stack);
  process.nextTick(function(){
    process.exit(1);
  });
});

process.on('SIGINT',function() {
  syslog.stop()
  .catch(function(err) {
    logger.error('Failure cleaning up Syslog service' + err.stack);
  })
  .finally(function() {
    process.nextTick(function(){
      process.exit(1);
    });
  });
});

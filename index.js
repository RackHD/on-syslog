// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di'),
    _ = require('lodash'),
    core = require('renasar-core')(di),
    injector = new di.Injector(
        _.flatten([
            core.injectables,
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
  .fin(function() {
    process.nextTick(function(){
      process.exit(1);
    });
  });
});


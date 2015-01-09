// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di'),
    dgram = require('dgram');

module.exports = syslogServiceFactory;

di.annotate(syslogServiceFactory, new di.Provide('Syslog'));
di.annotate(syslogServiceFactory, new di.Inject(
    'Services.Core',
    'Services.Configuration',
    'Logger',
    'Q',
    '_'
));
function syslogServiceFactory(core, configuration, Logger, Q, _) {
    var logger = Logger.initialize(syslogServiceFactory);
    var server = dgram.createSocket('udp4');
    var levels = [
        'emerg',
        'alert',
        'crit',
        'error',
        'warning',
        'notice',
        'info',
        'debug'
    ];

    function SyslogService() {
    }

    SyslogService.prototype.start = function start() {
        return core.start()
        .then(function() {
            server.on('message', function (data, remote) {
                data = data.toString('utf8');

                var match = data.match(/<(\d+)>(.+)/),
                        message = data,
                        level = 'info',
                        meta = {};

                    if (remote.address) {
                        meta.ip = remote.address;
                    }

                    if (match) {
                        var prival = parseInt(match[1]),
                            facility = Math.floor(prival / 8),
                            priority = prival - (facility * 8);

                        level = levels[priority];
                        message = match[2].trim();
                    }

                    if(_.keys(meta).length) {
                        logger[level](message, meta);
                    } else {
                        logger[level](message);
                    }
            });

            server.on('listening', function () {
                logger.notice('Listening');
            });

            server.on('error', function (error) {
                logger.error('SysLog Service Error.', {
                    error: error
                });
            });

            server.on('close', function () {
                // Don't use logger here, because in stop() we close the server
                // and close the message bus, so the logger will try to log on
                // the now closed bus.
                console.log('Syslog server closed');
            });

            server.bind(configuration.get('port'));
        });
    };

    SyslogService.prototype.stop = function stop() {
        return Q.resolve()
        .then(function() {
            server.close();
            return core.stop();
        });
    };

    return new SyslogService();
}

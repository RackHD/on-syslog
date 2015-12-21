// Copyright 2015, EMC, Inc.

'use strict';

var di = require('di');

module.exports = syslogServiceFactory;

di.annotate(syslogServiceFactory, new di.Provide('Syslog'));
di.annotate(syslogServiceFactory, new di.Inject(
    'Services.Core',
    'Services.Configuration',
    'Logger',
    'Promise',
    '_',
    'dgram'
));

function syslogServiceFactory(core, configuration, Logger, Promise, _, dgram)  {
    var logger = Logger.initialize(syslogServiceFactory);
    var server = dgram.createSocket('udp4');
    // for mapping external syslog message levels to internal
    var syslogLevels = [
        'critical', //syslog.emerg
        'critical', //syslog.alert
        'critical', //syslog.crit
        'error',
        'warning',
        'info', //syslog.notice
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

                        level = syslogLevels[priority];
                        message = match[2].trim();

                        meta.facility = facility;
                        meta.priority = priority;
                    }

                    if(_.keys(meta).length) {
                        logger[level](message, meta);
                    } else {
                        logger[level](message);
                    }
            });

            server.on('listening', function () {
                logger.info('Syslog service is listening');
            });

            server.on('error', function (error) {
                logger.error('SysLog service error.', {
                    error: error
                });
            });

            server.on('close', function () {
                // Don't use logger here, because in stop() we close the server
                // and close the message bus, so the logger will try to log on
                // the now closed bus.
                console.info('Syslog server closed');
            });

            server.bind(
                configuration.get('syslogBindPort', 514),
                configuration.get('syslogBindAddress', '0.0.0.0')
            );
        });
    };

    SyslogService.prototype.stop = function stop() {
        return Promise.resolve()
        .then(function() {
            server.close();
            return core.stop();
        });
    };

    return new SyslogService();
}

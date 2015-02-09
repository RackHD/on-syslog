// Copyright 2015, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe(require('path').basename(__filename), function () {

    var injector;
    var Q = helper.baseInjector.get('Q');
    var util = require('util');
    var EventEmitter = require('events').EventEmitter;

    var fakeserver; // for mocking the server (dgram.createsocket result)
    var loggerSpy; // for watching the logger with a sinon spy
    var syslog; // for instance of syslog that's initialized but not started
    var startedSyslogServer; // for instance of syslog that's started with mocks

    // mocking the Services.Core
    // does nothing - just returns a resolved promise.
    var mockCoreFactory = function () {
        function MockCore() {}

        MockCore.prototype.start = function () {
            return Q.resolve();
        };
        return new MockCore();
    };
    helper.di.annotate(mockCoreFactory, new helper.di.Provide('Services.Core'));

    // mocking the Services.Configuration
    // returns static values for config requests
    var mockConfigFactory = function () {
        function MockConfig() {}

        MockConfig.prototype.get = function (key) {
            if (key === 'port') {
                // for binding the UDP socket to a high level port so testing doesn't require
                // anything fancy to run
                return 9999;
            }
        };
        return new MockConfig();
    };
    helper.di.annotate(mockConfigFactory, new helper.di.Provide('Services.Configuration'));


    var mockDgramFactory = function() {


        function FakeServer() {
            this.bind = function() {};
        }
        util.inherits(FakeServer, EventEmitter);


        function MockDgram() {}

        MockDgram.prototype.createSocket = function() {
            fakeserver = new FakeServer();
            return fakeserver;
        };

        return new MockDgram();
    };
    helper.di.annotate(mockDgramFactory, new helper.di.Provide('dgram'));



    before(function () {
        var _ = helper.baseInjector.get('_');
        // create a child injector with renasar-core and the base pieces we need to test this
        injector = helper.baseInjector.createChild(_.flatten([
            helper.require('/spec/mocks/logger.js'),
            mockConfigFactory,
            mockCoreFactory,
            mockDgramFactory,
            helper.require('/lib/app.js')
        ]));

        var logger = injector.get('Logger').initialize();
        loggerSpy = sinon.spy(logger, 'log');
        syslog = injector.get('Syslog');
        // keep around a promise from the start so we don't repeatedly register
        // event callbacks in the indivudual tests
        startedSyslogServer = syslog.start();
    });

    describe("app", function () {


        beforeEach(function() {
            loggerSpy.reset();

        });

        it('resolves from injector', function () {
            expect(syslog).to.be.ok;
            expect(syslog).to.be.an('Object');
        });

        it('should have a start method', function() {
            expect(syslog.start).to.be.a('function');
        });

        it('should have a stop method', function() {
            expect(syslog.stop).to.be.a('function');
        });


        it('should process event "message"', function() {
            var fakeData = "some message";
            return startedSyslogServer.then(function() {
                fakeserver.emit('message', fakeData, {});
            }).then(function() {
                expect(loggerSpy.called).to.be.ok;
                expect(loggerSpy.firstCall.args[1]).to.equal('some message');
            });
        });

        it('"message" should process annotate IP if provided', function() {
            var fakeData = "some message";
            var fakeRemote = { address: '192.192.192.192' };
            return startedSyslogServer.then(function() {
                fakeserver.emit('message', fakeData, fakeRemote);
            }).then(function() {
                expect(loggerSpy.called).to.be.ok;
                expect(loggerSpy.firstCall.args[2]).to.be.an('Object').with.property('ip');
                expect(loggerSpy.firstCall.args[2].ip).to.equal('192.192.192.192');
            });
        });

        describe('messages levels', function() {
            it('no tag defaults to info', function() {
                var fakeData = "some message";
                return startedSyslogServer.then(function() {
                    fakeserver.emit('message', fakeData, {});
                }).then(function() {
                    expect(loggerSpy.firstCall.args[0]).to.equal('info');
                });
            });
            it('tagged with <0> is emerg', function() {
                var fakeData = "<0> some message";
                return startedSyslogServer.then(function() {
                    fakeserver.emit('message', fakeData, {});
                }).then(function() {
                    expect(loggerSpy.firstCall.args[0]).to.equal('emerg');
                });
            });
            it('tagged with <1> is alert', function() {
                var fakeData = "<1> some message";
                return startedSyslogServer.then(function() {
                    fakeserver.emit('message', fakeData, {});
                }).then(function() {
                    expect(loggerSpy.firstCall.args[0]).to.equal('alert');
                });
            });
            it('tagged with <2> is crit', function() {
                var fakeData = "<2> some message";
                return startedSyslogServer.then(function() {
                    fakeserver.emit('message', fakeData, {});
                }).then(function() {
                    expect(loggerSpy.firstCall.args[0]).to.equal('crit');
                });
            });
            it('tagged with <3> is error', function() {
                var fakeData = "<3> some message";
                return startedSyslogServer.then(function() {
                    fakeserver.emit('message', fakeData, {});
                }).then(function() {
                    expect(loggerSpy.firstCall.args[0]).to.equal('error');
                });
            });
            it('tagged with <4> is warning', function() {
                var fakeData = "<4> some message";
                return startedSyslogServer.then(function() {
                    fakeserver.emit('message', fakeData, {});
                }).then(function() {
                    expect(loggerSpy.firstCall.args[0]).to.equal('warning');
                });
            });
            it('tagged with <5> is notice', function() {
                var fakeData = "<5> some message";
                return startedSyslogServer.then(function() {
                    fakeserver.emit('message', fakeData, {});
                }).then(function() {
                    expect(loggerSpy.firstCall.args[0]).to.equal('notice');
                });
            });
            it('tagged with <6> is info', function() {
                var fakeData = "<6> some message";
                return startedSyslogServer.then(function() {
                    fakeserver.emit('message', fakeData, {});
                }).then(function() {
                    expect(loggerSpy.firstCall.args[0]).to.equal('info');
                });
            });
            it('tagged with <7> is debug', function() {
                var fakeData = "<7> some message";
                return startedSyslogServer.then(function() {
                    fakeserver.emit('message', fakeData, {});
                }).then(function() {
                    expect(loggerSpy.firstCall.args[0]).to.equal('debug');
                });
            });
            it('tagged with <8> should route to emerg', function() {
                var fakeData = "<8> some message";
                return startedSyslogServer.then(function() {
                    fakeserver.emit('message', fakeData, {});
                }).then(function() {
                    var util = require('util');
                    //console.log(util.inspect(loggerSpy.firstCall.args));
                    //expect(loggerSpy.firstCall.args[0]).to.equal('emerg');
                });
            });

        });

        it('should process event "listening"', function() {
            return startedSyslogServer.then(function() {
                fakeserver.emit('listening');
            }).then(function() {
                expect(loggerSpy.called).to.be.ok;
            });
        });

        it('should process event "error"', function() {
            return startedSyslogServer.then(function() {
                fakeserver.emit('error');
            }).then(function() {
                expect(loggerSpy.called).to.be.ok;
            });
        });

        it('should process event "close"', function() {
            return startedSyslogServer.then(function() {
                fakeserver.emit('close');
            }).then(function() {
                expect(loggerSpy.called).to.not.be.ok;
            });;

        });

    });

});
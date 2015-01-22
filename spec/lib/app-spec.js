// Copyright 2015, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe(__filename, function () {

    var injector;
    var Q = helper.baseInjector.get('Q');
    var util = require('util');
    var EventEmitter = require('events').EventEmitter;

    var fakeserver; // for mocking the server

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
    });


    describe("app", function () {

        it('resolves from injector', function () {
            var syslog = injector.get('Syslog');
            expect(syslog).to.be.ok;
            expect(syslog).to.be.an('Object');
        });

        it('should have a start method', function() {
            var syslog = injector.get('Syslog');
            expect(syslog.start).to.be.a('function');
        });

        it('should have a stop method', function() {
            var syslog = injector.get('Syslog');
            expect(syslog.stop).to.be.a('function');
        });

        it('should process event "message"', function() {
            var syslog = injector.get('Syslog');
            //return syslog.start().then(function() {
            //    //fakeserver.emit('message', {
            //    //    remote: {
            //    //        address: '1.2.3.4'
            //    //    }
            //    //});
            //});
        });

        it('should process event "listening"', function() {
            var syslog = injector.get('Syslog');
            return syslog.start().then(function() {
                fakeserver.emit('listening');
            });
        });
        it('should process event "error"');
        it('should process event "close"');

    });

});
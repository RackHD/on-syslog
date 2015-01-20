// Copyright 2015, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe(__filename, function () {

    var injector;
    var Q = helper.baseInjector.get('Q');

    // mocking the Services.Core
    // does nothing - just returns a resolved promise.
    var mockCoreFactory = function () {
        function MockCore() {
        }

        MockCore.prototype.start = function () {
            return Q.resolve();
        };
    };
    helper.di.annotate(mockCoreFactory, new helper.di.Provide('Services.Core'));

    // mocking the Services.Configuration
    // returns static values for config requests
    var mockConfigFactory = function () {
        function MockConfig() {
        }

        MockConfig.prototype.get = function (key) {
            if (key === 'port') {
                // for binding the UDP socket to a high level port so testing doesn't require
                // anything fancy to run
                return 9999;
            }
        };
    };
    helper.di.annotate(mockConfigFactory, new helper.di.Provide('Services.Configuration'));


    before(function () {
        var _ = helper.baseInjector.get('_');
        // create a child injector with renasar-core and the base pieces we need to test this
        injector = helper.baseInjector.createChild(_.flatten([
            helper.require('/spec/mocks/logger.js'),
            mockConfigFactory,
            mockCoreFactory,
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

    });

});
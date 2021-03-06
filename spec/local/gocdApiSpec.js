
var mockery = require('mockery');
var ccTraySampleRequestor = require('../../lib/cc/ccTraySampleRequestor');
var gocdSampleRequestor = require('../../lib/gocd/gocdSampleRequestor');
var globalOptions = require('../../lib/options');

describe('gocd-api', function () {

  var gocdApi;

  beforeEach(function() {

    mockery.enable({
      warnOnUnregistered: false,
      warnOnReplace: false
    });

    globalOptions.getHistoryRequestor = function() {
      return gocdSampleRequestor;
    };
    globalOptions.getCcTrayRequestor = function() {
      return ccTraySampleRequestor;
    };

    mockery.registerMock('../options', globalOptions);
    mockery.registerMock('./lib/options', globalOptions);

    gocdApi = require('../../index');

  });

  it('should return activity data', function (done) {
    gocdApi.getInstance().then(function(instance) {
      instance.readData('A-PIPELINE').then(function (data) {
        expect(data.activity).toBeDefined();
        expect(data.activity.stages.length).toBe(6);
        done();
      }).done();
    });
  });

  it('should fill the initial cache for history data', function (testDone) {
    gocdApi.getInstance().then(function(instance) {
      instance.readData('A-PIPELINE').then(function (data) {
        expect(data.history).toBeDefined();
        expect(data.history["2064"]).toBeDefined();// page 1
        expect(data.history["2063"]).toBeDefined();// page 3
        expect(data.history["2062"]).toBeDefined();// page 3
        // the others are currently building/scheduled
        expect(data.history["2065"]).toBeUndefined();// page 1
        expect(data.history["2066"]).toBeUndefined();// page 1
        testDone();
      }).done();
    }).done();
  });

  it('should read sample data for the downstream pipeline', function (done) {
    gocdApi.getInstance().then(function(instance) {
      instance.readData('DOWNSTREAM-PIPELINE').then(function (data) {
        expect(data.activity).toBeDefined();
        expect(data.activity.stages.length).toBe(2);
        expect(data.history).toBeDefined();
        done();
      }).done();
    });
  });

  it("should exclude currently building pipelines", function(done) {
    gocdApi.getInstance().then(function(instance) {
      instance.readData('A-PIPELINE').then(function (data) {
        expect(data.history['2066']).toBeUndefined();
        done();
      }).done();
    });
  });

  describe("should enrich activity data", function() {
    it("with author information from history", function(done) {
      gocdApi.getInstance().then(function(instance) {
        instance.readData('A-PIPELINE').then(function (data) {
          expect(data.activity.stages[4].initials).toBe("eno");
          done();
        }).done();
      });
    });

    it("with more accurate status of the stages", function(done) {
      gocdApi.getInstance().then(function(instance) {
        instance.readData('A-PIPELINE').then(function (data) {
          expect(data.activity.stages[1].gocdActivity).toBe('Building');
          expect(data.activity.stages[2].gocdActivity).toBe('Scheduled');
          done();
        }).done();
      });
    });

    fit("with more accurate result of the stages", function(done) {
      gocdApi.getInstance().then(function(instance) {
        instance.readData('DOWNSTREAM-PIPELINE').then(function (data) {
          expect(data.activity.stages[1].lastBuildStatus).toBe("Cancelled");
          expect(data.activity.stages[1].info2).toContain("Cancelled");
          done();
        }).done();
      });
    });

  });

});
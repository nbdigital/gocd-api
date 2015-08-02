
var _ = require('lodash');

describe('Integration with real Go CD server', function () {

  var gocdApi, options;

  beforeEach(function() {

    gocdApi = require('../../index');
    options = {
      url: process.env.GOCD_URL,
      pipeline: process.env.GOCD_PIPELINE || 'artwise',
      debug: true
    };

    // Set long timeout to allow collecting all data, even with slow responses
    jasmine.getEnv().defaultTimeoutInterval = 60000;

  });

  function getFirstResult(results) {
    var buildNumbers = _.keys(results);
    return results[buildNumbers[0]];
  }

  it('should read a set of pipeline runs (history) and jobs (activity)', function (done) {
    gocdApi.getInstance(options).readData().then(function (data) {

      // HISTORY
      var history = data.history;

      expect(_.keys(history).length).toBeGreaterThan(0);

      var firstResult = getFirstResult(history);

      expect(firstResult.stages.length).toBeGreaterThan(0);

      expect(firstResult['last_scheduled']).toBeDefined();
      expect(_.contains(['passed', 'failed'], firstResult.result)).toBe(true);
      expect(firstResult.author).toBeDefined();
      expect(firstResult.author.name).toBeDefined();

      expect(firstResult['build_cause'].committer).toBeDefined();
      expect(firstResult['build_cause'].comment).toBeDefined();
      expect(firstResult['build_cause'].revision).toBeDefined();
      expect(firstResult['build_cause'].files).toBeDefined();
      expect(firstResult.info).toBeDefined();

      // ACTIVITY
      expect(_.keys(data.activity.jobs).length).toBeGreaterThan(0);

      done();
    });

  });


});

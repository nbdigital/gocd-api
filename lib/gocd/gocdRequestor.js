
var Q = require('q');
var _ = require('lodash');
var requestor = require('../requestor');
var xml2json = require('xml2json');
var logger = require('../logger');
var globalOptions = require('../options');

function gocdRequestorModule() {

  function baseUrl() {
    var url = globalOptions.get().url;
    if(url && url.indexOf('http') !== 0) {
      url = 'http://' + url;
    }
    return url;
  }

  function getGocdPipelineBasePath (pipeline) {
    return '/go/api/pipelines/' + (pipeline || globalOptions.get().pipeline);
  }

  function getGocdHistoryPath (pipeline) {
    return getGocdPipelineBasePath(pipeline) + '/history';
  }

  function getFromGocd (path) {

    // Switching the logic to add baseUrl() when necessary instead of
    // removing it from path. This is due to a bug on go providing pipeline href with
    // http uris instead of https, making the replace operation useless.
    if(path.indexOf('http') === -1) {
      path = baseUrl() + path;
    }

    // Go CD api pipelines return a list of pipeline href without https whereas
	// the server is configured base url is configured so we ensure https is always use
	// if the global config url defined https.
    if(baseUrl().indexOf('https://') === 0 && path.indexOf('http://') === 0) {
      path = path.replace('http://','https://');
    }

    return requestor.getUrl(path);
  }


  function requestAndXml2Json(path) {
    return getFromGocd(path).then(function (body) {

      console.log('Acknowledge ' + path);
      var parsedResponse = xml2json.toJson(body, {
        object: true, sanitize: false
      });
      if (parsedResponse.html) {
        console.log('Error requesting', path);
        throw new Error('Unexpected HTML response: ' + body);
      } else {
        return parsedResponse;
      }

    });

  }

  var getPipelineDetails = function(pipelineId, pipelineName) {
    var pipelineDetailsPath = getGocdPipelineBasePath(pipelineName) + '/' + pipelineId + '.xml';
    logger.debug('Requesting pipeline details', pipelineDetailsPath);
    return requestAndXml2Json(pipelineDetailsPath).then(function(json) {
      if(json.pipeline) {
        return json;
      } else {
        logger.error('unexpected data from pipeline details', url, json);
        return undefined;
      }
    });
  };

  var getHistory = function(offset, pipelineName) {

    var historyPagePath = getGocdHistoryPath(pipelineName) + (offset ? '/' + offset : '');
    logger.debug('Requesting history', historyPagePath);

    return getFromGocd(historyPagePath).then(function (body) {
		return JSON.parse(body);
    });

  };

  var getPipelineNames = function() {
    var pipelinesPath = '/go/api/pipelines.xml';
    logger.debug('Requesting pipeline list', pipelinesPath);

    return requestAndXml2Json(pipelinesPath).then(function (data) {
      data.pipelines.pipeline = [].concat(data.pipelines.pipeline);

      return Q.all(_.map(data.pipelines.pipeline, function(pipeline) {
        return requestAndXml2Json(pipeline.href);
      })).then(function(details) {
        return _.map(details, function(detail) {
            return detail.feed.title;
        });
      });
    });
  };

  return {
    getHistory: getHistory,
    getPipelineDetails: getPipelineDetails,
    getPipelineNames: getPipelineNames
  };
}

var gocdRequestor = gocdRequestorModule();
exports.getHistory = gocdRequestor.getHistory;
exports.getPipelineDetails = gocdRequestor.getPipelineDetails;
exports.getPipelineNames = gocdRequestor.getPipelineNames;

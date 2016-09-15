var Q = require('q');
var request = require('request');
var globalOptions = require('./options');

// View request and response headers and bodies.
require('request').debug = true;

function requestorModule() {

  var getUrl = function(url) {
    console.log('Requesting ', url);
    var defer = Q.defer();

    try {

      var requestOptions = {
        url: url,
        rejectUnauthorized: false,
        auth: globalOptions.authInfo(),
        followRedirect: true,
        followAllRedirects: true,
        removeRefererHeader: true
      };

      request(requestOptions, function (error, response, body) {
        // TODO .auth('username', 'password', false); // https://www.npmjs.com/package/request#http-authentication
        if (error) {
          defer.reject();
        } else {
          defer.resolve(body);
        }
      });
    } catch(error) {
      defer.reject(error);
    }

    return defer.promise;
  };

  return {
    getUrl: getUrl
  };
}

var requestor = requestorModule();
exports.getUrl = requestor.getUrl;

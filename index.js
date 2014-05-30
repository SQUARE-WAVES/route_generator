var url = require('url');
var _ = require('lodash');

var getPathGenerator = require('./lib/pathGenerator');

// return a path generator based on provided schema
module.exports = function (schema) {
	// build path generator
	var gen = getPathGenerator(schema);

	// take any extra parameters on the schema and use them as defaults on the parsed url object
	// TODO is it better to only pick params as defined in node's parsed url object?
	var urlDefaults = _.omit(schema, 'path', 'params');

	var getUrlObject = function (params) {
		var path = gen(params);
		var urlObj = url.parse(path);

		return _.defaults(urlObj, urlDefaults);
	}

	return {
		getUrlObject: getUrlObject,

		format: function (params) {
			var urlObj = getUrlObject(params);
			return url.format(urlObj);
		}
	}
}

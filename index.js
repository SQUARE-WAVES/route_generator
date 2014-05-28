var querystring = require('querystring');
var pdl = require('pdl');
var url = require('url');

var _ = require('lodash');

// return a path generator based on provided schema
var generatorFromSchema = function (schema) {
	var pathData = pdl.compilePath(schema);

	// build path given params
	return function (params) {
		params = params || {};

		var path = [];
		var query = _.clone(params); // copy params, remove them as we see them in the path, append remainder as querystring
		
		pathData.forEach(function (item) {
			if (item.name) {
				var val = params[item.name];

				// remove from query params
				delete query[item.name];

				if (typeof val !== 'undefined') {
					if (item.isSplat) {
						if (_.isString(val)) {
							path.push(encodeURIComponent(val));
						}
						else if (_.isArray(val)) {
							_.each(val, function (v) {
								path.push(encodeURIComponent(v));
							});
						}
						else {
							throw new Error('value provided for splat must be string or array');
						}
					}
					else if (item.matches(val)) {
						path.push(encodeURIComponent(val));
					}
					else {
						throw new Error('value provided for a param is incorrect: ' + item.name + ' : ' + val);
					}
				}
				else if (item.isOptional) {
					//do nothing
				}
				else {
					throw new Error('no value for a required param: ' + item.name);
				}
			}
			else {
				path.push(encodeURIComponent(item.val));
			}
		});

		var u = '/' + path.join('/');

		if (!_.isEmpty(query)) {
			u += '?' + querystring.stringify(query);
		}

		return u;
	}
}

module.exports = function (schema) {
	// build path generator
	var gen = generatorFromSchema(schema);

	return function generate (params) {
		// generate path with params, then parse with url.parse
		return url.parse(gen(params));
	};
}

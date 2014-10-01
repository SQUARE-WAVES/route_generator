var pdl = require('path_description_language');
var querystring = require('querystring');
var _ = require('lodash');

// given a schema, return a function which can generate a path string
var getPathGenerator = function (schema) {
    var pathData = pdl.compilePath(schema);

    // build path string given params
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
            // TODO verify if present in schema.params
            u += '?' + querystring.stringify(query);
        }

        return u;
    }
};

module.exports = getPathGenerator;
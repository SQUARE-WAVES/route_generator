var pdl = require('path_description_language');
var _ = require('lodash');
var url = require('url');

var getPathParamNames = function(pathData){
	return _.transform(pathData,function(response,token,key){
		if(token.name){
			response.push(token.name);
		}
	});
}

var createQueryParamData = function(paramDescriptions,matchers){
	return _.transform(paramDescriptions,function(result,val,key){
		var matcherKey = _.keys(val)[0];

		if(_.isUndefined(matcherKey)){
			matcherKey = "whatever";
		}

		var matcherFactory = matchers[matcherKey];

		if(_.isUndefined(matcherFactory)){
			throw new Error("undefined matcher for query parameter: " + key);
		}
		else{
			result[key] = {
				'matches':matcherFactory(val[matcherKey])
			}
			return result;
		}
	});
}

var tokenHandlers = {
	'value':function(token,index,params,result){
		result.push(encodeURIComponent(token.val));
		return result;
	},

	'param':function(token,index,params,result){
		var param = params[token.name];

		if(_.isUndefined(param)){
			if(token.isOptional){
				return result;
			}
			else{
				throw new Error("no value for required path parameter: " + token.name);
			}
		}
		else{
			if(token.matches(param)){
				result.push(encodeURIComponent(param));
			}
			else{
				throw new Error("invalid value ("+param+") for path parameter: "+token.name);
			}
			
		}

		return result;
	},

	'splat':function(token,index,params,result){
		var param = params[token.name];

		if(_.isUndefined(param)){
			if(token.isOptional){
				return result;
			}
			else{
				throw new Error("no value for required path parameter: " + token.name);
			}
		}
		else {
			if (_.isString(param)) {

				_.each(param.split('/'), function (value) {
					result.push(encodeURIComponent(value));
				});
			}
			else if (_.isArray(param)) {

				_.each(param, function (value) {
					result.push(encodeURIComponent(value));
				});
			}
			else {
				throw new Error('value provided for splat must be string or array');
			}
		}

		return result;
	}
}

var getTokenHandler = function(token,index){
	var handler = tokenHandlers[token.type];
	if(_.isUndefined(handler)){
		throw new Error("invalid token type: " + token.type + "at path token: " + index)
	}

	return handler
}

var generatePath = function(pathData,pathParams){
	var params = pathParams || {};

	var pathTokens = _.transform(pathData,function(result,token,index){
		var tokenHandler = getTokenHandler(token,index);
		return tokenHandler(token,index,params,result);
	});

	return '/' + pathTokens.join('/');
}

var generateQueryStrict = function(queryData,queryParameters){
	return _.transform(queryParameters,function(result,val,key){
		var qData = queryData[key];
		
		if(!_.isUndefined(qData)){
			if(qData.matches(val)){
				result[key] = val;
			}
			else{
				throw new Error("invalid value ("+val+")for query parameter: " + key);
			}
		}
		else{
			throw new Error("invalid query parameter: " + key);
		}
	});
}

var generateQueryInclusive = function(queryData,queryParameters){
	return _.transform(queryParameters,function(result,val,key){
		var qData = queryData[key];
		
		if(!_.isUndefined(qData)){
			if(qData.matches(val)){
				result[key] = val;
			}
			else{
				throw new Error("invalid value ("+val+")for query parameter: " + key);
			}
		}
		else{
			result[key] = val;
		}
	});
}

var generateQuery = function(queryData,pathParameterNames,params,isStrict){
	var queryParameters = _.omit(params,pathParameterNames);

	if(isStrict){
		return generateQueryStrict(queryData,queryParameters);
	}
	else{
		return generateQueryInclusive(queryData,queryParameters);
	}
}

module.exports = function(schema){

	var pathData = pdl.compilePath(schema.pathDescription);
	var pathParameterNames = getPathParamNames(pathData);
	var queryParamData;
	var strict;

	if( schema.queryDescription ){
		queryParamData = createQueryParamData(schema.queryDescription.params,pdl.matchers);
		strict = schema.query.isStrict;
	}
	else{
		queryParamData = {};
		strict = false;
	}
	 
	var createUrlObject = function(params){
		var urlObject = _.pick(schema,['protocol','method','hostname','port','hash']);
		var defaultQuery = schema.query || {};
		urlObject.pathname = generatePath(pathData,params);
		urlObject.query = _.merge(defaultQuery,generateQuery(queryParamData,pathParameterNames,params,strict));
		return urlObject;
	}

	return {
		'format':function(params){
			return url.format(createUrlObject(params));
		},
		'generate':function(params){
			return createUrlObject(params);
		}
	}
}
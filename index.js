var helpers = require('pdl');

var generatorFromSchema = function(schema){
	var pathData = helpers.createPathData(schema);

	return function(params){
		var path = [];

		pathData.forEach(function(item){
			if(item.name){
				var val = params[item.name];

				if(typeof(val) !== 'undefined'){
					if(item.isSplat || item.matches(val)){
						path.push(val);
					}
					else{
						throw new Error('value provided for a param is incorrect: ' + item.name + ' : ' + val)
					}
				}
				else if(item.isOptional){
						//do nothing
					}
				else {
					throw new Error('no value for a required param: ' + item.name);
				}
			}
			else{
				path.push(item.val);
			}
		});

		return '/' + path.join('/');
	}
}

module.exports = generatorFromSchema;
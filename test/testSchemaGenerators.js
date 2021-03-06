var assert = require('assert');
var url = require('url');
var createGenerator = require('../lib/createGenerator.js');
var _ = require('lodash');

// returns a function which executes a generator when called. necessary for use with assert.throws
var runGenerator = function(gen, params){
	return function(){
		gen.format(params);
	}
}

var getParameterizedSchema = function () {
	return {
		'pathDescription':{
			'path':'/dogs/:cats'
		} 
	};
}

suite('test the schema generators', function () {

	test('unparameterized route', function () {
		var schema = {
			'pathDescription': '/dogs/cats/bears'
		}

		var gen = createGenerator(schema);

		assert.equal(gen.format(), schema.pathDescription, 'the schema should match the path it was generated with');
	});

	test('parameterized route with implied path param', function () {
		var schema = {
			'pathDescription': '/dogs/cats/:animal'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'animal': 'pig'}), '/dogs/cats/pig');

		assert.throws(runGenerator(gen));
	});

	test('parameterized route with implied optional path param', function () {
		var schema = {
			'pathDescription': '/dogs/cats/:animal?'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({animal: 'pig'}), '/dogs/cats/pig');
		assert.equal(gen.format({}), '/dogs/cats', 'passing in empty params when params are optional should work');
		assert.equal(gen.format(), '/dogs/cats', 'passing in no params when params are optional should work');
	});

	test('parameterized route with implied and implied optional path params', function () {
		var schema = {
			'pathDescription': '/dogs/cats/:animal/:manimal?'
		};

		var gen = createGenerator(schema);

		assert.equal(url.format(gen.format({'animal': 'pigs'})), '/dogs/cats/pigs');
		assert.equal(url.format(gen.format({'animal': 'pigs', 'manimal': 'centaurs'})), '/dogs/cats/pigs/centaurs');
		
		assert.throws(runGenerator(gen));
		assert.throws(runGenerator(gen, {}));
		assert.throws(runGenerator(gen, {manimal: 'centaurs'}));
	});

	test('parameterized route with implied splat', function () {
		var schema = {
			'pathDescription': '/hello/*superdogs'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'superdogs': ['beautiful','animals']}), '/hello/beautiful/animals');
		assert.equal(gen.format({'superdogs': 'animals'}), '/hello/animals');
		assert.throws(runGenerator(gen), 'should fail when splat is required and missing');
	});

	test('parameterized route with implied optional splat', function () {
		var schema = {
			'pathDescription': '/hello/*superdogs?'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'superdogs': ['beautiful', 'animals']}), '/hello/beautiful/animals');
		assert.equal(gen.format({'superdogs': 'animals'}), '/hello/animals');
		assert.equal(gen.format(), '/hello', 'optional splat is optional');
	});

	test('parameterized route without options', function () {
		var schema = {
			'pathDescription': {
				'path':'/hello/:name',
				'params': {
					'name': {
						'values': [
							'charles',
							'barnabus'
						]
					}
				}
			}
		};
		
		var gen = createGenerator(schema);

		assert.equal(gen.format({'name':'charles'}), '/hello/charles', 'the schema should match a correct instance');
		assert.throws(runGenerator(gen, {'name':'horsemeat'}), /invalid value \(horsemeat\) for path parameter: name/ , 'an incorrect param should throw');
		assert.throws(runGenerator(gen, {'zzz':'horsemeat'}), /no value for required path parameter: name/, 'a missing param should throw');
	});

	test('parameterized route with optional component', function () {
		var schema = {
			'pathDescription':{
				'path': '/hello/:title?',
				'params': {
					'title': {
						'regex': '[a-z]+'
					}
				}
			}
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'title':'doctor'}), '/hello/doctor', 'generator should work with optional params filled in');
		assert.equal(gen.format({}), '/hello', 'generator should work without optional params filled in');
		assert.equal(gen.format(), '/hello', 'generator should work without optional params filled in');

		assert.throws(runGenerator(gen, {'title':'5555','name':'barnabus'}), /invalid value \(5555\) for path parameter: title/, 'an incorrect optional param should throw');
	});

	test('parameterized route with optional and required components', function () {
		var schema = {
			'pathDescription':{
				'path': '/hello/:title?/:name',
				'params': {
					'name': {
						'values': [
							'charles',
							'barnabus'
						]
					},
					'title': {
						'regex': '[a-z]+'
					}
				}
			}
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'title':'doctor', 'name':'barnabus'}), '/hello/doctor/barnabus', 'generator should work with optional params filled in');
		assert.equal(gen.format({'name':'charles'}), '/hello/charles', 'generator should work without optional params filled in');

		assert.throws(runGenerator(gen, {'title':'5555','name':'barnabus'}), /invalid value \(5555\) for path parameter: title/, 'an incorrect optional param should throw');
	});

	test('parameterized route with required splat', function () {
		var schema = {
			'pathDescription':{
				'path': '/hello/:name/*extra',
				'params': {
					'name': {
						'values': [
							'charles',
							'barnabus'
						]
					}
				}
			}
		};

		var gen = createGenerator(schema);
		
		assert.equal(gen.format({'name':'charles','extra':['a','b','c','d']}), '/hello/charles/a/b/c/d', 'the gen should work with splat included');
		assert.throws(runGenerator(gen, {'name':'barnabus'}), /no value for required path parameter: extra/, 'a missing splat param should throw');
	});

	test('parameterized route with optional splat', function () {
		var schema = {
			'pathDescription':{
				'path': '/hello/:name/*extra?',
				'params': {
					'name': {
						'values': [
							'charles',
							'barnabus'
						]
					}
				}
			}
		};

		var gen = createGenerator(schema);
		
		assert.equal(gen.format({'name':'charles','extra':['a','b','c','d']}), '/hello/charles/a/b/c/d', 'the gen should work with splat included');
		assert.equal(gen.format({'name':'barnabus'}), '/hello/barnabus', 'a missing optional splat is fine');
	})

	test('splats accept empty string if matching behavior unspecified', function () {
		var schema = {
			'pathDescription': '/test/*splat'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'splat': ''}), '/test/');
		assert.throws(runGenerator(gen), 'should not accept empty argument for required splat');
	});

	test('extra params are added to the query string', function () {
		var schema = {
			'pathDescription': '/test'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'stuff': 'things'}), '/test?stuff=things');
		assert.equal(gen.format({'stuff': 'things', 'things': 'stuff'}), '/test?stuff=things&things=stuff');
	});
});
	
suite('generated urls are http safe', function () {

	test('no params', function () {
		var schema = {
			'pathDescription': '/some crazy shit'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format(), '/some%20crazy%20shit');
	});

	test('path params', function () {
		var schema = {
			'pathDescription': '/dogs/:cats'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'cats': 'dumb@cats.dogs'}), '/dogs/dumb%40cats.dogs');
	});

	test('splats', function () {
		var schema = {
			'pathDescription': '/dogs/*cats'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({cats: 'single/chunk'}), '/dogs/single/chunk', 'single params should be http escaped');
		assert.equal(gen.format({cats: ['dou?ble', 'ch?unk']}), '/dogs/dou%3Fble/ch%3Funk', 'double params should be http escaped and joined by /');
	});

	test('query string params', function () {
		var schema = {
			'pathDescription': '/dogs'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({cats: 'dumb@cats.dogs'}), '/dogs?cats=dumb%40cats.dogs');
		assert.equal(gen.format({'sneaky$cats': 'dumb@cats.dogs'}), '/dogs?sneaky%24cats=dumb%40cats.dogs');
	});
});

suite('error conditions', function () {

	test('path param does not match regex', function () {
		var schema = getParameterizedSchema();
		schema.pathDescription.params = {
			'cats': {
				'regex': '\\d\\d\\d\\d\\d'
			}
		};

		var gen = createGenerator(schema);

		assert.doesNotThrow(runGenerator(gen, {'cats': '12345'}));
		assert.throws(runGenerator(gen, {'cats': 1}));
	});

	test('path param does not match values', function () {
		var schema = getParameterizedSchema();
		schema.pathDescription.params = {
			'cats': {
				'values': ['garfield', 'turbo', 'cat stevens']
			}
		};

		var gen = createGenerator(schema);

		assert.doesNotThrow(runGenerator(gen, {'cats': 'garfield'}));
		assert.throws(runGenerator(gen, {'cats': 'hodor'}));
	});
	
	test('querystring param does not match regex',function(){
		var schema = {
			'pathDescription':{
				'path':'/dogs/:cats',
				'params':{
					'cats': {
						'regex': "[a-z]+"
					}
				}
			}
		}

		var gen = createGenerator(schema);

		assert.doesNotThrow(runGenerator(gen,{'cats':'hodor'}));
		assert.throws(runGenerator(gen,{'cats':'666'}));
	})
});

suite('absolute urls can be generated', function () {
	
	var simpleSchema = {
		'pathDescription':{
			'path':'/dogs',
		}, 
		'protocol': 'http:',
		'hostname': 'dogs.com',
		'port': '1234',
		'query': {
			'cats': 'sure',
			'mice': 'whynot',
			'test':'west'
		},
		'hash': 'supercats'
	};

	var parameterizedSchema = _.cloneDeep(simpleSchema);
	parameterizedSchema.pathDescription = '/dogs/:id';

	var splatSchema = _.cloneDeep(simpleSchema);
	splatSchema.pathDescription = '/dogs/*stuff';

	test('url object contains defaults', function () {
		var gen = createGenerator(simpleSchema);
		var urlObj = gen.generate();

		assert.equal(urlObj.pathname, '/dogs');
		assert.equal(urlObj.protocol, simpleSchema.protocol);
		assert.equal(urlObj.hostname, simpleSchema.hostname);
		assert.equal(urlObj.port, simpleSchema.port);
		assert.deepEqual(urlObj.query, simpleSchema.query);
		assert.equal(urlObj.hash, simpleSchema.hash);
	});

	test('formatted url contains defaults', function () {
		var gen = createGenerator(simpleSchema);
		assert.equal(gen.format(), 'http://dogs.com:1234/dogs?cats=sure&mice=whynot&test=west#supercats');
	});

	test('query params merge into default query', function () {
		var gen = createGenerator(simpleSchema);

		assert.equal(gen.format({'test': 'test'}), 'http://dogs.com:1234/dogs?cats=sure&mice=whynot&test=test#supercats');
	});

	test('parameterized paths work', function () {
		var gen = createGenerator(parameterizedSchema);

		assert.equal(gen.format({'id': '1'}), 'http://dogs.com:1234/dogs/1?cats=sure&mice=whynot&test=west#supercats');
	});

	test('splat paths work', function () {
		var gen = createGenerator(splatSchema);

		assert.equal(gen.format({stuff: ['things','stuff']}), 'http://dogs.com:1234/dogs/things/stuff?cats=sure&mice=whynot&test=west#supercats')
	});
});


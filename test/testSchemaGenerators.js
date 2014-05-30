var assert = require('assert');
var url = require('url');
var createGenerator = require('../index.js');

// returns a function which executes a generator when called. necessary for use with assert.throws
var runGenerator = function(gen, params){
	return function(){
		gen.format(params);
	}
}

suite('test the schema generators', function () {
	test('unparameterized route', function () {
		var schema = {
			'path': '/dogs/cats/bears'
		}

		var gen = createGenerator(schema);

		assert.equal(gen.format(), schema.path, 'the schema should match the path it was generated with');
	});

	test('parameterized route with implied path param', function () {
		var schema = {
			'path': '/dogs/cats/:animal'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({animal: 'pig'}), '/dogs/cats/pig');

		assert.throws(runGenerator(gen));
	});

	test('parameterized route with implied optional path param', function () {
		var schema = {
			'path': '/dogs/cats/:animal?'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({animal: 'pig'}), '/dogs/cats/pig');
		assert.equal(gen.format({}), '/dogs/cats', 'passing in empty params when params are optional should work');
		assert.equal(gen.format(), '/dogs/cats', 'passing in no params when params are optional should work');
	});

	test('parameterized route with implied and implied optional path params', function () {
		var schema = {
			'path': '/dogs/cats/:animal/:manimal?'
		};

		var gen = createGenerator(schema);

		assert.equal(url.format(gen.format({animal: 'pigs'})), '/dogs/cats/pigs');
		assert.equal(url.format(gen.format({animal: 'pigs', manimal: 'centaurs'})), '/dogs/cats/pigs/centaurs');
		
		assert.throws(runGenerator(gen));
		assert.throws(runGenerator(gen, {}));
		assert.throws(runGenerator(gen, {manimal: 'centaurs'}));
	});

	test('parameterized route with implied splat', function () {
		var schema = {
			'path': '/hello/*superdogs'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({superdogs: ['beautiful','animals']}), '/hello/beautiful/animals');
		assert.equal(gen.format({superdogs: 'animals'}), '/hello/animals');
		assert.throws(runGenerator(gen), 'should fail when splat is required and missing');
	});

	test('parameterized route with implied optional splat', function () {
		var schema = {
			'path': '/hello/*superdogs?'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({superdogs: ['beautiful', 'animals']}), '/hello/beautiful/animals');
		assert.equal(gen.format({superdogs: 'animals'}), '/hello/animals');
		assert.equal(gen.format(), '/hello', 'optional splat is optional');
	});

	test('parameterized route without options', function () {
		var schema = {
			'path': '/hello/:name',
			'params': {
				'name': {
					'values': [
						'charles',
						'barnabus'
					]
				}
			}
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'name':'charles'}), '/hello/charles', 'the schema should match a correct instance');
		assert.throws(runGenerator(gen, {'name':'horsemeat'}), /value provided for a param is incorrect: name : horsemeat/ , 'an incorrect param should throw');
		assert.throws(runGenerator(gen, {'zzz':'horsemeat'}), /no value for a required param: name/, 'a missing param should throw');
	});

	test('parameterized route with optional component', function () {
		var schema = {
			'path': '/hello/:title?',
			'params': {
				'title': {
					'regex': '[a-z]+'
				}
			}
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'title':'doctor'}), '/hello/doctor', 'generator should work with optional params filled in');
		assert.equal(gen.format({}), '/hello', 'generator should work without optional params filled in');
		assert.equal(gen.format(), '/hello', 'generator should work without optional params filled in');

		assert.throws(runGenerator(gen, {'title':'5555','name':'barnabus'}), /value provided for a param is incorrect: title : 5555/, 'an incorrect optional param should throw');
	});

	test('parameterized route with optional and required components', function () {
		var schema = {
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
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({'title':'doctor', 'name':'barnabus'}), '/hello/doctor/barnabus', 'generator should work with optional params filled in');
		assert.equal(gen.format({'name':'charles'}), '/hello/charles', 'generator should work without optional params filled in');

		assert.throws(runGenerator(gen, {'title':'5555','name':'barnabus'}), /value provided for a param is incorrect: title : 5555/, 'an incorrect optional param should throw');
	});


	test('parameterized route with required splat', function () {
		var schema = {
			'path': '/hello/:name/*extra',
			'params': {
				'name': {
					'values': [
						'charles',
						'barnabus'
					]
				}
			}
		};

		var gen = createGenerator(schema);
		
		assert.equal(gen.format({'name':'charles','extra':['a','b','c','d']}), '/hello/charles/a/b/c/d', 'the gen should work with splat included');
		assert.throws(runGenerator(gen, {'name':'barnabus'}), /no value for a required param: extra/, 'a missing splat param should throw');
	});

	test('parameterized route with optional splat', function () {
		var schema = {
			'path': '/hello/:name/*extra?',
			'params': {
				'name': {
					'values': [
						'charles',
						'barnabus'
					]
				}
			}
		};

		var gen = createGenerator(schema);
		
		assert.equal(gen.format({'name':'charles','extra':['a','b','c','d']}), '/hello/charles/a/b/c/d', 'the gen should work with splat included');
		assert.equal(gen.format({'name':'barnabus'}), '/hello/barnabus', 'a missing optional splat is fine');
	})

	test('splats accept empty string if matching behavior unspecified', function () {
		var schema = {
			'path': '/test/*splat'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({splat: ''}), '/test/');
		assert.throws(runGenerator(gen), 'should not accept empty argument for required splat');
	});

	test('extra params are added to the query string', function () {
		var schema = {
			'path': '/test'
		};

		var gen = createGenerator(schema);

		assert.equal(gen.format({stuff: 'things'}), '/test?stuff=things');
		assert.equal(gen.format({stuff: 'things', things: 'stuff'}), '/test?stuff=things&things=stuff');
	});

	suite('generated urls are http safe', function () {
		test('no params', function () {
			var schema = {
				'path': '/some crazy shit'
			};

			var gen = createGenerator(schema);

			assert.equal(gen.format(), '/some%20crazy%20shit');
		});

		test('path params', function () {
			var schema = {
				'path': '/dogs/:cats'
			};

			var gen = createGenerator(schema);

			assert.equal(gen.format({cats: 'dumb@cats.dogs'}), '/dogs/dumb%40cats.dogs');
		});

		test('splats', function () {
			var schema = {
				'path': '/dogs/*cats'
			};

			var gen = createGenerator(schema);

			assert.equal(gen.format({cats: 'single/chunk'}), '/dogs/single%2Fchunk', 'single params should be http escaped');
			assert.equal(gen.format({cats: ['dou?ble', 'ch?unk']}), '/dogs/dou%3Fble/ch%3Funk', 'double params should be http escaped and joined by /');
		});

		test('query string params', function () {
			var schema = {
				'path': '/dogs'
			};

			var gen = createGenerator(schema);

			assert.equal(gen.format({cats: 'dumb@cats.dogs'}), '/dogs?cats=dumb%40cats.dogs');
			assert.equal(gen.format({'sneaky$cats': 'dumb@cats.dogs'}), '/dogs?sneaky%24cats=dumb%40cats.dogs');
		});
	});
});

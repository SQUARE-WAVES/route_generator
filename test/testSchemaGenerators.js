var assert = require('assert');
var url = require('url');
var createGenerator = require('../index.js');

// returns a function which executes a generator when called. necessary for use with assert.throws
var runGenerator = function(gen, params){
	return function(){
		url.format(gen(params));
	}
}

suite('test the schema generators', function () {
	test('unparameterized route', function () {
		var schema = {
			'path': '/dogs/cats/bears'
		}

		var gen = createGenerator(schema);

		assert.equal(url.format(gen()), schema.path, 'the schema should match the path it was generated with');
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

		assert.equal(url.format(gen({'name':'charles'})), '/hello/charles', 'the schema should match a correct instance');
		assert.throws(runGenerator(gen, {'name':'horsemeat'}), /value provided for a param is incorrect: name : horsemeat/ , 'an incorrect param should throw');
		assert.throws(runGenerator(gen, {'zzz':'horsemeat'}), /no value for a required param: name/, 'a missing param should throw');
	});

	test('parameterized route with optional components', function () {
		var schema = {
			'path': '/hello/:title?/:name',
			'params': {
				'name': {
					'type': 'path',
					'values': [
						'charles',
						'barnabus'
					]
				},
				'title': {
					'type': 'path',
					'regex': '[a-z]+'
				}
			}
		};

		var gen = createGenerator(schema);

		assert.equal(url.format(gen({'title':'doctor', 'name':'barnabus'})), '/hello/doctor/barnabus', 'generator should work with optional params filled in');
		assert.equal(url.format(gen({'name':'charles'})), '/hello/charles', 'generator should work without optional params filled in');

		assert.throws(runGenerator(gen, {'title':'5555','name':'barnabus'}), /value provided for a param is incorrect: title : 5555/, 'an incorrect optional param should throw');
	});

	test('parameterized route with required splat', function () {
		var schema = {
			'path': '/hello/:name/*extra',
			'params': {
				'name': {
					'type': 'path',
					'values': [
						'charles',
						'barnabus'
					]
				}
			}
		};

		var gen = createGenerator(schema);
		
		assert.equal('/hello/charles/a/b/c/d', url.format(gen({'name':'charles','extra':'a/b/c/d'})), 'the gen should work with splat included');
		assert.throws(runGenerator(gen, {'name':'barnabus'}), /no value for a required param: extra/, 'a missing splat param should throw');
	});

	test('parameterized route with optional splat', function () {
		var schema = {
			'path': '/hello/:name/*extra?',
			'params': {
				'name': {
					'type': 'path',
					'values': [
						'charles',
						'barnabus'
					]
				}
			}
		};

		var gen = createGenerator(schema);
		
		assert.equal('/hello/charles/a/b/c/d', url.format(gen({'name':'charles','extra':'a/b/c/d'})), 'the gen should work with splat included');
		assert.equal('/hello/barnabus', url.format(gen({'name':'barnabus'})), 'a missing optional splat is fine');
	})
});
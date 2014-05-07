var assert = require('assert');
var createGenerator = require('../index.js');

suite('test the schema generators',function(){

	test('unparameterized route', function (done)  {
		var schema = {
			'path':'/dogs/cats/bears'
		}

		var gen = createGenerator(schema);

		assert.equal(schema.path,gen(),'the schema should match the path it was generated with');
		done();
	});

	test('parameterized route without options',function(done){

		var schema = {
			'path':'/hello/:name',
			'params':{
				'name':{
					'type':'path',
					'values':[
						'charles',
						'barnabus'
					]
				}
			}
		};

		var gen = createGenerator(schema);
		var runGen = function(params){
			return function(){
				gen(params)
			}
		}

		assert.equal('/hello/charles',gen({'name':'charles'}),'the schema should match a correct instance');
		assert.throws(runGen({'name':'horsemeat'}), /value provided for a param is incorrect: name : horsemeat/, 'an incorrect param should throw');
		assert.throws(runGen({'zzz':'horsemeat'}),/no value for a required param: name/, 'a missing param should throw');

		done();
	});

	test('parameterized route with options',function(done){
		var schema = {
			'path':'/hello/:title?/:name',
			'params':{
				'name':{
					'type':'path',
					'values':[
						'charles',
						'barnabus'
					]
				},
				'title':{
					'type':'path',
					'regex':'[a-z]+'
				}
			}
		};

		var gen = createGenerator(schema);
		var runGen = function(params){
			return function(){
				gen(params)
			}
		}

		assert.equal('/hello/doctor/barnabus',gen({'title':'doctor','name':'barnabus'}),'generator should work with optional params filled in');
		assert.equal('/hello/charles',gen({'name':'charles'}),'generator should work without optional params filled in');

		assert.throws(runGen({'title':'5555','name':'barnabus'}),/value provided for a param is incorrect: title : 5555/, 'an incorrect optional param should throw');

		done();
	});

	test('parameterized route with splat',function(done){
		var schema = {
			'path':'/hello/:name/+extra',
			'params':{
				'name':{
					'type':'path',
					'values':[
						'charles',
						'barnabus'
					]
				},
				'title':{
					'type':'path',
					'regex':'\\w+'
				}
			}
		};

		var gen = createGenerator(schema);
		var runGen = function(params){
			return function(){
				gen(params)
			}
		}

		assert.equal('/hello/charles/a/b/c/d',gen({'name':'charles','extra':'a/b/c/d'}),'the gen should work with splat included');
		assert.throws(runGen({'name':'barnabus'}),/no value for a required param: extra/, 'a missing splat param should throw');

		done();
	});
});
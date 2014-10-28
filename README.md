WARPATH
=======

Generate your own urls with this general of PATH WARFARE, BANG POW URLS ALL GENERATED ALL OVER THE PLACE ACCORDING TO SCHEMAS

#Hey what's the big idea here?

the idea here is to make a website that takes some routes, then generate a manifest with descriptions of those routes and then websites use that manifest to ask for data. That way when/if the site changes it's routes you don't have to change the consumer. Kinda like WSDL.

#Ok but what's up with the name?
THIS IS JAVASCRIPT BABY WE NAME STUFF ALL KINDS OF CRAZY.

#Alright I'll bite, how does this work?

you start with a schema that looks like this:

```javascript
var schema = {
	'protocol':'http:',
	'hostname':'dogzone.com',
	'port':8080,
	'pathDescription':{
		'path':'/dogs/:breed',
		'params':{
			'breed':{
				'values':['corgi','borzoi','pitbull','dracula hound']
			}
		}
	}, 
	'queryDescription': {
		'isStrict':false,
		'params':{
			'spayed':{
				'values':[true,false]
			},
			'name':{
				'regex':'\\w+'
			}
		}
	}
}
```

it's a description of a url, with 2 parts given parameterizable descritpions, the path and the query, you would take a schema like that and do some code like this:

```javascript
var createGenerator = require("warpath");

var gen = createGenerator(schema);

//returns a url object, like the ones usable with node's builtin url library
var urlObject = gen.generate({
	"breed":"borzoi",
	"spayed":true
});

//returns a string 
var someOtherUrlString = gen.format({
	"breed":"corgi",
	"name":"bargus"
});

```

#So what's up with the path descriptions?

the path descriptions work based on the rules in [this package](https://www.npmjs.org/package/path_description_language). They can either be a path string, with no parameter specs, or you can include parameter specifications. All 3 of the following are valid path descriptions

```javascript
var s1 = {
	"pathDescription":"/dogs/:breed/:name?"
};

var s2 = {
	"pathDescription":{
		"path":"/static/:type/*path"
	}
}

var s3 = {
	"pathDescription":{
		"path":"/static/:type/*path"
		"params":{
			"type":{
				"values":["html","js","css"]
			}
		}
	}
}


```

#And what's up with the query descriptions?

the query descriptions work like the path descriptions but without the path and with a strict mode parameter, kinda like this:

```javascript
var schema = {
	"queryDescription":{
		"isStrict":true,
		"params":{
			"horses":{
				"values":[true,false]
			},
			"count":{
				"regex":"\\d+"
			}
		}
	}
}
```
strict mode defaults to false, and if you want a parameter that matches anyting you can just not include a matcher key in the param data, like so:

```javascript
var schema2 = {
	"queryDescription":{
		"isStrict":true,
		"params":{
			"horses":{
				"values":[true,false]
			},
			"count":{}
		}
	}
}
```

#what is strict mode?

If a query description specifies strict mode, then it means that only parameters included in the params list can be entered, anything else will cause an exception. For example, if you were to use the first schema up above like so

```javascript
var gen = createGenerator(schema);

gen.format({"horses":true,"count":55,"with-cheese":false});
```

you would get an excpetion telling you that "with-cheese" isn't a valid query parameter.

#anything else I should know?

right now query parameters are always optional, you are never required to give them. as well. URLS are automatically url-escaped, but no other escaping is done.



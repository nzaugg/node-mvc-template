/**
 * Module dependencies.
 */

var express = require('express')
	, bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')
	, methodOverride = require('method-override')
	, session = require('express-session')
	, favicon = require('static-favicon')
	, serveStatic = require('serve-static')
	, morgan = require('morgan')

	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, fs = require('fs');


exports.boot = function(params)
{
	var app = express();
	
	BootApplication(app);
	BootModels(app);
	BootControllers(app);

	return app;
}

function RenderPage(path, options, fn)
{
	locals.DebugLog(path);
	var key = path + ':string';
	if(typeof options == 'function')
	{
		fn = options;
		options = {};
	}

	try
	{
		var str = options.cache
					? exports.cache[key] || (exports.cache[key] = fs.readFileSync(path, 'utf8'))
					: fs.readFileSync(path, 'utf8');
		fn(null, str);
	}
	catch (err)
	{
		console.log("couldn't render page " + path);
		fn(err);
	}
}

// Setup any server configurations
function BootApplication(app)
{
	// all environments
	app.set('port', process.env.PORT || 3000);
	app.use(serveStatic(path.join(__dirname, 'public')));

	app.set('views', __dirname + '/Views');
	app.set('view engine', 'html');
	app.engine('html', RenderPage);

	app.use(favicon(__dirname + '/public/favicon.ico'));
	app.use(morgan());
	app.use(bodyParser());
	app.use(methodOverride());

	app.use(cookieParser('my secret string'));
	app.use(session({ secret: 'my secret key', key: 'chocolatechip', cookie: { secure: true }}));

	if(app.get('env') == 'development')
	{
		app.set('db-uri', 'mongodb://localhost/MyApp-dev');
	}
	else if(app.get('env') == 'production')
	{
		app.set('db-uri', 'mongodb://localhost/MyApp');
	}
	else if(app.get('env') == 'testing')
	{
		app.set('db-uri', 'mongodb://localhost/MyApp-test');
	}

	global.locals = { };

	if('production' == app.get('env'))
	{
		global.locals.DebugLog = function() { };
	}
	else
	{
		global.locals.DebugLog = function (str)
		{
			if(arguments.caller)
				str = arguments.caller + " says: " + str;

			console.log(str);
		}
	}
}

// Load the controllers into the routing domain
function BootControllers(app)
{
	// routing
	require(__dirname + '/Controllers/AppController')(app);
}

// Load the models into the mongoose framework
function BootModels(app)
{
	fs.readdir(__dirname + '/Schemas', function(err, files)
	{
		if(err)
			throw err;

		files.forEach(function(file)
		{
			var name = file.replace(".js", ""),
				schema = require(__dirname + "/Schemas/" + name);
			mongoose.model(name, schema);
		});
	});

	mongoose.connect(app.get('db-uri'));
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function()
	{

	});
}

var app = exports.boot();
var server = http.createServer(app);
server.listen(app.get('port'), function(){
	console.log('Express server listening on port %d.', app.get('port'));
});

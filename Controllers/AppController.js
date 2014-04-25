var fs = require('fs');

module.exports = function(app)
{
	app.get("/:controller?", router);
	app.get("/Views/:action.:format", router);
	app.get("/:controller/:from-:to.:format?", router);

	app.post("/:controller", router);
	app.del("/:controller", router);

	app.get("/:controller/:action/:id?", router);
	app.post("/:controller/:action/:id?", router);
	app.put("/:controller/:action/:id?", router);
	app.del("/:controller/:action/:id?", router);
}

function router(req, res, next)
{
	var controller = req.params.controller ? req.params.controller : '';
	var action = req.params.action ? req.params.action : '';
	var id = req.params.id ? req.params.id : '';
	var method = req.method.toLowerCase();

	locals.DebugLog('Controller: ' + (controller || '"NO CONTROLLER"') + '\n' +
		'Action: ' + (action || '"NO ACTION"') + '\n' +
		'Id: ' + (id || '"NO ID"') + '\n' +
		'Method: ' + (method || '"NO METHOD"'));

	// set the default action
	var fn = 'Index';

	// default route
	if(controller.length == 0)
	{
		// Change to different controller if a different default is desired
		controller = "Home";
	}

	if(controller == "public")
	{
		console.log("Sending file");
		res.sendfile(__dirname + req.path);
		return;
	}

	if(action.length == 0)
	{
		switch(method)
		{
			case 'get':
				fn = 'Index';
				break;
			case 'post':
				fn = 'Create';
				break;
			case 'delete':
				fn = 'DestroyAll';
				break;
		}
	}
	else
	{
		switch(method)
		{
			case 'get':
				if(isNaN(action))
					fn = action;
				else
					fn = 'Show';
				break;
			case 'put':
				fn = 'Edit';
				break;
			case 'delete':
				fn = 'Destroy';
				break;
		}
	}

	fn = Capitalize(fn);
	locals.DebugLog("FN: " + fn);
	var controllerPath = './' + Capitalize(controller) + 'Controller';
	locals.DebugLog('Looking up ' + controllerPath + ' for ' + fn);
	try
	{
		var controllerLibrary = require(controllerPath);
		if(typeof controllerLibrary[fn] === 'function')
			controllerLibrary[fn](req, res, next);
		else
			res.render('404');
	}
	catch (ex)
	{
		console.log(ex);
		res.render('404');
	}
}

function Capitalize(str)
{
	if(str == null || str == undefined)
		return str + "";

	if(!str.substr || !str.trim || str.trim().length <= 0)
		return str + "";

	return str.substr(0, 1).toUpperCase() + str.substr(1);
}

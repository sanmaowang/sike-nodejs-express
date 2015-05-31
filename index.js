module.exports = myexpress;

var http = require("http");
var Layer = require("./lib/layer");
var Route = require('./lib/route');
var inject = require('./lib/injector');
var methods = require("methods");

var request = require('./lib/request');
var response = require('./lib/response');


function myexpress(){
  var app = function(req, res, next){
    app.monkey_patch(req,res);
    if(next){
        var parentApp = req.app;
        req.app = app;
        app.handle(req, res, function(err) {
            req.app = parentApp;
            next(err);
        });
    } else {
        req.app = app;
        app.handle(req, res, next);
    }
  }

	app.handle = function(req, res, next2) {
    var i = 0;

    req.params = {};

    function next(err) {
        if (i >= app.stack.length) {
          if (next2) {
            next2(err);
          } else {
            if(err){
              res.statusCode = err.statusCode || 500;
            }else{
              res.statusCode = 404;
            }
            res.end();          
          }
        } else {
          var layer = app.stack[i];
          var m = layer.handle;
          i++;

          if(layer.match(req.url)){
            req.params = layer.match(req.url).params;
            if(layer.isSubapp && req.url != layer.path){
              req.url = req.url.replace(layer.path,"");
            }
            try{
              if(err && m.length == 4){
                m(err, req, res, next);
                return;
              }else if(!err && m.length != 4){
                m(req, res, next);
                return;
              }
            }catch(ex){
              err = ex;
            }
          }
          next(err);
        }

    }

    next();
  };

	app.stack = [];

	app.use = function(m){
    var url;
    if(typeof arguments[0] !== "string"){
      url = '/';
    }else{
      url = arguments[0];
      m = arguments[1];
    }
    var layer = new Layer(url,m);
    if(layer.isSubapp){
      m.layer = layer;
    }
    app.stack.push(layer);
	}

  // app.get = function(path, handler){
  //   var m = new Route("get", handler);
  //   var layer = new Layer(path, m, {end:true});
  //   app.stack.push(layer);
  // }

  app.route = function(path){
    var router = new Route();
    var layer = new Layer(path, router, {end:true});
    app.stack.push(layer);
    return router;
  }

  app._factories = {};

  app.inject = function(fn){
    return inject(fn,app);
  }

  app.factory = function(name,handler){
    app._factories[name] = handler;
  }

  methods.forEach(function(method){
    app[method] = function(path, handler){
      var m = new Route(method, handler);
      app.route(path)[method](handler);
      return app;
    }
  });

  app.monkey_patch = function(req, res) {
    req.__proto__ = request(req,app);
    res.__proto__ = response(res);
    req.res = res;
    res.req = req;
  }


	app.listen = function(port, done){
		var server = http.createServer(app);
		server.listen(port, done);
		return server;
	};

	return app;
}
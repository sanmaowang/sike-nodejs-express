module.exports = myexpress;

var http = require("http");


function myexpress(){
	var app = function(req, res, next){
		var i = 0;
		var next = function(err){
			var m = app.stack[i];
			i++;
			if(err){
				if(i >= app.stack.length){
					if(m && m.length == 4){
						m(err,req,res,next);
					}else{
						res.statusCode = 500;
					}
					return;
				}else{
					next(err);
				}
			}

			if(m === undefined){
				res.statusCode = 404;
				return;
			}

			if(!err && m.length == 4){
				next();
			}else{
				try{
					m(req,res,next);
				}catch(ex){
					next(ex);
				}
			}
		}
		next();
		res.end();
	};



	app.stack = [];

	app.use = function(m){
		app.stack.push(m);
	}
	app.listen = function(port, done){
		var server = http.createServer(app);
		server.listen(port, done);
		return server;
	};
	return app;
}
module.exports = myexpress;

var http = require("http");


function myexpress(){
	var app = function(req, res, next2) {
    var i = 0;

    function next(err) {
      var m = app.stack[i];

      if (i >= app.stack.length) {
        if (next2) {
          next2(err);
        } else {
          res.statusCode = err ? 500 : 404;
          res.end();          
        }
      } else {
      	i++;
      	if(err){
          if(m.length == 4){  
            m(err, req, res, next);
          }else{
            next(err);
          }
      	}else if(!err && m.length == 4){
      		next();
      	}else {
      		try {
            m(req, res, next);
          } catch (ex) {
            next(ex);
          }
      	}
      }

    }

    next();
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
module.exports = myexpress;

var http = require("http");
var Layer = require("./lib/layer");

function myexpress(){
	var app = function(req, res, next2) {
    var i = 0;

    function next(err) {
        if (i >= app.stack.length) {
          if (next2) {
            next2(err);
          } else {
            res.statusCode = err ? 500 : 404;
            res.end();          
          }
        } else {
          var layer = app.stack[i];
          var m = layer.handle;
          i++;
          if(layer.match(req.url)){
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
    app.stack.push(layer);
	}
	app.listen = function(port, done){
		var server = http.createServer(app);
		server.listen(port, done);
		return server;
	};
	return app;
}
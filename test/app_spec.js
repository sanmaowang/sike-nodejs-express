var express = require('../');
var http = require("http");
var request = require("supertest");
var expect = require("chai").expect;


describe("app",function(){
	var app = express();
  describe("create http server",function(){
    it("responds 404",function(){
    	var server = http.createServer(app);
      request(server).get("/foo").expect(404).end();
    });
  });
	describe("add the listen method",function(){
		var port = 7000;
		var server;

		before(function() {
	    server = app.listen(port);
	  });

		it("should return an http server",function(){
			expect(server).to.be.instanceof(http.Server);
		});

		it("make an http request to port 7000",function(){
			request("http://localhost:"+port).get("/foo").expect(404).end();
		});

	});

	describe(".use",function(){
		var m1 = function(){};
		var m2 = function(){};
		app.use(m1);
		app.use(m2);
		it("add the middlewares to stack",function(){
			expect(app.stack.length).to.equal(2);
		});
	});

	describe("calling middleware stack",function(){
		var app;
	  beforeEach(function() {
	    app = new express();
	  });
	  
	  it("should be able to call a single middleware",function(){
	  	var m1 = function(req,res,next){
	  		res.end("hello from m1");
	  	}
	  	app.use(m1);
	  	request(app).get("/").expect("hello from m1").end();
	  });

	  it("should be able to call next to go to the next middleware",function(){
	  	var m1 = function(req,res,next){
	  		next();
	  	};
	  	var m2 = function(req,res,next){
	  		res.end("hello from m2");
	  	};
	  	app.use(m1);
	  	app.use(m2);
	  	request(app).get("/").expect("hello from m2").end();
	  });

	  it("should 404 at the end of middleware chain",function(){
	  	var m1 = function(req,res,next) {
			  next();
			};

			var m2 = function(req,res,next) {
			  next();
			};
	  	app.use(m1);
	  	app.use(m2);
	  	request(app).get("/").expect(404).end();
	  });

	  it("should 404 at the end of middleware chain",function(){
	  	app.stack = [];
	  	request(app).get("/").expect(404).end();
	  });

	});

	describe("Implement error handling",function(){
		var app;
	  beforeEach(function() {
	    app = new express();
	  });

	  it("should return 500 for unhandled error",function(){
	  	var m1 = function(req,res,next){
	  		next(new Error("boom!"));
	  	}
	  	app.use(m1);
	  	request(app).get("/").expect(500).end();
	  });

	  it("should return 500 for uncaught error",function(){
	  	var m1 = function(req,res,next){
	  		throw new Error("boom!");
	  	}
	  	app.use(m1);
	  	request(app).get("/").expect(500).end();
	  });

	  it("should skip error handlers when next is called without an error",function(){
	  	var m1 = function(req,res,next) {
			  next();
			}

			var e1 = function(err,req,res,next) {
			  // timeout
			}

			var m2 = function(req,res,next) {
			  res.end("m2");
			}
			app.use(m1);
			app.use(e1); // should skip this. will timeout if called.
			app.use(m2);
	  	request(app).get("/").expect("m2").end();
	  });

	  it("should skip normal middlewares if next is called with an error",function(){
	  	var m1 = function(req,res,next) {
			  next(new Error("boom!"));
			}

			var m2 = function(err,req,res,next) {
			  // timeout
			}

			var e1 = function(req,res,next) {
			  res.end("e1");
			}
			app.use(m1);
			app.use(e1); // should skip this. will timeout if called.
			app.use(m2);
	  	request(app).get("/").expect("e1").end();
	  });

	});

	describe("implement app embedding as middleware",function(){
		it("should pass unhandled request to parent",function(){
	  	var app  = new express();
	  	var subApp = new express();

	  	function m2(req, res, next){
	  		res.end("m2");
	  	}
	  	app.use(subApp);
	  	app.use(app);
	  	request(app).get("/").expect("m2").end();
	  });

	  it("should pass unhandled request to parent",function(){
	  	var app  = new express();
	  	var subApp = new express();

	  	function m1(req,res,next) {
			  next("m1 error");
			}

			function e1(err,req,res,next) {
			  res.end(err);
			}

			subApp.use(m1);
	  	app.use(subApp);
	  	app.use(e1);
	  	request(app).get("/").expect("m1 error").end();
	  });

	});

	describe("Layer class and the match method.",function(){
		var layer, fn;
		var Layer = require('../lib/layer');
	  beforeEach(function() {
	    fn = function(){};
	    layer = new Layer("/foo",fn);
	  });

	  it("sets layer.handle to be the middleware",function(){
	  	expect(layer.handle).to.be.equal(fn);
	  });

	  it("returns undefined if path doesn't match",function(){
	  	expect(layer.match("/bar")).to.be.undefined;
	  });

	  it("returns matched path if layer matches the request path exactly",function(){
    	var match = layer.match("/foo");
    	expect(match).to.not.be.undefined;
    	expect(match).to.have.property("path","/foo");
	  });

	  it("returns matched prefix if the layer matches the prefix of the request path",function(){
    	var match = layer.match("/foo");
    	expect(match).to.not.be.undefined;
    	expect(match).to.have.property("path","/foo");
	  });

	});

	describe("app.use should add a Layer to stack",function(){
		var layer, fn, app;
		var Layer = require('../lib/layer');
	  beforeEach(function() {
	  	app = new myexpress();
	    fn = function(){};
	    layer = new Layer("/foo",fn);
	  });
	  it("first layer's path should be /",function(){

	  });

	  it("second layer's path should be /foo",function(){

	  });
	});


	describe("The middlewares called should match request path",function(){
		var layer, fn, app;
		var Layer = require('../lib/layer');
	  beforeEach(function() {
	  	app = new myexpress();
	    fn = function(){};
	    layer = new Layer("/foo",fn);
	  });
	  it("returns root for GET /",function(){

	  });

	  it("second layer's path should be /foo",function(){

	  });
	});

});

var express = require('../');
var http = require("http");
var request = require("supertest");
var expect = require("chai").expect;

describe("app",function(){
	var app = express();
  describe("create http server",function(){
    it("responds 404",function(done){
    	var server = http.createServer(app);
      request(server).get("/foo").expect(404).end(done);
    });
  });
	describe("add the listen method",function(){
		var port = 7000;
		var server;

		before(function(done) {
	    server = app.listen(port,done);
	  });

		it("should return an http server",function(){
			expect(server).to.be.instanceof(http.Server);
		});

		it("make an http request to port 7000",function(done){
			request("http://localhost:"+port).get("/foo").expect(404).end(done);
		});

	});
});

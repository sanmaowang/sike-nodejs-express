var mime = require('mime');
var accepts = require("accepts");
var http = require("http");
var crc32 = require("buffer-crc32");

var response = function(res){
  var proto = {};
  proto.isExpress = true;
  proto.redirect = function(){
    if(arguments.length == 1){
      this.writeHead(302,{'Content-Length':0,'Location':arguments[0]});
    }else{
      this.writeHead(arguments[0],{'Content-Length':0,'Location':arguments[1]});
    }
    this.end("");
  };
  proto.type = function(ext){
    var content_type = mime.lookup(ext);
    this.setHeader('Content-Type',content_type);
  }

  proto.default_type = function(ext){
    if(!this.getHeader('Content-Type')){
      this.type(ext);
    }
  }
  proto.format = function(obj){
    var accept = accepts(this.req);
    var ext = accept.types(Object.keys(obj));
    if(ext in obj){
      this.type(ext);
      obj[ext]();
    }else{
      var err = new Error("Not Acceptable");
      err.statusCode = 406;
      throw err;
    }
    
  }
  proto.send = function(statusCode, content){
    var empty = false;
    if(typeof statusCode != "number"){
      content = statusCode;
      statusCode = 200;
    }

    if(!content){
      content = http.STATUS_CODES[statusCode];
      empty = true;
    }

    if(this.req.method == 'GET' && !empty){
      if(!this.getHeader('ETag')){
        this.setHeader('ETag','"'+crc32.unsigned(content)+'"');
      }
      if(this.req.headers['if-none-match'] == this.getHeader('ETag')){
        this.statusCode = 304;
        this.end();
      }
      if(this.req.headers['if-modified-since'] && new Date(this.req.headers['if-modified-since']) >= new Date(this.getHeader('Last-Modified'))){
        this.statusCode = 304;
        this.end();
      }
    }


    if(!this.getHeader('Content-Type')){
      if(content instanceof Buffer){
        this.setHeader('Content-Type','application/octet-stream');
        this.setHeader('Content-Length',content.length);
      }else if(typeof content == "string"){
        this.setHeader('Content-Type','text/html');
        this.setHeader('Content-Length',Buffer.byteLength(content));
      }else if(typeof content == "object"){
        content = JSON.stringify(content);
        this.setHeader('Content-Type','application/json');
        this.setHeader('Content-Length',Buffer.byteLength(content.toString()));
      }
    }

    this.statusCode = statusCode;
    this.end(content);
  }
  proto.__proto__ = res.__proto__;
  return proto;
}

module.exports = response;
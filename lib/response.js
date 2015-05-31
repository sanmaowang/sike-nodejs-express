var mime = require('mime');
var accepts = require("accepts");

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
    this.writeHead(200,{'Content-Type':content_type});
  }
  proto.default_content_type = null;
  proto.default_type = function(ext){
    proto.default_content_type = proto.default_content_type || mime.lookup(ext);
    this.writeHead(200,{'Content-Type':proto.default_content_type});
  }
  proto.format = function(obj){
    var accept = accepts(this.req);
    var ext = accept.types(Object.keys(obj));
    console.log(ext);
    if(ext in obj){
      this.type(ext);
      obj[ext]();
    }else{
      var err = new Error("Not Acceptable");
      err.statusCode = 406;
      throw err;
    }
    
  }
  proto.__proto__ = res.__proto__;
  return proto;
}

module.exports = response;
var mime = require('mime');
var accepts = require("accepts");
var http = require("http");
var crc32 = require("buffer-crc32");
var fs = require("fs");
var path = require("path");
var rparser = require("range-parser");


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

  proto.sendfile = function(filepath, options){
    var _this = this;
    filepath = options? path.normalize(options.root+filepath):path.normalize(filepath);

    if(filepath.indexOf("..") > -1){
      _this.statusCode = 403;
      _this.end();
      return;
    }

    var ext = path.extname(filepath);

    _this.type(ext);



    fs.stat(filepath,function(err, stats){
      if(err){
        _this.statusCode = 404;
        _this.end();
        return;
      }
      if(stats.isDirectory()){
        _this.statusCode = 403;
        _this.end();
        return;
      }
      _this.setHeader('Content-Length',stats.size);
      _this.setHeader('Accept-Range', 'bytes');

      if(_this.req.headers['range']){
        var r = rparser(stats,_this.req.headers['range']);
        if(typeof r == "object"){
          options = {};
          options.start = r[0].start;
          options.end = r[0].end;
          _this.statusCode = 206;
          _this.setHeader('Content-Range',r.type+' '+options.start+'-'+options.end+'/'+stats.size);
          _this.setHeader('Content-Length',options.end-options.start+1);
        }else if(r == -1){
          _this.statusCode = 416;
        }
      }

      var file = fs.createReadStream(filepath,options);
      _this.stream(file);
    });


  }

  proto.stream = function(file){
    var _this = this;
    file.on("data",function(chunk) {
      var ok = _this.write(chunk);
      if(ok == false) {
          file.pause();
          _this.once("drain",function() {
            file.resume();
          });
        }
    });
    file.on('end', function () {
      _this.end();
    });
  }

  proto.__proto__ = res.__proto__;
  return proto;
}


module.exports = response;
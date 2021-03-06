var p2re = require("path-to-regexp");

var Layer = function(path, middleware, options){
  this.path = path;
  this.handle = middleware;
  this.options = options? options : {end:false};
  this.isSubapp = (middleware && typeof middleware.handle == "function") ? true:false;
}

Layer.prototype.match = function(request_path){
  var names = [];
  var path = this.path.replace(/\/$/,'');
  var re = p2re(path,names,this.options);

  var url = decodeURI(request_path);
  url = url.replace(/\/$/,'');

  if(re.test(url)){
    var m = re.exec(url);
    var _params = {};
    for(var i = 0; i < names.length; i++){
      _params[names[i].name] = m[i+1];
    }
    return {
      path : m[0],
      params:_params
    };
  }else{
    return undefined;
  }
}

module.exports = Layer;
var methods = require("methods");


var makeRoute = function(verb, handler){
  var route = function(req,res,parent){
    var i = 0;
    var next = function(err){
     if(i >= route.stack.length){
      if(parent){
        parent(err);
      }
     }else{
      var  m = route.stack[i];
      i++;
      if(req.method == m.verb.toUpperCase() || m.verb.toUpperCase() == 'ALL'){
        try{
          if(err){
            err == "route"? parent():parent(err);
          }else{
            m.handler(req,res,next);
          }
        }catch(ex){
          parent(ex);
        }
      }else{
        next();
      }
    }
  }
    next();
  }

  route.stack = [];
  
  methods.push("all");
  methods.forEach(function(method){
    route[method] = function(handler){
      route.use(method, handler);
      return route;
    }
  });

  route.use = function(verb, handler){
    route.stack.push({verb:verb, handler:handler});
  }

  return route;
}

module.exports = makeRoute;

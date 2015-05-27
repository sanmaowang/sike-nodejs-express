var createInjector = function(handler,app){
	var injector = function(req,res,next){
		var loader = injector.dependencies_loader(req,res,next);
		loader(function(err,values){
			if(err){
				next(err);
			}else{
				handler.apply(this,values);
			}
		});
	}
	injector.extract_params = function(){
		var fnText = handler.toString();
		var FN_ARGS        = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
      FN_ARG_SPLIT   = /,/,
      FN_ARG         = /^\s*(_?)(\S+?)\1\s*$/,
      STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
		var inject = [];
    var argDecl = fnText.replace(STRIP_COMMENTS, '').match(FN_ARGS);
    
	  argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
	    arg.replace(FN_ARG, function(all, underscore, name) {
	      inject.push(name);
	    });
	  });

	  return inject;
	}

	injector.dependencies_loader = function(req,res,next2){
		var values = [];

		var params = injector.extract_params();
		var _err = null;

		var next = function(err,value){
			if(!err){
				values.push(value);
			}else{
				_err = err;
			}
		}
		// console.log(params);
		params.forEach(function(name){
			var m = app._factories[name];
			if(m != undefined){
				try{
					m(req,res,next);
				}catch(ex){
					_err = ex;
					next(_err);
				}
			}else if(name == "next"){
				next(null,next2);
			}else if(name == "res"){
				next(null,res);
			}else if(name == "req"){
				next(null,req);
			}
			else{
				_err = new Error("Factory not defined: " + name);
			}
		});

		var loader = function(cb){
			// console.log(_err);
			try{
				cb(_err, values);
			}catch(ex){
				next(ex, values);
			}
		}

		return loader;

	}

	return injector;
}

module.exports = createInjector;
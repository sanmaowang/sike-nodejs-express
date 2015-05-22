
var makeRoute = function(verb, handler){
	var result = function(req,res,next){
		// console.log(req.method);
		if(req.method == verb.toUpperCase()){
			handler(req, res, next);
		}else{
			next();
		}
	}
	return result;
}

module.exports = makeRoute;

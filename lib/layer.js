var Layer = function(path, middleware){
	this.path = path;
	this.handle = middleware;
}

Layer.prototype.match = function(request_path){
	if(request_path.indexOf(this.path) == 0){
		return {path : this.path};
	}else{
		return undefined;
	}
}

module.exports = Layer;
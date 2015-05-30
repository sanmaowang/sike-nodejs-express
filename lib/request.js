var request = function(req,app){
  var proto = {};
  proto.isExpress = true;
  proto.app = app;
  proto.__proto__ = req.__proto__;
  return proto;
}

module.exports = request;
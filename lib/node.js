"use strict";

var Node = module.exports = function(opts, methods, done){

  var self = this;

  if(typeof opts !== 'object'){
    return done (new Error('Bad node definition'));
  }

  if(typeof opts.id !== 'string'){
    return done (new Error('Bad node id'));
  }

  if(typeof methods === 'function'){
    done = methods;
    methods = {};
  }

  this.id = opts.id;
  this.attributes = {};

  ['init','stop','process'].forEach(function(method){
    if(methods.hasOwnProperty(method)){
      self[method] = methods[method];
    }
  });

  for(var k in opts){
    if(opts.hasOwnProperty(k) && k !== 'id'){
      this.attributes[k] = opts[k];
    }
  }

  this.init.call(this, function(){
    process.nextTick(done);
  });

  return this;

};

Node.prototype.init = function(done){
  done();
};

Node.prototype.stop = function(done){
  return done();
};

Node.prototype.process = function(msg, done){
  // passthru;
  done(null, msg);
};

Node.prototype.get = function(key){
  if(typeof(key) === 'undefined'){
    return this.attributes;
  }
  return this.attributes[key];
};

Node.prototype.set = function(key, val){

  if(!key){
    return this;
  }

  var attrs, k;

  if(typeof key === 'object'){
    attrs = key;
  } else {
    attrs = {};
    attrs[key] = val;
  }

  for (k in attrs){
    this.attributes[k] = attrs[k];
  }

};

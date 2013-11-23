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

  if(typeof methods === 'undefined'){
    methods = {};
  }

  this.id = opts.id;
  this.attributes = {};
  this.value = undefined;

  ['init','stop','process'].forEach(function(method){
    if(methods.hasOwnProperty(method)){
      self[method] = methods[method];
    }
  });

  // This will be wrapped so we can capture the output value
  if(methods.hasOwnProperty('process')){
    self.processHandler = methods.process;
  }

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

Node.prototype.processHandler = function(msg, done){
  // default is to just pass thru;
  done(null, msg);
};

Node.prototype.process = function(msg, done){
  var self = this;
  this.processHandler(msg, function(err, msg){
    // latch most recent value
    self.value = msg;
    done(null, msg);
  });
};

Node.prototype.inspect = function(){
  return {
    id: this.id,
    val: this.value,
    attributes: this.attributes
  };
};

Node.prototype.val = function(){
  return this.value;
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

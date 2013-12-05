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
  this.attrs = {};
  this.latchedMessage = undefined;

  ['init','stop'].forEach(function(method){
    if(methods.hasOwnProperty(method)){
      self[method] = methods[method];
    }
  });

  // This will be wrapped so we can capture the output message
  if(methods.hasOwnProperty('process')){
    this.processHandler = methods.process;
  }

  for(var k in opts){
    if(opts.hasOwnProperty(k) && k !== 'id'){
      this.attrs[k] = opts[k];
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
  done();
};

// this will most likely be overridden whern creating the node
Node.prototype.processHandler = function(msg, done){
  // default is to just pass thru;
  done(null, msg);
};

Node.prototype.process = function(msg, done){
  var self = this;
  this.processHandler.call(this, msg, function(err, processedMsg){
    // latch most recent message
    self.latchedMessage = processedMsg;
    done(null, processedMsg);
  });
};

Node.prototype.inspect = function(){
  return {
    id: this.id,
    message: this.latchedMessage,
    attrs: this.attrs
  };
};

Node.prototype.message = function(){
  return this.latchedMessage;
};

Node.prototype.get = function(key){
  if(typeof(key) === 'undefined'){
    return this.attrs;
  }
  return this.attrs[key];
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
    this.attrs[k] = attrs[k];
  }

};

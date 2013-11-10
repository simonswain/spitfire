"use strict";

var Node = module.exports = function(opts){
  this.id = opts.id;
  if(opts.hasOwnProperty('process')){
    this.process = opts.process;
  }
};

Node.prototype.init = function(done){
  done(false);
};

Node.prototype.stop = function(msg, done){
  done(false);
};

Node.prototype.process = function(msg, done){
  // passthru;
  done(false, msg.value);
};

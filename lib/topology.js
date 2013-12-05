"use strict";

var Redis = require('redis');
var _ = require('underscore');
var util = require('util');
var Node = require('./node');

var Topology = module.exports = function(opts){

  var self = this;

  if(typeof opts === 'undefined'){
    opts = {};
  }

  // default connection for Redis if not provided in opts

  if(!opts.hasOwnProperty('redis')){
    opts.redis = {};
  }

  if(!opts.redis.hasOwnProperty('host')){
    opts.redis.host = '127.0.0.1';
  }

  if(!opts.redis.hasOwnProperty('port')){
    opts.redis.port = 6379;
  }

  // keys for Redis data
  var keys = {};

  // If prefix supplied in opts then use it
  if(!opts.redis.hasOwnProperty('prefix') || opts.redis.prefix === ''){
    keys.queue = 'queue';
  } else {
    keys.queue = opts.redis.prefix + ':queue';
  }

  // Create our Redis client
  var redis = Redis.createClient({
    host: opts.redis.host,
    port: opts.redis.port
  });

  // Set this flag when you want the top to stop pulling data off the
  // queue
  this.running = false;

  // our topology
  this.nodes = {};

  // ids of all nodes (keys of this.nodes)
  this.ids = [];

  // nodes that listen to a given node
  this.sources = {};

  // nodes a given node listens to
  this.targets = {};

  // ids of all our nodes
  this.keys = function(){
    return this.ids;
  };

  // add a node to the topology
  this.add = function(opts, methods, sources, done){

    var self = this;

    opts.id = String(opts.id);

    if(typeof methods === 'function'){
      done = methods;
      methods = {};
      sources = [];
    }

    if(typeof sources === 'function'){
      done = sources;
      sources = [];
    }

    this.ids.push(opts.id);

    this.nodes[opts.id] = new Node(opts, methods, function(err){
      _.each(sources, function(id){
        if(!self.targets.hasOwnProperty(id)){
          self.targets[id] = [];
        }
        if(!self.sources.hasOwnProperty(opts.id)){
          self.sources[opts.id] = [];
        }
        self.targets[id].push(opts.id);
        self.sources[opts.id].push(id);
      });
      done();
    });
  };

  // remove a node from the topology
  this.remove = function(id, done){
    var self = this;

    if(typeof this.nodes[id] === 'undefined'){
      return done();
    }

    this.nodes[id].stop(
      function(){
        _.each(
          self.targets[id], 
          function(source_id){
            self.sources[source_id] = _.without(self.sources[source_id], id);
          });
        delete self.targets[id];
        self.ids = _.without(self.ids, id);
        delete self.nodes[id];
        return done();
      });
  };
  

  this.set = function(id, key, value){

    if(!this.nodes.hasOwnProperty(id)){
      return;
    }

    if(!key){
      return;
    }

    this.nodes[id].set(key, value);

  };


  this.get = function(id, key){

    if(!this.nodes.hasOwnProperty(id)){
      return;
    }

    if(!key){
      var node = this.nodes[id].inspect();
      node.sources = this.sources[id];
      return node;
    }

    return this.nodes[id].get(key);

  };


  // Get last message the node output
  this.message = function(id){

    if(!this.nodes.hasOwnProperty(id)){
      return;
    }

    return this.nodes[id].message();

  };

  // return map of topology structure
  this.inspect = function(){
    var nodes = {};
    for(var id in this.nodes){
      nodes[id] = this.nodes[id].inspect(id);
      nodes[id].sources = this.sources[id];
    }
    return nodes;
  };

  // push a message in to the queue. external sources must use this
  // method to get data in to the topology

  this.inject = function(id, msg, done){

    if(!this.nodes.hasOwnProperty(id)){
      return done && done(new Error('unknown node'));
    }

    var message = {
      id: id,
      msg: msg
    };

    redis.lpush(
      keys.queue,
      JSON.stringify(message),
      function(err){
        return done && done();
      });
  };


  // push a message in to a node for processing, get the result (if
  // any) and push it on to the message queue. emit the message to
  // listeners

  this.process = function(id, message, done){
    var self = this;
    //console.log(id +' process <- ' + JSON.stringify(message));
    this.nodes[id].process(
      message,
      function(err, msg){

        if(typeof msg === 'undefined'){
          return done();
        }

        // if this node has any listeners, distribute the message to
        // them via the queue

        //console.log( id + ' -> ' + msg);
        if(self.targets.hasOwnProperty(id)){
          _.each(
            self.targets[id],
            function(listener_id){
              //console.log( '   ' + id + ' -> ' + msg + ' -> ' + listener_id);
              self.inject(listener_id, msg);
            });
        }

        // message from id
        self.emit('message', {id: id, msg: msg});
        return done();
      }
    );
  };

  // request shutdown after the next message
  this.stop = function(cb){
    self.onShutdown = cb;
    if(!self.running){
      self.shutdown();
    }
    self.running = false;
  };

  // clean up and call onShutdown when ready
  this.shutdown = function(){
    redis.quit();
    if(typeof this.onShutdown === 'function'){
      return this.onShutdown();
    }
  };

  // start accepting (polling for) messages
  this.start = function(done){
    this.running = true;
    process.nextTick(function(){
      self.run();
    });
    if(done){
      done();
    }
  };

  // run one tick of the topology. Pull a message off the queue and
  // have it processed by it's target node.
  this.run = function(){

    if(!this.running){
      return self.shutdown();
    }

    redis.rpop(
      [keys.queue],
      function(err, reply){
        if(err){
          console.log('#run error', err);
          self.run();
          return;
        }
        if (!reply){
          // timed out, no message
          self.run();
          return;
        }
        var id, msg, input;
        try {
          input = JSON.parse(reply);
        } catch (e) {
          // bad json
          console.log('bad json', e, reply);
          self.run();
          return;
        }

        self.process(
          input.id,
          input.msg,
          function(err){
            //console.log('processed, running again');
            self.run();
          });
      });
  };

};

var eventSplitter = /\s+/;


Topology.prototype.on = function(events, callback, context) {
  var calls, event, list;
  if ( ! callback ) {
    return this;
  }

  events = events.split(eventSplitter);
  calls = this._callbacks || (this._callbacks = {});

  while (event = events.shift()) {
    list = calls[event] || (calls[event] = []);
    list.push(callback, context);
  }

  return this;
};

Topology.prototype.off = function(events, callback, context) {
  var event, calls, list, i;

  // No events, or removing *all* events.
  if ( ! ( calls = this._callbacks ) ) {
    return this;
  }

  if ( ! ( events || callback || context ) ) {
    delete this._callbacks;
    return this;
  }

  events = events ? events.split(eventSplitter) : _.keys(calls);

  // Loop through the callback list, splicing where appropriate.
  while (event = events.shift()) {
    if (!(list = calls[event]) || !(callback || context)) {
      delete calls[event];
      continue;
    }

    for (i = list.length - 2; i >= 0; i -= 2) {
      if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
        list.splice(i, 2);
      }
    }
  }

  return this;
};

Topology.prototype.emit = function(events) {
  var event, calls, list, i, length, args, all, rest;
  if (!(calls = this._callbacks)){
    return this;
  }

  rest = [];
  events = events.split(eventSplitter);

  // Fill up `rest` with the callback arguments.  Since we're only copying
  // the tail of `arguments`, a loop is much faster than Array#slice.
  for (i = 1, length = arguments.length; i < length; i++) {
    rest[i - 1] = arguments[i];
  }

  // For each event, walk through the list of callbacks twice, first to
  // trigger the event, then to trigger any `"all"` callbacks.
  while (event = events.shift()) {
    // Copy callback lists to prevent modification.
    if (all = calls.all) {
      all = all.slice();
    }

    if (list = calls[event]) {
      list = list.slice();
    }

    // Execute event callbacks.
    if (list) {
      for (i = 0, length = list.length; i < length; i += 2) {
        list[i].apply(list[i + 1] || this, rest);
      }
    }

    // Execute "all" callbacks.
    if (all) {
      args = [event].concat(rest);
      for (i = 0, length = all.length; i < length; i += 2) {
        all[i].apply(all[i + 1] || this, args);
      }
    }
  }

  return this;
};

"use strict";

var Redis = require('redis');
var _ = require('underscore');

var Node = require('./node');

var Topology = module.exports = function(opts){

  var self = this;

  var keys = {
    queue: 'queue'
  };

  var redis = Redis.createClient();

  // our topology
  this.nodes = {};

  // ids of all nodes (keys of this.nodes)
  this.ids = [];

  // nodes that listen to a given node
  this.sources = {};

  // nodes a given node listens to
  this.targets = {};

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
        if(!self.sources.hasOwnProperty(id)){
          self.sources[id] = [];
        }      
        self.sources[id].push(opts.id);
      });
      return done();
    });
  };
  
  // remove a node from the topology
  this.remove = function(id, done){
    var self = this;

    if(typeof this.nodes[id] === 'undefined'){
      return done();
    }

    this.nodes[id].stop(function(){
      delete self.nodes[id];
      delete self.sources[id];
      self.ids = _.without(self.ids, id);

      // remove from sources here

      return done();     
    });
  };

  // push a message in to the queue. external sources must use this
  // method to get data in to the topology

  this.inject = function(id, msg){
    
    if(!this.nodes.hasOwnProperty(id)){
      return;
    }

    var m = {
      id: id,
      msg: msg
    };

    redis.lpush(
      keys.queue, 
      JSON.stringify(m),
      function(err){
        console.log(id +' <- ' + msg.value);
      });
  };

  // push a message in to a node for processing, get the result (if
  // any) and push it on to the message queue

  this.process = function(id, msg, done){
    this.nodes[id].process(
      msg,
      function(err, val){
        if(typeof val === undefined){
          return done();
        }
        // if this node has any listeners, distribute the message to
        // them via the queue

        console.log( id + ' -> ' + val);

        if(self.sources.hasOwnProperty(id)){
          _.each(
            self.sources[id], 
            function(listener_id){
              console.log( '   ' + id + ' -> ' + val + ' -> ' + listener_id);
              self.inject(listener_id, {value: val});
            });
        }
        return done();
      }
    );
  };


  this.running = false;

  // request shutdown after the next message
  this.stop = function(cb){
    this.onShutdown = cb;
    if(!this.running){
      this.shutdown();
    }
    this.running = false;
  };

  // clean up and call onShutdown when ready
  this.shutdown = function(){
    //console.log('shutting down');
    redis.quit();
    if(typeof this.onShutdown === 'function'){
      return this.onShutdown();
    }
  };

  // start accepting (polling for) messages
  this.start = function(done){
    this.running = true;
    this.run();
  };

  // run one tick of the topology. Pull a message off the queue and
  // have it processed by it's target node.
  this.run = function(){
    if(!this.running){
      return this.shutdown();
    }
    redis.brpop(
      [keys.queue, 1], 
      function(err, reply){
        if(err){
          console.log('#run error', err);
          setTimeout(self.run, 1000);
          return;
        }
        if (!reply){
          // brpop timed out
          self.run();
          return;
        }
        var id, msg, input;
        try {
          input = JSON.parse(reply[1]);
        } catch (e) {
          // bad json
          self.run();
          return;
        }
        self.process(
          input.id, 
          input.msg, 
          function(err){
            self.run();
          });
      });
  };

};


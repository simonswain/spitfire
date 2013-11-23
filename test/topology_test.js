"use strict";

var util = require('util');
var async = require('async');

var Spitfire = require('../index.js');

exports['node'] = {
  'new': function(test) {
    test.expect(6);

    var nodes = Spitfire.create();
    test.equal(typeof nodes, 'object', 'should be object');
    test.equal(typeof nodes.add, 'function', 'should be function');
    test.equal(typeof nodes.remove, 'function', 'should be function');
    test.equal(typeof nodes.keys, 'function', 'should be function');
    test.equal(typeof nodes.start, 'function', 'should be function');
    test.equal(typeof nodes.stop, 'function', 'should be function');

    nodes.stop(function(){
      test.done();
    });

  },
  'start': function(test) {
    test.expect(1);
    var nodes = Spitfire.create();
    nodes.start();
    nodes.stop(function(){
      test.ok(true,'Should be stopped');
      test.done();
    });
  },
  'add': function(test) {
    test.expect(1);
    var nodes = Spitfire.create();
    nodes.add({
      id: 'test'
    }, function(){
      test.equal(nodes.keys().length, 1,'Should be 1');
      nodes.stop(function(){
        test.done();
      });
    });
  },
  'remove': function(test) {
    test.expect(1);
    var nodes = Spitfire.create();
    nodes.add({
      id: 'test'
    }, function(){
      nodes.remove('test', function(){
        test.equal(nodes.keys().length, 0,'Should be 0');
        nodes.stop(function(){
          test.done();
        });
      });
    });
  },
  'set-get-kv': function(test) {
    test.expect(2);
    var nodes = Spitfire.create();
    nodes.add({
      id: 'test-set',
      foo: 'bar'
    }, function(){

      test.equal(nodes.get('test-set', 'foo'), 'bar','Should match');

      nodes.set('test-set','foo','baz');
      test.equal(nodes.get('test-set','foo'), 'baz','Should match');

      nodes.stop(function(){
        test.done();
      });

    });
  },
  'process': function(test) {
    // create a topo with one node. bind to topo, inject message,
    // receive message from event handler

    test.expect(3);

    var nodes = Spitfire.create();
    nodes.add({
      id: 'test'
    }, function(){
      test.equal(nodes.keys().length, 1,'Should be 1');

      var onMessage = function(message){
        test.equal(message.id, 'test','Should be id');
        test.equal(message.msg, 'foo','Should be message');
        nodes.stop(function(){
          test.done();
        });
      };

      nodes.on('message', onMessage);
      nodes.inject('test', 'foo');
      nodes.start();
    });
  },
  'get-latched-val': function(test) {
    test.expect(1);
    var nodes = Spitfire.create();
    nodes.add({
      id: 'test'
    }, function(){
      var onMessage = function(message){
        test.equal(nodes.val('test'), 'foo','Should be message');
        nodes.stop(function(){
          test.done();
        });
      };
      nodes.on('message', onMessage);
      nodes.inject('test', 'foo');
      nodes.start();
    });
  },
  'process-many': function(test) {
    // create a topo with one node. bind to topo, inject message,
    // receive message from event handler

    var limit = 5;
    var count = 0;

    test.expect(limit);

    var nodes = Spitfire.create();
    nodes.add({
      id: 'test'
    }, function(){

      var onMessage = function(message){
        test.ok(true,'Got message');
        count --;
        if(count > 0) {
          return;
        }
        nodes.stop(function(){
          test.done();
        });
      };

      nodes.on('message', onMessage);
      while(count < limit){
        count ++;
        nodes.inject('test', 'message-' + count);
      }
      nodes.start();
    });
  },
  'process-bad-id': function(test) {
    // should get an error in the callback from the bad id we try and
    // inject

    test.expect(2);

    var nodes = Spitfire.create();
    nodes.add({
      id: 'test'
    }, function(){
      test.equal(nodes.keys().length, 1,'Should be 1');

      var onMessage = function(message){
        nodes.stop(function(){
          test.done();
        });
      };

      nodes.on('message', onMessage);
      nodes.inject('unknown', 'bad', function(err){
        test.ok(util.isError(err),'Should be Error');
        nodes.inject('test', 'foo');
        nodes.start();
      });
    });
  },
  'process-chain': function(test) {
    test.expect(1);
    var nodes = Spitfire.create();
    var onMessage = function(message){
      if(message.id !== 'output'){
        return;
      }
      test.equal(message.msg, 46,'Should be double');
      nodes.stop(function(){
        test.done();
      });
    };

    var n = [{
      opts: {
        id: 'multiply'
      },
      methods: {
        process: function(msg, done){
          return done(null, msg * 2);
        }
      }
    }, {
      opts: {
        id: 'output'
      },
      methods: {
      },
      sources: ['multiply']
    }];

    async.each(n, function(x, next){
      nodes.add(x.opts, x.methods, x.sources, next);
    }, function(){
      nodes.on('message', onMessage);
      nodes.inject('multiply', 23);
      nodes.start();
    });
  },
  'many-to-one': function(test) {
    test.expect(1);
    var nodes = Spitfire.create();
    var onMessage = function(message){
      if(message.id !== 'output'){
        return;
      }
      if(message.msg !== 2){
        return;
      }
      test.equal(message.msg, 2,'Should be double');
      nodes.stop(function(){
        test.done();
      });
    };

    var n = [{
      opts: {id: 'output'},
      methods: {
        init: function(done){
          this.total = 0;
          done();
        },
        process: function(msg, done){
          this.total += msg;
          return done(null, this.total);
        }
      },
      sources: ['input-1','input-2']
    }, {
      opts: {id: 'input-1'},
    }, {
      opts: {id: 'input-2'},
    }];

    async.each(n, function(x, next){
      nodes.add(x.opts, x.methods, x.sources, next);
    }, function(){
      nodes.on('message', onMessage);
      nodes.inject('input-1', 1);
      nodes.inject('input-2', 1);
      nodes.start();
    });
  },
  'one-to-many': function(test) {
    test.expect(2);
    var nodes = Spitfire.create();

    var count = 0;

    var onMessage = function(message){
      if(message.id === 'input'){
        return;
      }
      count ++;
      test.equal(message.msg, 1,'Should be 1');
      if(count < 2){
        return;
      }
      nodes.stop(function(){
        test.done();
      });
    };

    var n = [{
      opts: {id: 'output-1'},
      sources: ['input']
    }, {
      opts: {id: 'output-2'},
      sources: ['input']
    }, {
      opts: {id: 'input'},
    }];

    async.each(n, function(x, next){
      nodes.add(x.opts, x.methods, x.sources, next);
    }, function(){
      nodes.on('message', onMessage);
      nodes.inject('input', 1);
      nodes.start();
    });
  },
  // 'process-with-changing-params': function(test) {
  //   test.done();
  // },
  // 'averaging': function(test) {
  //   test.done();
  // },
  // 'sync': function(test) {
  //   test.done();
  // },

  // ensure source target is removed when node removed

};

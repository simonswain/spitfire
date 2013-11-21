"use strict";

var util = require('util');

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
  // 'start': function(test) {
  //   test.expect(1);
  //   var nodes = Spitfire.create();
  //   nodes.start();
  //   nodes.stop(function(){
  //     test.ok(true,'Should be stopped');
  //     test.done();
  //   });
  // },
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
      }

      nodes.on('message', onMessage);
      nodes.inject('test', 'foo');
      nodes.start();
    });
  },
  'process-many': function(test) {
    // create a topo with one node. bind to topo, inject message,
    // receive message from event handler

    var limit = 50;
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
      }

      nodes.on('message', onMessage);
      while(count < limit){
        count ++;
        nodes.inject('test', 'message-' + count);
      }
      nodes.start();
    });
  },

};

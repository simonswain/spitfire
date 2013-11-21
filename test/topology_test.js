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
  }

};

"use strict";

var util = require('util');

var Node = require('../lib/node.js');

exports['node'] = {
  'new': function(test) {
    test.expect(3);

    var node = new Node({
      id: '1'
    }, {
      init: function(done){
        test.ok(true, 'Init ran');
        return done();
      }}, function(err){
        test.ok(!util.isError(err), 'should be no error'); 
        test.equal(typeof node, 'object', 'should be object');
        test.done();
      });
  },
  'attrs-on-create': function(test) {
    test.expect(1);
    var node = new Node({
      id: '1',
      foo: 'bar'
    }, function(err){
      test.equal(node.get('foo'), 'bar', 'should match');
      test.done();
    });
  },
  'attrs-set-after-create': function(test) {
    test.expect(6);
    var node = new Node({
      id: '1',
      foo: 'bar'
    }, function(err){
      test.equal(node.get('foo'), 'bar', 'should match');

      // set (change) existing
      node.set('foo','baz');
      test.equal(node.get('foo'), 'baz', 'should match');

      // set new
      node.set('xxx','yyy');
      test.equal(node.get('xxx'), 'yyy', 'should match');

      // set multiple
      node.set({'aaa':111,'bbb':222});

      test.equal(node.get('aaa'), 111, 'should match');
      test.equal(node.get('bbb'), 222, 'should match');

      // all attrs

      test.deepEqual(
        node.get(), 
        {foo: 'baz', xxx: 'yyy', aaa: 111, bbb: 222 },
        'should match'
      );

      test.done();
    });
  },
  'process': function(test) {
    test.expect(2);
    var localValue = 23;
    var node = new Node({
      id: '1',
      myValue: localValue
    }, {
      process: function(msg, done){
        return done(null, this.get('myValue'));
      }}, function(err){

        node.process({}, function(err, msg){
          test.ok(!util.isError(err), 'should be no error'); 
          test.equal(msg, localValue); 
          test.done();
        });
      });
  },
  'stop': function(test) {
    test.expect(2);
    var node = new Node({
      id: '1'
    }, {
      stop: function(done){
        test.ok(true, 'Stop ran'); 
        return done();
      }}, function(err){
        node.stop(function(err){
          test.ok(!util.isError(err), 'should be no error'); 
          test.done();
        });
      });
  },
};

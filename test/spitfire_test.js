"use strict";

var Spitfire = require('../lib/spitfire.js');

exports['spitfire'] = {
  'exports': function(test) {
    test.expect(2);
    test.equal( typeof Spitfire, 'object', 'should be a object.');
    test.equal( typeof Spitfire.create, 'function', 'should be a function.');
    test.done();
  }
};

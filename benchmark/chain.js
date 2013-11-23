"use strict";

var async = require('async');
var Spitfire = require('../index.js');

var run = module.exports = function(limit, done){
  
  var count = 0;
  var division = 10;
  var n = [{
    opts: {id: 'output'},
    methods: {
      init: function(done){
        this.count = 0;
        this.total = 0;
        done();
      },
      process: function(msg, done){
        this.count ++;
        if(this.count < division){
          return done();
        }
        this.count = 0;
        this.total ++;
        return done(null, msg);
      }
    },
    sources: ['input']
  }, {
    opts: {id: 'input'},
    methods: {
      process: function(msg, done){
        return done(null, msg);
      }
    },
  }];

  var nodes = Spitfire.create();

  nodes.on('message', function(message){ 
    if(message.id !== 'output'){
      return;
    }

    if(message.msg < limit) {
      return;
    }
    nodes.stop(function(){
      done();
    });
  });

  async.each(n, function(x, next){
    nodes.add(x.opts, x.methods, x.sources, next);
  }, function(){

    nodes.start();
    while(count < limit){
      count ++;
      nodes.inject('input', count);
    }
  });

};

var limit = 100000;
console.log('Running ' + limit + ' messages...');
var t = new Date().getTime(0);
run(limit, function(){
  var elapsed = (new Date().getTime() - t)/1000;
  console.log('done in ' + elapsed.toFixed(3) + 's = ' + (limit / elapsed).toFixed(0) + ' messages/second');
});

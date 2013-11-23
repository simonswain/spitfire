"use strict";

var Spitfire = require('../index.js');

var run = module.exports = function(limit, done){
  // create a topo with one node. bind to topo, inject message,
  // receive message from event handler
  
  var count = 0;

  var nodes = Spitfire.create();
  nodes.add({
    id: 'test'
  }, function(){

    var onMessage = function(message){ 
      count --;
      if(count > 0) {
        return;
      }
      nodes.stop(function(){
        done();
      });
    };

    nodes.on('message', onMessage);
    nodes.start();
    while(count < limit){
      count ++;
      nodes.inject('test', 'message-' + count);
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

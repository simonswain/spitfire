var Spitfire = require('../lib/spitfire.js');

process.on( 'SIGINT', function() {
  console.log( "\nShutting Down..." );
  // some other closing procedures go here
  process.exit();
});

var nodes = Spitfire.create();

// passthru
nodes.add({
  id: 1
});

// double
nodes.add({
  id: 2,
  process: function(msg, done){
    var res = msg.value * 2;
    return done(false, res);
  }
}, [1]);

for(var i = 3; i<10; i++){
  nodes.add({
    id: i,
    process: function(msg, done){
      var res = msg.value / 3;
      return done(false, res);
    }
  }, [Math.ceil(i/5)]);
}


var count = 1;
var pusher;

var push = function(){
  console.log('pushing', count)
  nodes.inject(
    1, 
    {value: count}
  );
  count ++;
  if(count < 150){
    pusher = setTimeout(push, 100);
  }
}

nodes.start();
push();

var kill = function(){
  clearInterval(pusher);
  nodes.stop();
}

//setTimeout(kill, 5000);


console.log(nodes.sources);

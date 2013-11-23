# Spitfire

Reactive Programming framework for Node.js

Version 0.0.3

[![Build Status](https://travis-ci.org/simonswain/spitfire.png)](https://travis-ci.org/simonswain/spitfire)

```bash
npm install spitfire
```

```javascript
var Spitfire = require('spitfire');
var topo = Spitfire.create();
topo.add({id:'my-node'});
topo.on('message', function(message){
  console.log(message.id, message.msg);
});
topo.start();
topo.inject('my-node','foo');
```

## Benchmarks

i5 Thinkpad x220

```bash
x220:~/spitfire/benchmark$ node thru
Running 100000 messages...
done in 7.927s = 12615 messages/second

x220:~/spitfire/benchmark$ node chain
Running 100000 messages...
done in 15.725s = 6359 messages/second
```

i7 Thinkpad x230

```bash
x230:~/spitfire/benchmark$ node thru
Running 100000 messages...
done in 6.331s = 15795 messages/second

x230:~/spitfire/benchmark$ node chain
Running 100000 messages...
done in 11.910s = 8396 messages/second
```

## Release History

* 10/11/2013 0.0.1 Initial release

## License
Copyright (c) 2013 Simon Swain
Licensed under the MIT license.

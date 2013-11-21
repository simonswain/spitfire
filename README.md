# Spitfire

Reactive Programming framework for Node.js

Version 0.0.1

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

## Release History

* 10/11/2013 0.0.1 Initial release

## License
Copyright (c) 2013 Simon Swain
Licensed under the MIT license.

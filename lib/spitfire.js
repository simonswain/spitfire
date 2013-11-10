/*
 * spitfire
 * https://github.com/simonswain/spitfire
 *
 * Copyright (c) 2013 Simon Swain
 * Licensed under the MIT license.
 */

"use strict";

var Topology = require('./topology');

module.exports = {
  create: function(opts){
    return new Topology(opts);
  }
};

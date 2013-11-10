"use strict";

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: '<json:package.json>',
    nodeunit: {
      files: [
        'test/**/*.js'
      ]
    },
    jshint: {
      files: [
        'Gruntfile.js', 
        'index.js', 
        'lib/**/*.js', 
        'test/**/*.js'
      ],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerTask('test', ['jshint', 'nodeunit:files']);

  grunt.registerTask('default', ['test']);

};

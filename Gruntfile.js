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
        'benchmark/**/*.js',
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
    },
    docco: {
      debug: {
        src: ['lib/**/*.js'],
        options: {
          output: 'docs/'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-docco2');

  grunt.registerTask('test', ['jshint', 'nodeunit:files']);

  grunt.registerTask('default', ['test', 'docco']);

};

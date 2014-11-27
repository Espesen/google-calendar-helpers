/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: false,
        boss: true,
        eqnull: true,
        laxcomma: true,
        globals: {
          console: true,
          require: true,
          module: true,
          jasmine: true,
          expect: true,
          beforeEach: true,
          before: true,
          afterEach: true,
          describe: true,
          it: true,
          xdescribe: true,
          xit: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      specFiles: {
        src: ['test/**/*.js']
      },
      lib: {
        src: ['*.js']
      }
    },
    jasmine_node: {
      options: {
        forceExit: true,
	verbose: true,
        match: '.',
        matchall: false,
        extensions: 'js',
        specNameMatcher: 'spec',
        jUnit: {
          report: true,
          savePath : "./build/reports/jasmine/",
          useDotNotation: true,
          consolidate: true
        }
      },
      all: ['test/']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'jasmine_node:all']
      },
      specFiles: {
        files: '<%= jshint.specFiles.src %>',
        tasks: ['jshint:specFiles', 'jasmine_node:all']
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  // Default task.
  grunt.registerTask('default', ['jshint', 'jasmine_node']);

};

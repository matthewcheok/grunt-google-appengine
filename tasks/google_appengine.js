/*
 * grunt-google-appengine
 * https://github.com/mehsome/grunt-google-appengine
 *
 * Copyright (c) 2013 Matthew Cheok
 * Licensed under the MIT license.
 */

'use strict';

var format = require('util').format;

module.exports = function(grunt) {

  grunt.registerMultiTask('google_appengine', 'Add tasks to Google App Engine.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      path: '.',
      args: {},
      email: null,
      password: null
    });
    var done = this.async();

    // Check if action was specified.
    if (!this.data.action) {
      return grunt.log.error('No action specified.');
    }

    // Launch local development server
    if (this.data.action === 'run') {
      // Add command line arguments
      var args = [];
      for (var field in options.args) {
        args.push(format('--%s=%s', field, options.args[field]));
      }
      // Add path component
      args.push(options.path);

      // Spawn server async
      var child = grunt.util.spawn({
        cmd: 'dev_appserver.py',
        args: args
      });

      // Route messages to grunt terminal
      child.stdout.on('data', function(data) {
        grunt.log.writeln(data);
      });

      child.stderr.on('data', function(data) {
        grunt.log.error(data);
      });

      child.on('error', function(error) {
        grunt.log.error(error);
      });

      // Artifical delay to let app engine messages appear before moving to next task
      setTimeout(function() {
        done();
      }, 2000);
    }
    // Other commands run synchronously
    else {
      // Check for credentials
      if (options.email.indexOf('@') === -1) {
        return grunt.log.error('Invalid email.');
      }
      if (!options.password) {
        return grunt.log.error('Invalid password.');
      }

      // Add email and no cookies flag (so credentials are not saved)
      var args = [];
      args.push('--no_cookies');
      args.push(format('--email=%s', options.email));
      args.push('--passin');

      // Add command line arguments
      for (var field in options.args) {
        args.push(format('--%s=%s', field, options.args[field]));
      }
      // Add command action component
      args.push(this.data.action);
      // Add path component
      args.push(options.path);

      // Run server and wait till done
      var child = grunt.util.spawn({
        cmd: 'appcfg.py',
        args: args
      }, function(error, result, code) {
        if (code === 0) {
          grunt.log.ok('Action executed successfully.');
        } else {
          grunt.log.error('Error executing the action.');
        }
        done();
      });

      // Pass in the password for the above email
      child.stdin.write(options.password);
      child.stdin.end();

      // Route messages to grunt terminal
      child.stdout.on('data', function(data) {
        grunt.log.writeln(data);
      });

      child.stderr.on('data', function(data) {
        grunt.log.error(data);
      });

      child.on('error', function(error) {
        grunt.log.error(error);
      });
    }
  });
};

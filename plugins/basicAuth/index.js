/**
 * Basic Authentication plugin
 *
 * Add HTTP Basic Access Authentication to the dashboard and API applications
 *
 * Installation
 * ------------
 * This plugin is disabled by default. To enable it, add its entry 
 * to the `plugins` key of the configuration:
 *
 *   // in config/production.yaml
 *   plugins:
 *     - ./plugins/basicAuth
 *
 * Usage
 * -----
 * Restart the application, and both the API and the Dashboard applications 
 * become protected. The monitor correctly authenticates its own calls to the API.
 * 
 * Default credentials are admin:password.
 *
 * Configuration
 * -------------
 * Set the username and password in the configuration file, under the
 * basicAuth key:
 *
 *   // in config/production.yaml
 *   basicAuth:
 *     username: JohnDoe
 *     password: S3cR3t
 */
var express = require('express');

exports.initWebApp = function(options) {
  var config = options.config.basicAuth;
  options.app.on('beforeFirstRoute', function(app, dashboardApp) {
    // app.use(express.basicAuth(config.username, config.password));

    app.use(function(req, res, next) {
      var auth;
  
      // check whether an autorization header was send    
      if (req.headers.authorization) {
        // only accepting basic auth, so:
        // * cut the starting "Basic " from the header
        // * decode the base64 encoded username:password
        // * split the string at the colon
        // -> should result in an array
        auth = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':');
      }
  
      // checks if:
      // * auth array exists 
      // * first value matches the expected user 
      // * second value the expected password
      if (!auth || auth[0] !== config.username || auth[1] !== config.password) {
          // any of the tests failed
          // send an Basic Auth request (HTTP Code: 401 Unauthorized)
          res.statusCode = 401;
          // MyRealmName can be changed to anything, will be prompted to the user
          res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
          // this will displayed in the browser when authorization is cancelled
          res.end('Unauthorized');
      } else {
          // continue with processing, user was authenticated
          next();
      }
  });

  });
};

exports.initMonitor = function(options) {
  var config = options.config.basicAuth;
  options.monitor.addApiHttpOption('auth',  config.username + ':' + config.password);
};
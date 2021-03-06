/**
* @author Shailendra Singh
*
* @email shailendra.4.singh@atos.net
*
* @description "Entry point of the app"
*
*/

var http = require('http');
var url = require('url');
var express = require('express');
var config = require('config');
var socketIo = require('socket.io');
var fs = require('fs');
var monitor = require('./lib/monitor');
var analyzer = require('./lib/analyzer');
var CheckEvent = require('./models/checkEvent');
var Ping = require('./models/ping');
var PollerCollection = require('./lib/pollers/pollerCollection');
var apiApp = require('./app/api/app');
var dashboardApp = require('./app/dashboard/app');

var errorhandler = require('errorhandler')
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var cookieParser = require('cookie-parser')
var cookieSession = require('cookie-session')
var path = require('path');

// database

var mongoose = require('./bootstrap');

var a = analyzer.createAnalyzer(config.analyzer);
a.start();

// web front

var app = module.exports = express();
var server = http.createServer(app);

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cookieParser('Z5V45V6B5U56B7J5N67J5VTH345GC4G5V4'));
app.use(cookieSession({
    key: 'uptime',
    secret: 'FZ5HEE5YHD3E566756234C45BY4DSFZ4',
    proxy: true,
    cookie: {
        maxAge: 60 * 60 * 1000
    }
}));
app.set('pollerCollection', new PollerCollection());

// load plugins (may add their own routes and middlewares)
config.plugins.forEach(function(pluginName) {
    var plugin = require(pluginName);
    if (typeof plugin.initWebApp !== 'function') return;
    console.log('loading plugin %s on app', pluginName);
    plugin.initWebApp({
        app: app,
        api: apiApp, // mounted into app, but required for events
        dashboard: dashboardApp, // mounted into app, but required for events
        io: io,
        config: config,
        mongoose: mongoose
    });
});

app.emit('beforeFirstRoute', app, apiApp);

app.use(express.static(__dirname + '/public'));
app.use(errorhandler());

// Routes
app.emit('beforeApiRoutes', app, apiApp);
app.use('/api', apiApp);

app.emit('beforeDashboardRoutes', app, dashboardApp);
app.use('/dashboard', dashboardApp);
app.get('/', function(req, res) {
    res.redirect('/dashboard/events');
});

app.get('/favicon.ico', function(req, res) {
    res.redirect(301, '/dashboard/favicon.ico');
});

app.emit('afterLastRoute', app);

// Sockets
var io = socketIo.listen(server);

io.set('log level', 1);

CheckEvent.on('afterInsert', function(event) {
    io.sockets.emit('CheckEvent', event.toJSON());
});

io.sockets.on('connection', function(socket) {
    socket.on('set check', function(check) {
        socket.check = check;
    });
    Ping.on('afterInsert', function(ping) {
        if (ping.check == socket.check) {
            socket.emit('ping', ping);
        }
    });
});

// old way to load plugins, kept for BC
fs.exists('./plugins/index.js', function(exists) {
    if (exists) {
        var pluginIndex = require('./plugins');
        var initFunction = pluginIndex.init || pluginIndex.initWebApp;
        if (typeof initFunction === 'function') {
            initFunction({
                app: app,
                api: apiApp, // mounted into app, but required for events
                dashboard: dashboardApp, // mounted into app, but required for events
                io: io,
                config: config,
                mongoose: mongoose
            });
        }
    }
});

module.exports = app;

var monitorInstance;

if (!module.parent) {
    var VCAP_APPLICATION, appURL;

    if (process.env.VCAP_APPLICATION) {
        VCAP_APPLICATION = JSON.parse(process.env.VCAP_APPLICATION);
        appURL = VCAP_APPLICATION.application_uris[0];
    } else {
        // LOCAL
        appURL = config.url;
    }
    var serverUrl = url.parse(appURL);
    var port;
    if (config.server && config.server.port) {
        console.error('Warning: The server port setting is deprecated, please use the url setting instead');
        port = config.server.port;
    } else {
        port = serverUrl.port;
        if (port === null) {
            port = 80;
        }
    }
    var port = process.env.PORT || port;
    var host = process.env.HOST || serverUrl.hostname;
    server.listen(port, function() {
        console.log("Express server listening on host %s, port %d in %s mode", host, port, app.settings.env);
    });
    server.on('error', function(e) {
        if (monitorInstance) {
            monitorInstance.stop();
            process.exit(1);
        }
    });
}

// monitor
if (config.autoStartMonitor) {
    monitorInstance = require('./monitor');
}
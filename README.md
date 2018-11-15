ACF Uptime
======

A remote monitoring application using Node JS, MongoDB, and Twitter Bootstrap.

Features
--------

* Monitor thousands of websites (powered by [Node.js asynchronous programming](http://redotheweb.com/2012/01/23/nodejs-for-php-programmers-1-event-driven-programming-and-pasta.html))
* Tweak frequency of monitoring on a per-check basis, up to the second
* Check the presence of a pattern in the response body
* Receive notifications whenever a check goes down
  * On screen (powered by [socket.io](http://socket.io/))
  * By email
  * On the console
* Record availability statistics for further reporting (powered by [MongoDB](http://www.mongodb.org/))
* Detailed uptime reports with animated charts (powered by [Flotr2](http://www.humblesoftware.com/flotr2/))
* Monitor availability, responsiveness, average response time, and total uptime/downtime
* Get details about failed checks (HTTP error code, etc.)
* Familiar web interface (powered by [Twitter Bootstrap](http://twitter.github.com/bootstrap/index.html))
* Easy installation and zero administration

## Code

* Main libraries:
	* NodeJS 5.5.0
	* Express.js 4.13.3
	* Socket.io 2.1.1

* Front End
	* EJS 2.6.1
	* Twitter Bootstrap

### Environment Variables

Required:

```
CF_DOMAIN=xxxxxx (e.g. sys.demo.labs.cf.canopy-cloud.com)
NODE_ENV=xxxxxx (e.g. production)
SMTP_HOST=xxxxxx (e.g. smtp.demo.net)
SMTP_USER_NAME=xxxxxx
SMTP_PASSWORD=xxxxxx
```

Installing ACF Uptime
-----------------

ACF Uptime requires Node JS 5.5.0 and MongoDB.

To install from GitHub, clone the repository and install dependencies using `npm`:

```sh
$ git clone XXXXX
$ cd acf-uptime
$ npm install
```

Lastly, start the application with:

```sh
$ node app

# => listening to http://localhost:8082
```

Adding Checks
-------------

By default, the web UI runs on port 8082 in local environment, so just browse to 

    http://localhost:8082/

And you're ready to begin. Create your first check by entering an URL, wait for the first ping, and you'll soon see data flowing through your charts!

Architecture
------------

ACF Uptime is composed of two services: a webapp (in `app.js`), and a polling monitor (in `monitor.js)`. For your convenience, the two services start together when you call `node app`.

However, heavily browsing the webapp may slow down the whole server - including the polling monitor. In other terms, using the application can influence the uptime measurements. To avoid this effect, it is recommended to run the polling monitor in a separate process.

To that extent, set the `autoStartMonitor` setting to `false` in the `production.yaml`, and launch the monitor by hand:

```sh
$ node monitor &
$ node app
```

Don't forget to set `NODE_ENV=production` if you want to run the app in production environment.

You can also run the monitor in a different server. This second server must be able to reach the API of the webapp server: set the `monitor.apiUrl` setting accordingly in the `production.yaml` file of the monitor server.

### Status codes

The API is designed to return different status codes :

* `200 Ok` : The request was successful, the resource(s) itself is returned as JSON
* `400 Bad Request` : An attribute of the API request is invalid or missing (e.g. the url of a check is missing)
* `404 Not Found` : A resource could not be accessed (e.g. a check ID could not be found)
* `500 Server Error` : Something went wrong on the server side (e.g. a check could not be saved in database)


/**
* @author Shailendra Singh
*
* @email shailendra.4.singh@atos.net
*
* @description "MongoDB"
*
*/

var mongoose = require('mongoose');
var config = require('config');
var semver = require('semver');

// configure mongodb

var mongoDBConnectionString, VCAP_SERVICES, dbUsername, dbPassword, dbHost, dbName;

if (process.env.VCAP_SERVICES) {
    VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES);
    dbUsername = VCAP_SERVICES.mongodb[0].credentials.username;
    dbPassword = VCAP_SERVICES.mongodb[0].credentials.password;
    dbHost = VCAP_SERVICES.mongodb[0].credentials.host;
    dbName = VCAP_SERVICES.mongodb[0].credentials.database;

    mongoDBConnectionString = 'mongodb://' + dbUsername + ':' + dbPassword + '@' + dbHost + '/' + dbName;
} else {
    // LOCAL
    mongoDBConnectionString = "mongodb://localhost:27017/uptime" // Only for local env;
    dbUsername = config.mongodb.user;
    dbPassword = config.mongodb.password;
}

mongoose.connect(mongoDBConnectionString);

mongoose.connection.on('error', function(err) {
    console.error('MongoDB error: ' + err.message);
    console.error('Make sure a mongoDB server is running and accessible by this application');
    process.exit(1);
});
mongoose.connection.on('open', function(err) {
    mongoose.connection.db.admin().serverStatus(function(err, data) {
        if (err) {
            if (err.name === "MongoError" && (err.errmsg === 'need to login' || err.errmsg === 'unauthorized') && !config.mongodb.connectionString) {
                console.log('Forcing MongoDB authentication');
                mongoose.connection.db.authenticate(dbUsername, dbPassword, function(err) {
                    if (!err) return;
                    console.error(err);
                    process.exit(1);
                });
                return;
            } else {
                console.error(err);
                process.exit(1);
            }
        }
        if (!semver.satisfies(data.version, '>=2.1.0')) {
            console.error('Error: Uptime requires MongoDB v2.1 minimum. The current MongoDB server uses only ' + data.version);
            process.exit(1);
        }
    });
});

module.exports = mongoose;
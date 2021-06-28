/*
*
*   Glavna datoteka servera
*   Učitavanje potrebnih biblioteka
*   Razvrstavanje /ruta
*   Provjera autentičnosti ( authentication ) klijenta prilikom svakog zahtjeva
*
*/

var fs = require('fs'); // Get the file system
var path = require('path'); // Core Module in Node JS
//var https = require('https'); // Core Module in Node JS

// SSL Credentials

//var privateKey  = fs.readFileSync( 'sslcert/server.key', 'utf8' );
//var certificate = fs.readFileSync( 'sslcert/server.crt', 'utf8' );
//var credentials = { key: privateKey, cert: certificate };

var express = require('express'); // Adds features to Node JS
var { body, query, params, validationResult } = require('express-validator'); // Use the express validator to validate forms
var bodyParser = require('body-parser'); // Parses JSON and Encoded URL (objects when POSTing)
var cors = require('cors'); // Use the CORS middleware to enable it
var jwt = require('jsonwebtoken'); // Use the JWT ( JSON WEB TOKEN )
var nodemailer = require("nodemailer"); // Use nodemailer for sending verification emails
//var smtpTransport = require('nodemailer-smtp-transport'); // Use the smtp transport

const config = require('./config.js'); // Get the config
var MessageList = require( './message_config' ); // Get the message list

var User = require( './models/user.js' ); // Get the user model

var CacheService = require( './cache.js' ); // Require the Cache class
global.cache = new CacheService( 60 * 60 * 1 ); // Define the global cache

// Init App
var app = express(); // Initialize Express and store the object in the app variable

app.use( express.static( __dirname + '/public' ) ); // Set the static location for files ( CSS, JS etc. )

// BodyParser Middleware
app.use(bodyParser.json()); // Use the body parser JSON parser
app.use(bodyParser.urlencoded({ extended: true })); // Use the body parser URL Encoded parser
                                                    //( extended: false - nested objects won't be parsed )

var authenticationRoute = require( './routes/authentication.js' ); // Require the authentication routing class
var accountRoute = require( './routes/account.js' ); // Require the account routing class
var purchasesRoute = require( './routes/purchases.js' ); // Require the purchases routing class
var chatRoute = require( './routes/chat.js' ); // Require the chat routing class
var searchRoute = require( './routes/search.js' ); // Require the search routing class
var jobsRoute = require( './routes/jobs.js' ); // Require the jobs routing class
var usersRoute = require( './routes/users.js' ); // Require the users routing class
var recruitersRoute = require( './routes/recruiters.js' ); // Require the recruiters routing class
var applicationsRoute = require( './routes/application.js' ); // Require the applications routing class
var reportsRoute = require( './routes/reports.js' ); // Require the reports routing class
//var purchasesRoute = require( './routes/purchases.js' ); // Require the purchases routing class

app.use( function( req, res, next ) { // Allow access to apps and certain headers
    res.header( "Access-Control-Allow-Origin", "*" ); // Allow anyone to access this server
    res.header( "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept" ); // Allow these headers
    next(); // Go to the next middleware
} );

app.use( cors( ) )

// Route middleware to verify a token on each visit
app.use( async function( req, res, next ) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if ( req.url == '/login' || req.url == '/register' || req.url == '/token/webhook' || req.url == '/buy' || req.url == '/email' || req.url == '/registerRecruiter' || req.url.startsWith( '/verify' ) || req.url.startsWith( '/reset' ) || req.url.startsWith( '/delete' ) || req.url.startsWith( '/facebook' ) ) {
        next(); // Continue to the next middleware
        return; // Return to prevent further actions
    }

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // If the token was provided
    if ( token ) {
        // Verifies secret and checks EXP
        jwt.verify(token, config.jwt.secret, function( err, decoded ) { // Verify the provided token
            if ( err ) { // If there was an error
                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                res.json( { message: MessageList.error.token.failed_to_authenticate } ); // Send the message to the user
                return; // Return to prevent further actions
            } else {
                if ( global.cache.get( ( 'login-' + decoded.id ) ) == null ) { // Check the cache for the login key and if it's null
                    
                    if ( decoded.type == 'user' ) { // If the user is a normal user
                        User.getUserInfo( 'UserBanned, UserLoginKey', 'UserID', decoded.id ).then( ( result ) => { // Get the user login key from DB

                            if( result.length == 0 ) { // If the user doesn't exist
                                res.status( 404 ); // Set the status code to 404 ( Not Found )
                                res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
                                return; // Return to prevent further actions
                            }

                            if ( result[0].UserBanned == 1 ) { // If the user has been banned
                                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                                res.json( { message: MessageList.error.account.suspended } ); // Send back the errors to the client
                                return; // Return to prevent further actions
                            }

                            if ( result[0].UserLoginKey == decoded.key ) { // If the login keys match

                                global.cache.set( ( 'login-' + decoded.id ), result[0].UserLoginKey ); // Cache the login key

                                // If everything is good, save to request for use in other routes
                                req.token = token; // Set the request variable token
                                req.decoded = decoded; // Set the request variale decoded
                                next(); // Go to the next middleware
                            } else {
                                res.status( 406 ); // Set the status code to 406 ( Not Acceptable )
                                res.json( { message: MessageList.error.account.logged_on_another_device } ); // Send the message to the user
                                return; // Return to prevent further actions
                            }

                        } );
                    } else if ( decoded.type == 'recruiter' ) { // If the user is a recruiter
                        User.getRecruiterInfo( 'RecruiterBanned, RecruiterLoginKey', 'RecruiterID', decoded.id ).then( ( result ) => { // Get the recruiter login key from DB

                            if( result.length == 0 ) { // If the recruiter doesn't exist
                                res.status( 404 ); // Set the status code to 404 ( Not Found )
                                res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the errors back to the client
                                return; // Return to prevent further actions
                            }

                            if ( result[0].RecruiterBanned == 1 ) { // If the recruiter has been banned
                                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                                res.json( { message: MessageList.error.account.suspended } ); // Send back the errors to the client
                                return; // Return to prevent further actions
                            }

                            if ( result[0].RecruiterLoginKey == decoded.key ) { // If the login keys match

                                global.cache.set( ( 'login-' + decoded.id ), result[0].RecruiterLoginKey ); // Cache the login key

                                // If everything is good, save to request for use in other routes
                                req.token = token; // Set the request variable token
                                req.decoded = decoded; // Set the request variale decoded
                                next(); // Go to the next middleware
                            } else {
                                res.status( 406 ); // Set the status code to 406 ( Not Acceptable )
                                res.json( { message: MessageList.error.account.logged_on_another_device } ); // Send the message to the user
                                return; // Return to prevent further actions
                            }

                        } );
                    }
                    return; // Return to prevent further actions
                }

                if ( global.cache.get( ( 'login-' + decoded.id ) ) != decoded.key ) { // If the key is cached and doesn't match
                    res.status( 406 ); // Set the status code to 406 ( Not Acceptable )
                    res.json( { message: MessageList.error.account.logged_on_another_device } ); // Send the message to the user
                    return; // Return to prevent further actions
                }
                
                // If everything is good, save to request for use in other routes
                req.token = token; // Set the request variable token
                req.decoded = decoded; // Set the request variale decoded
                next(); // Go to the next middleware
            }
        } );
    } else {
        // If a token isn't provided, restrict access
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.token.required } ); // Send the message to the user
        return; // Return to prevent further actions
    }
} );

app.use( '/', authenticationRoute ); // Mount the authentication route to /
app.use( '/', accountRoute ); // Mount the account route to /
app.use( '/', purchasesRoute ); // Mount the purchases route to /
app.use( '/', chatRoute ); // Mount the chat route to /
app.use( '/', searchRoute ); // Mount the search route to /
app.use( '/job', jobsRoute ); // Mount the jobs route to the /job
app.use( '/user', usersRoute ); // Mount the users route to the /user
app.use( '/recruiter', recruitersRoute ); // Mount the recruiters route to the /recruiter
app.use( '/applications', applicationsRoute ); // Mount the recruiters route to the /applications
app.use( '/report', reportsRoute ); // Mount the reports route to the /report
//app.use( '/purchase', purchasesRoute ); // Mount the purchases route to the /purchase

// Set up the SMTP Server ( responsible for sending and receiving emails )
global.smtpTransport = nodemailer.createTransport( {
    name: config.mail.name,
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
        type: config.mail.auth.type,
        user: config.mail.auth.user,
        clientId: config.mail.auth.clientId,
        clientSecret: config.mail.auth.clientSecret,
        refreshToken: config.mail.auth.refreshToken,
        accessToken: config.mail.auth.accessToken
    }
} );

// Set Port
app.set( 'port', config.app.port );  // Set the port the config value

//var server = https.createServer( credentials, app );

var server = app.listen( app.get( 'port' ), (  ) => { // Start the server on the specified port
    console.log( '| Server Started | PORT: '+ app.get( 'port' ) + " |" ); // Notify us that the server has started
} );

var socket = require('./socket.js').create( server ); // Get the socket IO server
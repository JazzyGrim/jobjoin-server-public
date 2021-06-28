var fs = require('fs'); // Get the file system
var path = require('path'); // Core Module in Node JS

var express = require('express'); // Get the express so that we can get the router
var { body, validationResult } = require('express-validator'); // Use the express validator to validate forms

var router = express.Router(); // We don't have the app variable so we use the Router class to route from here

var bcrypt = require( 'bcryptjs' ); // Use Bcyrpt to hash strings
var jwt = require('jsonwebtoken'); // Use the JWT ( JSON WEB TOKEN )
var handlebars = require('handlebars'); // Get handlebars
var fetch = require('node-fetch'); // Get node-fetch
var ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId();

const config = require('../config.js'); // Get the config

var User = require( '../models/user.js' ); // Get the user model

var MessageList = require( '../message_config' ); // Get the message list
var VM = require( '../verification_config' ); // Get the verification message list

var FB = require('fb');

router.get( '/check-token', ( req, res ) => { // When visiting /check-token
    res.status( 200 ); // Set the status code to 200
    res.end( ); // End the response
} );

router.post( '/register', [ 

    body('userFirstName', VM.required( 'firstName' ) ).not( ).isEmpty(), // If the first name isn't empty
	body('userFirstName', VM.alpha( 'firstName' ) ).matches( /^[a-z\u0100-\u017F]+$/i ), // If the first name contains only letters
	body('userFirstName', VM.length( 'firstName', 2, 16 ) ).isLength(2, 16), // If the first name meets the length requirements
    body('userLastName',  VM.required( 'lastName' ) ).not( ).isEmpty(), // If the last name isn't empty
	body('userLastName', VM.alpha( 'lastName' ) ).matches( /^[a-z\-\u0100-\u017F]+$/i ), // If the last name contains only letters
	body('userLastName', VM.length( 'lastName', 2, 20 ) ).isLength(2, 20), // If the last name meets the length requirements
    body('userEmail', VM.required( 'email' ) ).not( ).isEmpty(), // If the email isn't empty
    body('userEmail', VM.not_valid( 'email' ) ).isEmail(), // If the email is valid
	body('userEmail', VM.length( 'email', 8, 40 ) ).isLength(8, 40), // If the email meets the length requirements
	body('userPassword', VM.required( 'password' ) ).not( ).isEmpty(), // If the password isn't empty
    body('userPassword', VM.length( 'password', 6, 30 ) ).isLength(3, 30), // If the password meets the length requirements
    body('userAddress', VM.length( 'address', 3, 100 ) ).optional( ).isLength(3, 100), // If the address meets the length requirements
    body('userCity', VM.required( 'city' ) ).optional( ).not( ).isEmpty(), // If the city isn't empty
    body('userCity', VM.alpha_and_spaces( 'city' ) ).optional( ).not( ).matches( '\d' ), // If the city only contains letters and spaces
    body('userCity', VM.required( 'city', 3, 100 ) ).optional( ).isLength(3, 40), // If the city meets the length requirements
    body('userState', VM.required( 'state' ) ).not( ).optional( ).isEmpty(), // If the state isn't empty
    body('userState', VM.length( 'state', 2, 50 ) ).optional( ).isLength(2, 50), // If the state meets the length requirements
    body('userZip', VM.alphanumeric( 'zip' ) ).optional( ).matches( /^[a-z0-9 \-\u0100-\u017F]+$/i ), // If the ZIP only contains letters and numbers
    body('userZip', VM.length( 'zip', 2, 12 ) ).optional( ).isLength(2, 12), // If the ZIP meets the length requirements
    body('userCountry', VM.required( 'country' ) ).optional( ).not( ).isEmpty(), // If the country isn't empty
    body('userCountry', VM.length( 'country', 2, 45 ) ).optional( ).isLength(2, 45), // If the country meets the length requirements
    body('userLat', VM.numeric( 'lat' ) ).optional( { nullable: true } ).isFloat(), // If the lat is a float
    body('userLat', VM.not_valid( 'lat' ) ).optional( { nullable: true } ).custom( ( lat ) => { // Define a custom validator
        if ( lat >= -90 && lat <= 90 ) return true; // If the lat is valid return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('userLong', VM.numeric( 'long' ) ).optional( { nullable: true } ).isFloat(), // If the lat is a float
    body('userLong', VM.not_valid( 'long' ) ).optional( { nullable: true } ).custom( ( long ) => { // Define a custom validator
        if ( long >= -180 && long <= 180 ) return true; // If the lat is valid return true ( no error )
        return false; // Otherwise return false ( error )
    } )

 ], ( req, res ) => { // When posting to /register
    
    var firstName = req.body.userFirstName; // Create a variable for the first name
    var lastName = req.body.userLastName; // Create a variable for the last name
    var email = req.body.userEmail; // Create a variable for the email
    var password = req.body.userPassword; // Create a variable for the password
    var address = req.body.userAddress; // Create a variable for the address
    var city = req.body.userCity; // Create a variable for the city
    var state = req.body.userState; // Create a variable for the state
    var zip = req.body.userZip; // Create a variable for the ZIP
    var country = req.body.userCountry; // Create a variable for the country
    var lat = req.body.userLat; // Create a variable for the lat
    var long = req.body.userLong; // Create a variable for the long
    var pushToken = req.body.pushToken; // Create a variable for the push token

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable
    console.log( req.body );
    console.log( errors );
    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    hashEmail( email ).then( ( hash ) => {

        var user = { // Define a user object
            firstName: firstName, // Set the first name
            lastName: lastName, // Set the last name
            email: email, // Set the email
            password: password, // Set the password
            hash: hash, // Set the user verification hash
            pushToken: pushToken, // Set the user push token
            address: address, // Set the address
            city: city, // Set the city
            state: state, // Set the state
            zip: zip, // Set the zip
            country: country, // Set the country
            lat: lat, // Set the latitude
            long: long, // Set the longitude
            imagePath: null, // Set the user image path
            facebookID: null // Set the user Facebook ID
        }

        User.createUser( user ).then( ( result ) => { // Create the new user

            var ID = uid.randomUUID( 11 ); // Generate a unique ID

            var token = jwt.sign( { type: 'user', id: result, key: ID }, config.jwt.secret );
                    // Create a new token containing the user's info
                    // Make it have a 504-bit WPA key as a secret
            res.status( 202 ); // // Set the status code to 202 ( Accepted )
            res.json( { token: token, id: result, type: 'user' } ); // Send the token as the result

            User.createLoginToken( result, ID ).then( ( tokenResult ) => { // Create a login key

                global.cache.set( ( 'login-' + result.id ), ID ); // Cache the login key

            } ).catch( ( error ) => {
                console.log( error ); // Log the error
            } );

            fs.readFile( path.join( __dirname, "../registerTemplate.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                if ( err ) { // If there was an error reading the file
                    console.log( err ); // Print the error message to the console
                    return; // Return to prevent further actions
                }
        
                var link = "http://" + req.get( 'host' ) + "/verify?id=" + hash + "&for=" + email + "&t=u"; // Create a variable for the verification link
                var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                var variables = { // Create a variables object
                    firstName: firstName, // Set the first name to the user's first name
                    link: link // Set the link to the verification link
                };
                var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                
                var mailOptions = { // Create a variable for the mail options
                    to: email, // Set the receiver e-mail
                    from: 'Mateo from JOBJOIN <matej.sindo@gmail.com>', // Set the sender's name
                    subject: "Verify your JobJoin account", // Set the e-mail subject
                    html: htmlToSend // Set the e-mail content
                }
                global.smtpTransport.sendMail( mailOptions, ( error, response ) => { // Send the e-mail
                    
                    if( error ) { // If there was an error
                        console.log( error ); // If there was an error output it to the console
                        return; // Return to prevent further actions
                    }
                    console.log('Registration email has been sent.'); // Log the confirmation message
                });
        
            });

        } ).catch( ( error ) => { // Catch errors
            if ( typeof error === 'string' ) { // If the error is a string
                res.status( 409 ); // Set the status code to 409 ( Conflict )
                res.json( { message: MessageList.error.email.taken } ); // Send the message back to the client
            } else if( error.code == "ER_DUP_ENTRY" ) { // If there is a duplicate entry error
                res.status( 409 ); // Set the status code to 409 ( Conflict )
                res.json( { message: MessageList.error.email.taken } ); // Send the message back to the client
            } else {
                console.log( error ); // Log the error
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
            }
        } );

    } ).catch( ( error ) => {
        console.log( error ); // Log the error
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/registerRecruiter', [ 

    body('recruiterFirstName', VM.required( 'firstName' ) ).not( ).isEmpty(), // If the first name isn't empty
	body('recruiterFirstName', VM.alpha( 'firstName' ) ).matches( /^[a-z\u0100-\u017F]+$/i ), // If the first name contains only letters
	body('recruiterFirstName', VM.length( 'firstName', 2, 16 ) ).isLength(2, 16), // If the first name meets the length requirements
    body('recruiterLastName', VM.required( 'lastName' ) ).not( ).isEmpty(), // If the last name isn't empty
	body('recruiterLastName', VM.alpha( 'lastName' ) ).matches( /^[a-z\-\u0100-\u017F]+$/i ), // If the last name contains only letters
	body('recruiterLastName', VM.length( 'lastName', 2, 20 ) ).isLength(2, 20), // If the last name meets the length requirements
    body('recruiterCompanyName', VM.required( 'companyName' ) ).not( ).isEmpty(), // If the company name isn't empty
    body('recruiterCompanyName', VM.length( 'companyName', 3, 30 ) ).isLength(3, 30), // If the company name meets the length requirements
    body('recruiterEmail', VM.required( 'email' ) ).not( ).isEmpty(), // If the email isn't empty
    body('recruiterEmail', VM.not_valid( 'email' ) ).isEmail(), // If the email is valid
	body('recruiterEmail', VM.length( 'email', 8, 40 ) ).isLength(8, 40), // If the email meets the length requirements
	body('recruiterPassword', VM.required( 'password' ) ).not( ).isEmpty(), // If the password isn't empty
    body('recruiterPassword', VM.length( 'password', 6, 30 ) ).isLength(6, 30), // If the password meets the length requirements

 ], ( req, res ) => { // When posting to /registerRecruiter

    var firstName = req.body.recruiterFirstName; // Create a variable for the first name
    var lastName = req.body.recruiterLastName; // Create a variable for the last name
    var companyName = req.body.recruiterCompanyName; // Create a variable for the company name
    var email = req.body.recruiterEmail; // Create a variable for the email
    var password = req.body.recruiterPassword; // Create a variable for the password

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    hashEmail( email ).then( ( hash ) => {

        var recruiter = { // Define a recruiter object
            firstName: firstName, // Set the first name
            lastName: lastName, // Set the last name
            companyName: companyName, // Set the company name
            email: email, // Set the recruiter email
            password: password, // Set the recruiter password
            hash: hash, // Set the recruiter verification hash
            imagePath: null, // Set the recruiter image path
            facebookID: null // Set the recruiter Facebook ID
        }

        User.createRecruiter( recruiter ).then( ( result ) => { // Create the new recruiter

            var ID = uid.randomUUID( 11 ); // Generate a unique ID

            var token = jwt.sign( { type: 'recruiter', id: result, key: ID }, config.jwt.secret );
                    // Create a new token containing the user's info
                    // Make it have a 504-bit WPA key as a secret
            res.status( 202 ); // // Set the status code to 202 ( Accepted )
            res.json( { token: token, id: result, type: 'recruiter' } ); // Send the token as the result

            User.createRecruiterLoginToken( result, ID ).then( ( tokenResult ) => { // Create a login key

                global.cache.set( ( 'login-' + result ), ID ); // Cache the login key

            } ).catch( ( error ) => {
                console.log( error ); // Log the error
            } );

            fs.readFile( path.join( __dirname, "../registerTemplate.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                if ( err ) { // If there was an error reading the file
                    console.log( err ); // Print the error message to the console
                    return; // Return to prevent further actions
                }
        
                var link = "http://" + req.get( 'host' ) + "/verify?id=" + hash + "&for=" + email + "&t=r"; // Create a variable for the verification link
                var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                var variables = { // Create a variables object
                    firstName: firstName, // Set the first name to the user's first name
                    link: link // Set the link to the verification link
                };
                var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                
                var mailOptions = { // Create a variable for the mail options
                    to: email, // Set the receiver e-mail
                    from: 'Mateo from JOBJOIN <matej.sindo@gmail.com>', // Set the sender's name
                    subject: "Verify your JobJoin account", // Set the e-mail subject
                    html: htmlToSend // Set the e-mail content
                }
                global.smtpTransport.sendMail( mailOptions, ( error, response ) => { // Send the e-mail
                    
                    if( error ) { // If there was an error
                        console.log( error ); // If there was an error output it to the console
                        return; // Return to prevent further actions
                    }
                    console.log('Registration email has been sent.'); // Log the confirmation message
                });
        
            });

        } ).catch( ( error ) => { // Catch errors
            if ( typeof error === 'string' ) { // If the error is a string
                res.status( 409 ); // Set the status code to 409 ( Conflict )
                res.json( { message: MessageList.error.email.taken } ); // Send the message back to the client
            } else if( error.code == "ER_DUP_ENTRY" ) { // If there is a duplicate entry error
                res.status( 409 ); // Set the status code to 409 ( Conflict )
                res.json( { message: MessageList.error.email.taken } ); // Send the message back to the client
            } else {
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
            }
        } );

    } ).catch( ( error ) => {
        console.log( error ); // Log the error
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/facebook/:type', [

    body('address', VM.length( 'address', 3, 100 ) ).optional( ).isLength(3, 100), // If the address meets the length requirements
    body('city', VM.required( 'city' ) ).optional( ).not( ).isEmpty(), // If the city isn't empty
    body('city', VM.alpha_and_spaces( 'city' ) ).optional( ).not( ).matches( '\d' ), // If the city only contains letters and spaces
    body('city', VM.length( 'city', 3, 40 ) ).optional( ).isLength(3, 40), // If the city meets the length requirements
    body('state', VM.required( 'state' ) ).optional( ).not( ).isEmpty(), // If the state isn't empty
    //body('userState', 'The User state only contain letters and numbers.').optional( ).matches('^[a-zA-Z ]+$'), // If the state only contains letters and numbers
    body('state', VM.length( 'state', 2, 50 ) ).optional( ).isLength(2, 50), // If the state meets the length requirements
    body('zip', VM.alphanumeric( 'zip' ) ).optional( ).isAlphanumeric( ), // If the ZIP only contains letters and numbers
    body('zip', VM.length( 'zip', 2, 12 ) ).optional( ).isLength(2, 12), // If the ZIP meets the length requirements
    body('country', VM.required( 'country' ) ).optional( ).not( ).isEmpty(), // If the country isn't empty
    body('country', VM.length( 'country', 2, 45 ) ).optional( ).isLength(2, 45), // If the country meets the length requirements
    /*body('userCountry', 'User Country can only be United States.').optional( ).custom( ( country ) => { // Define a custom validator
        if ( country === 'United States' ) return true; // If the country is listed return true ( no error )
        return false; // Otherwise return false ( error )
    } ),*/
    body('lat', VM.numeric( 'lat' ) ).optional( ).isFloat(), // If the lat is a float
    body('lat', VM.between( 'lat', -90, 90 ) ).optional( ).custom( ( lat ) => { // Define a custom validator
        if ( lat >= -90 && lat <= 90 ) return true; // If the lat is valid return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('long', VM.numeric( 'long' ) ).optional( ).isFloat(), // If the lat is a float
    body('long', VM.between( 'long', -180, 180 ) ).optional( ).custom( ( long ) => { // Define a custom validator
        if ( long >= -180 && long <= 180 ) return true; // If the lat is valid return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('recruiterCompanyName', VM.required( 'companyName' ) ).optional( ).not( ).isEmpty(), // If the company name isn't empty
    body('recruiterCompanyName', VM.length( 'companyName', 3, 30 ) ).optional( ).isLength(3, 30) // If the company name meets the length requirements

], ( req, res ) => {

    var companyName = req.body.recruiterCompanyName; // Create a variable for the company name

    var address = req.body.address; // Create a variable for the address
    var city = req.body.city; // Create a variable for the city
    var state = req.body.state; // Create a variable for the state
    var zip = req.body.zip; // Create a variable for the ZIP
    var country = req.body.country; // Create a variable for the country
    var lat = req.body.lat; // Create a variable for the lat
    var long = req.body.long; // Create a variable for the long
    var pushToken = req.body.pushToken; // Create a variable for the push token

    let accountType = req.params.type;

    FB.api('/me', { fields: [ 'id', 'email', 'first_name', 'last_name', 'birthday', 'picture.width(400).height(400)' ], access_token: req.body.accessToken } ).then( result => {

        new Promise( ( resolve, reject ) => { // For different types of users ( with and without an email )

            if ( result.email == null ) { // If the user DOESN'T have an email

                User.findUserFacebook( result.id ).then( ( userResult ) => { // Find a user based on their Facebook ID

                    resolve( userResult ); // Resolve the promise with the found user

                } ).catch( ( error ) => {
                    reject( error ); // Reject the promise with the error
                } );

            } else { // If the user DOES have an email

                User.findUser( result.email ).then( ( userResult ) => { // Find a user based on their email

                    resolve( userResult ); // Resolve the promise with the found user

                } ).catch( ( error ) => {
                    reject( error ); // Reject the promise with the error
                } );

            }

        } ).then( ( userResult ) => {
            
            if( userResult == null ) { // If the user doesn't exist

                var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

                if ( errors.length ) { // If Express Validator finds errors in the given fields
                    res.status( 449 ); // Set the status code to 449 ( Retry With )
                    res.json( errors ); // Send the errors back to the client
                    return; // Return to prevent further actions
                }

                if ( accountType == 'user' ) { // If the user is registering as a user
                    
                    if ( address == '' || address == null
                        || city == '' || city == null
                        || state == '' || state == null
                        || zip == '' || zip == null
                    ) {
                        res.status( 422 ); // Set the status code to 449 ( Unprocessable Entity )
                        res.json( { message: MessageList.error.facebook.provide_address } ); // Send the errors back to the client
                        return;
                    }

                    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable
                
                    if ( errors.length ) { // If Express Validator finds errors in the given fields
                        res.status( 449 ); // Set the status code to 449 ( Retry With )
                        res.json( errors ); // Send the errors back to the client
                        return; // Return to prevent further actions
                    }

                    var birthday = new Date( result.birthday ).toJSON( ).slice( 0, 10 );

                    var user = { // Define a user object
                        firstName: result.first_name, // Set the first name
                        lastName: result.last_name, // Set the last name
                        birthday: birthday, // Set the birth day
                        email: result.email, // Set the email
                        hash: null, // Set the user verification hash
                        pushToken: pushToken, // Set the user push token
                        facebookID: result.id, // Set the user Facebook ID
                        address: address, // Set the address
                        city: city, // Set the city
                        state: state, // Set the state
                        zip: zip, // Set the zip
                        country: country, // Set the country
                        lat: lat, // Set the latitude
                        long: long, // Set the longitude
                        imagePath: result.picture.data.url // Set the user image path
                    }
            
                    User.createUserWithoutPassword( user ).then( ( result ) => { // Create the new user
                        
                        var ID = uid.randomUUID( 11 ); // Generate a unique ID

                        var token = jwt.sign( { type: 'user', id: result, key: ID }, config.jwt.secret );
                                // Create a new token containing the user's info
                                // Make it have a 504-bit WPA key as a secret
                        res.status( 202 ); // // Set the status code to 202 ( Accepted )
                        res.json( { token: token, id: result, type: 'user' } ); // Send the token as the result
                        
                        User.createLoginToken( result, ID ).then( ( tokenResult ) => { // Create a login key

                            global.cache.set( ( 'login-' + result.id ), ID ); // Cache the login key

                            User.setPushToken( result, pushToken ).then( ( ) => {

                                global.cache.set( ( 'key-' + result ), pushToken ); // Cache the push token
    
                            } ).catch( ( error ) => {
                                console.log( error ); // Log the error
                            } );

                        } ).catch( ( error ) => {
                            console.log( error ); // Log the error
                        } );
            
                    } ).catch( ( error ) => { // Catch errors
                        console.log( error );
                        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                    } );

                } else if ( accountType == 'recruiter' ) { // If the user is registering as a recruiter

                    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

                    if ( errors.length ) { // If Express Validator finds errors in the given fields
                        res.status( 449 ); // Set the status code to 449 ( Retry With )
                        res.json( errors ); // Send the errors back to the client
                        return; // Return to prevent further actions
                    }
                    
                    var recruiter = { // Define a recruiter object
                        firstName: result.first_name, // Set the first name
                        lastName: result.last_name, // Set the last name
                        companyName: companyName, // Set the company name
                        email: result.email, // Set the recruiter email
                        hash: null, // Set the recruiter verification hash
                        facebookID: result.id, // Set the recruiter Facebook ID
                        imagePath: result.picture.data.url // Set the recruiter image path
                    }

                    User.createRecruiterWithoutPassword( recruiter ).then( ( result ) => { // Create the new recruiter

                        var ID = uid.randomUUID( 11 ); // Generate a unique ID

                        var token = jwt.sign( { type: 'recruiter', id: result, key: ID }, config.jwt.secret );
                                // Create a new token containing the user's info
                                // Make it have a 504-bit WPA key as a secret
                        res.status( 202 ); // // Set the status code to 202 ( Accepted )
                        res.json( { token: token, id: result, type: 'recruiter' } ); // Send the token as the result

                        User.createRecruiterLoginToken( result, ID ).then( ( tokenResult ) => { // Create a login key

                            global.cache.set( ( 'login-' + result ), ID ); // Cache the login key

                        } ).catch( ( error ) => {
                            console.log( error ); // Log the error
                        } );
            
                    } ).catch( ( error ) => { // Catch errors
                        console.log( error ); // Log the error to the console
                        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                    } );

                } else { // If the account type is something else
                    res.status( 404 ); // Set the status code to 404 ( Not Found )
                    res.json( { message: MessageList.error.user_type.unkown_account_type } ); // Send the message back to the client
                }


                return; // We were trying to register, don't attempt a login
            }

            if ( userResult.facebookID == null ) { // If the user doesn't have a facebook ID
                
                // Link this facebook account to the normal account
                if ( userResult.type == 'user' ) {
                    User.updateUserFacebookID( userResult.id, result.id ).catch( error => {
                        console.log( error );
                    } );
                } else {
                    User.updateRecruiterFacebookID( userResult.id, result.id ).catch( error => {
                        console.log( error );
                    } );
                }
                
            }

            if ( userResult.banned == 1 ) { // If the user has been banned
                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                res.json( { message: MessageList.error.account.suspended } ); // Send back the errors to the client
                return; // Return to prevent further actions
            }

            var ID = uid.randomUUID( 11 ); // Generate a unique ID

            var token = jwt.sign( { type: userResult.type, id: userResult.id, key: ID }, config.jwt.secret );
            // Create a new token containing the user's info
            // Make it have a 504-bit WPA key as a secret
            res.status( 202 ); // // Set the status code to 202 ( Accepted )
            res.json( { token: token, id: userResult.id, type: userResult.type } ); // Send the token as the result

            if ( userResult.type == 'user' ) { // If the user is a normal user
                User.setPushToken( userResult.id, pushToken ).then( ( ) => {

                    global.cache.set( ( 'key-' + userResult.id ), pushToken ); // Cache the push token

                } ).catch( ( error ) => {
                    console.log( error ); // Log the error
                } );

                User.createLoginToken( userResult.id, ID ).then( ( tokenResult ) => { // Create a login key

                    global.cache.set( ( 'login-' + userResult.id ), ID ); // Cache the login key

                } ).catch( ( error ) => {
                    console.log( error ); // Log the error
                } );
            } else if ( userResult.type == 'recruiter' ) { // If the user is a recruiter
                User.createRecruiterLoginToken( userResult.id, ID ).then( ( tokenResult ) => { // Create a login key

                    global.cache.set( ( 'login-' + userResult.id ), ID ); // Cache the login key

                } ).catch( ( error ) => {
                    console.log( error ); // Log the error
                } );
            }

        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );
        
    } ).catch( error => {
        console.log( error ); // Log the error
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        
        ( error.response.error.code === 'ETIMEDOUT' ) ? console.log( 'request timeout' ) : console.log( 'error', error.message );

    } );

} );

router.post( '/logout', ( req, res ) => {

    const id = req.decoded.id; // Set the user ID variable

    User.setPushToken( id, null ).then( ( ) => {
        global.cache.del( 'key-' + id ); // Remove the push token from cache
    } ).catch( ( error ) => {
        console.log( error ); // Log the error
    } );

} );

router.post( '/login', [

    body('loginEmail', VM.required( 'email' ) ).not( ).isEmpty(), // If the email isn't empty
    body('loginEmail', VM.length( 'email', 8, 40 ) ).isLength(8, 40), // If the email meets the length requirements
    body('loginEmail', VM.not_valid( 'email' ) ).isEmail(), // If the email is valid
    body('loginPassword', VM.required( 'password' ) ).not( ).isEmpty(), // If the password isn't empty
    body('loginPassword', VM.length( 'password', 3, 30 ) ).isLength(3, 30) // If the password meets the length requirements

], function( req, res ) { // When posting to /login

    var email = req.body.loginEmail; // Create a variable for the email
    var password = req.body.loginPassword; // Create a variable for the password
    var pushToken = req.body.pushToken; // Create a variable for the push token

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }
  
    User.findUser( email ).then( ( result ) => {
        if( result == null ) { // If the user doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( result.facebookID != null ) { // If the user registered with facebook
            res.status( 449 ); // Set the status code to 449 ( Retry With )
            res.json( { message: MessageList.error.facebook.use_facebook_login } ); // Send the message back to the client
            return; // Return to prevent further actions
        }

        if ( result.banned == 1 ) { // If the user has been banned
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.account.suspended } ); // Send back the errors to the client
            return; // Return to prevent further actions
        }

        User.comparePassword( password, result.password ).then( ( match ) => { // Compare the provided password with the user's password
            if ( match ) { // If the password is a match
                
                var ID = uid.randomUUID( 11 ); // Generate a unique ID

                var token = jwt.sign( { type: result.type, id: result.id, key: ID }, config.jwt.secret );
                        // Create a new token containing the user's info
                        // Make it have a 504-bit WPA key as a secret

                var responseData = { token: token, id: result.id, type: result.type };
                if ( email == 'mateo.sindicic@gmail.com' ) responseData.admin = true;
                res.status( 202 ); // // Set the status code to 202 ( Accepted )
                res.json( responseData ); // Send the token as the result

                if ( result.type == 'user' ) { // If the user is a normal user
                    User.createLoginToken( result.id, ID ).then( ( tokenResult ) => { // Create a login key

                        global.cache.set( ( 'login-' + result.id ), ID ); // Cache the login key
                        
                        User.setPushToken( result.id, pushToken ).then( ( ) => {

                            global.cache.set( ( 'key-' + result.id ), pushToken ); // Cache the push token

                        } ).catch( ( error ) => {
                            console.log( error ); // Log the error
                        } );

                    } ).catch( ( error ) => {
                        console.log( error ); // Log the error
                    } );
                } else if ( result.type == 'recruiter' ) { // If the user is a recruiter
                    User.createRecruiterLoginToken( result.id, ID ).then( ( tokenResult ) => { // Create a login key

                        global.cache.set( ( 'login-' + result.id ), ID ); // Cache the login key
    
                    } ).catch( ( error ) => {
                        console.log( error ); // Log the error
                    } );
                }

            } else { // Otherwise
                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                res.json( { message: MessageList.error.password.incorrect } ); // Send the message back to the client
                return; // Not needed here, but just to make it future proof
            }
        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );
    } ).catch( ( error ) => {
        console.log( error ); // Log the error
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

module.exports = router;

function hashEmail( email ) {
    return new Promise( ( resolve, reject ) => {
        bcrypt.genSalt( 10, ( error, salt ) => { // Generates salt
            if ( error ) { // If there was an error
                reject( error ); // Reject the promise with the error
                console.log( 'Problem with generating salt!' ); // If there was an error, output this message to the console
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }
            bcrypt.hash( Date.now() + email + "/.secretHashingPass./", salt, function( err, hash ) { // Generates a hash for the email
                if ( err ) { // If there was an error
                    reject( err ); // Reject the promise with the error
                    console.log( 'Problem with hashing the email!' ); // If there was an error, output this message to the console
                    console.log( err ); // Log the error to the console
                    return; // Return to prevent further actions
                }
                
                resolve( hash ); // Resolve the promise with the hash

            } );
        } );
    } );
}
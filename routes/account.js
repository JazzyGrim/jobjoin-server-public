var fs = require('fs'); // Get the file system
var path = require('path'); // Core Module in Node JS

var express = require('express'); // Get the express so that we can get the router
var { body, query, params, validationResult } = require('express-validator'); // Use the express validator to validate forms
var router = express.Router(); // We don't have the app variable so we use the Router class to route from here

var bcrypt = require( 'bcryptjs' ); // Use Bcyrpt to hash strings
var jwt = require('jsonwebtoken'); // Use the JWT ( JSON WEB TOKEN )
var handlebars = require('handlebars'); // Get handlebars

var User = require( '../models/user.js' ); // Get the user model
var Job = require( '../models/user.js' ); // Get the job model

var MessageList = require( '../message_config' ); // Get the message list

router.post( '/email', ( req, res ) => {
    
    var email = req.body.email;

    if ( email == null ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.email.not_provided } ); // Send the message back to the client
        return; // Return to prevent further actions
    }

    User.findUser( email ).then( ( result ) => {

        if ( result != null ) {
            res.status( 409 ); // Set the status code to 409 ( Conflict )
            res.json( { message: MessageList.error.email.taken } ); // Send the message back to the client
            return; // Return to prevent further actions
        }

        res.status( 200 ); // Set the status to 200 ( Okay )
        res.json( { message: MessageList.success.email.available } ); // Send the message back to the client

    } ).catch( ( error ) => {
        console.log( error ); // Log the error
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.get( '/verify', ( req, res ) => { // When visiting /verify
    if ( req.query.t == 'u' ) { // If we are verifying a user
        User.getUserInfo( 'UserVerificationCode', 'UserEmail', req.query.for ).then( ( result ) => { // Get info for the user

            if( result.length == 0 ) { // If the user doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            if( req.query.id == result[0].UserVerificationCode ) { // If the user's verification hash and the provided hash match
                User.verifyUser( req.query.for ).then( ( result ) => { // Update the user to make the email verified
                    res.json( { message: "Email " + req.query.for + " has been successfully verified" } ); // Send a success message to the client
                } );
            } else { // If they do not match
                res.json( { message: MessageList.error.verification.unauthorized } ); // Send a failure message to the client
            }

        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );
    } else if ( req.query.t = 'r' ) { // If we are verifying a recruiter
        User.getRecruiterInfo( 'RecruiterVerificationCode', 'RecruiterEmail', req.query.for ).then( ( result ) => { // Get info for the recruiter

            if( result.length == 0 ) { // If the recruiter doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }
            
            if( req.query.id == result[0].RecruiterVerificationCode ) { // If the recruiter's verification hash and the provided hash match
                User.verifyRecruiter( req.query.for ).then( ( result ) => { // Update the recruiter to make the email verified
                    res.json( { message: "Email " + req.query.for + " has been successfully verified" } ); // Send a success message to the client
                } );
            } else { // If they do not match
                res.json( { message: MessageList.error.verification.unauthorized } ); // Send a failure message to the client
            }

        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );
    } else { // If the user type isn't 'u' ( user ) or 'c' ( recruiter )
        res.status( 404 ); // Set the status code to 404 ( Not Found )
        res.json( { message: MessageList.error.user_type.unknown } ); // Send the message back to the client
    }
});

router.post( '/notifications', ( req, res ) => { // When posting to /notifications
    
    var id = req.decoded.id; // Create a variable for the user id
    var pushToken = req.body.pushToken; // Create a variable for the Expo push token
    console.log( pushToken );
    if ( req.decoded.type == 'user' ) { // If the user is a normal user

        User.setPushToken( id, pushToken ).then( ( result ) => {

            res.status( 202 ); // // Set the status code to 202 ( Accepted )
            res.json( { message: MessageList.success.push_token.set } ); // Send the response to the client
    
        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    } else  { // If we are not a user

        res.status( 403 ); // // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.push_token.only_users } ); // Send the response to the client

    }

} );

router.post( '/verification', ( req, res ) => { // When posting to /verification
    
    var id = req.decoded.id; // Create a variable for the user id
    var type = req.decoded.type; // Create a variable for the user type

    if ( type == 'user' ) { // If the user is a normal user

        User.getUserInfo( 'UserEmail, UserFirstName, UserEmailVerified', 'UserID', id ).then( ( result ) => {

            if ( result.length == 0 ) { // If the user doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the message back to the client
                return; // Return to prevent further actions
            }

            if ( result[0].UserEmailVerified == 1 ) {
                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                res.json( { message: MessageList.error.email.already_verified } ); // Send the message back to the client
                return; // Return to prevent further actions
            }

            hashEmail( result[0].UserEmail ).then( ( hash ) => {

                User.setVerificationCode( hash, id ).then( ( result ) => {

                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( { message: MessageList.success.verification_email.sent } ); // Send back the message to the client

                    fs.readFile( path.join( __dirname, "../verificationTemplate.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                        if ( err ) { // If there was an error reading the file
                            console.log( err ); // Print the error message to the console
                            return; // Return to prevent further actions
                        }
                
                        var link = "http://" + req.get( 'host' ) + "/verify?id=" + hash + "&for=" + result[0].UserEmail + "&t=u"; // Create a variable for the verification link
                        var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                        var variables = { // Create a variables object
                            firstName: result[0].UserFirstName, // Set the first name to the user's first name
                            link: link // Set the link to the verification link
                        };
                        var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                        
                        var mailOptions = { // Create a variable for the mail options
                            to: result[0].UserEmail, // Set the receiver e-mail
                            from: 'Mateo from JOBJOIN <matej.sindo@gmail.com>', // Set the sender's name
                            subject: "Verify your JobJoin account", // Set the e-mail subject
                            html: htmlToSend // Set the e-mail content
                        }
                        global.smtpTransport.sendMail( mailOptions, ( error, response ) => { // Send the e-mail
                            
                            if( error ) { // If there was an error
                                console.log( error ); // If there was an error output it to the console
                                return; // Return to prevent further actions
                            }
                            console.log('Verification email has been sent.'); // Log the confirmation message
                        });
                
                    });

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

        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    } else if ( type == 'recruiter' ) { // If the user is a recruiter

        User.getRecruiterInfo( 'RecruiterEmail, RecruiterFirstName, RecruiterEmailVerified', 'RecruiterID', id ).then( ( result ) => {

            if ( result.length == 0 ) { // If the recruiter doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the message back to the client
                return; // Return to prevent further actions
            }

            if ( result[0].RecruiterEmailVerified == 1 ) {
                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                res.json( { message: MessageList.error.email.already_verified } ); // Send the message back to the client
                return; // Return to prevent further actions
            }

            hashEmail( result[0].RecruiterEmail ).then( ( hash ) => {

                User.setRecruiterVerificationCode( hash, id ).then( ( result ) => {

                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( { message: MessageList.success.verification_email.sent } ); // Send back the message to the client

                    fs.readFile( path.join( __dirname, "../verificationTemplate.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                        if ( err ) { // If there was an error reading the file
                            console.log( err ); // Print the error message to the console
                            return; // Return to prevent further actions
                        }
                
                        var link = "http://" + req.get( 'host' ) + "/verify?id=" + hash + "&for=" + result[0].RecruiterEmail + "&t=u"; // Create a variable for the verification link
                        var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                        var variables = { // Create a variables object
                            firstName: result[0].RecruiterFirstName, // Set the first name to the user's first name
                            link: link // Set the link to the verification link
                        };
                        var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                        
                        var mailOptions = { // Create a variable for the mail options
                            to: result[0].RecruiterEmail, // Set the receiver e-mail
                            from: 'Mateo from JOBJOIN <matej.sindo@gmail.com>', // Set the sender's name
                            subject: "Verify your JobJoin account", // Set the e-mail subject
                            html: htmlToSend // Set the e-mail content
                        }
                        global.smtpTransport.sendMail( mailOptions, ( error, response ) => { // Send the e-mail
                            
                            if( error ) { // If there was an error
                                console.log( error ); // If there was an error output it to the console
                                return; // Return to prevent further actions
                            }
                            
                            console.log('Verification email has been sent.'); // Log the confirmation message
                        });
                
                    });

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

        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    }

} );

router.get( '/reset', ( req, res ) => { // When visiting /reset

    fs.readFile( path.join( __dirname, "../public/reset.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
        if ( err ) { // If there was an error reading the file
            console.log( err ); // Print the error message to the console
            return; // Return to prevent further actions
        }

        var template = handlebars.compile( html ); // Compile the HTML file using handlebars
        var variables = { // Create a variables object
            error: null
        };
        var htmlToSend = template( variables ); // Replace all the variables in the HTML file
        
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.send( htmlToSend ); // Send the reset password HTML file

    });

} );

router.post( '/reset', [

    body('resetEmail', 'Email is required.').not( ).isEmpty(), // If the email isn't empty
    body('resetEmail', 'Email is not valid.').isEmail(), // If the email is valid
	body('resetEmail', 'Email has to contain at least 8 characters and a maximum of 40 characters.').isLength(8, 40) // If the email meets the length requirements

], ( req, res ) => { // When posting to /reset

    var email = req.body.resetEmail; // Create a variable for the email
    var api = req.body.api; // Create a variable for the api usage

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields

        if ( api ) {
            res.status( 449 ); // Set the status code to 449 ( Retry With )
            res.json( errors );
        } else {
            fs.readFile( path.join( __dirname, "../public/reset.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                if ( err ) { // If there was an error reading the file
                    console.log( err ); // Print the error message to the console
                    return; // Return to prevent further actions
                }
        
                var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                var variables = { // Create a variables object
                    error: errors[0].msg
                };
                var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                
                res.status( 449 ); // Set the status code to 449 ( Retry With )
                res.send( htmlToSend ); // Send the reset password HTML file
        
            });
        }

        return; // Return to prevent further actions
    }

    User.findUserForReset( email ).then( ( result ) => {
        if( result == null ) { // If the user doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.sendFile( path.join( __dirname, '../public/userError.html' ) ); // Send the user error HTML file
            return; // Return to prevent further actions
        }

        if ( result.facebookID != null ) { // If the user registered with facebook
            res.status( 449 ); // Set the status code to 449 ( Retry With )
            res.json( { message: MessageList.error.facebook.use_facebook_reset } ); // Send the message back to the client
            return; // Return to prevent further actions
        }

        res.status( 200 ); // Set the status code to 200 ( Okay )
        
        if ( api ) {
            res.json( { message: MessageList.success.account.reset_email_sent } ); // Send the message back to the client
        } else {
            res.sendFile( path.join( __dirname, '../public/resetEmail.html' ) ); // Send the reset email HTML file
        }

        var token = jwt.sign( { id: result.id, email: email, exp: ( Date.now() / 1000 ) + 86400 }, ( result.password + result.registrationDate ) );
                    // Create a new token containing the user's reset info
                    // Make it have the user's password hash and registration date as the secret
                    // Give it an expiration date of 1 day

        fs.readFile( path.join( __dirname, "../resetTemplate.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
            if ( err ) { // If there was an error reading the file
                console.log( err ); // Print the error message to the console
                return; // Return to prevent further actions
            }
    
            var link = "http://" + req.get( 'host' ) + "/reset/" + result.type + "/" + result.id + "/" + token; // Create a variable for the reset link
            var template = handlebars.compile( html ); // Compile the HTML file using handlebars
            var variables = { // Create a variables object
                firstName: result.firstName, // Set the first name to the user's first name
                link: link // Set the link to the verification link
            };
            var htmlToSend = template( variables ); // Replace all the variables in the HTML file
            
            var mailOptions = { // Create a variable for the mail options
                to: email, // Set the receiver e-mail
                from: 'Mateo from JOBJOIN <matej.sindo@gmail.com>', // Set the sender's name
                subject: "JobJoin Password Reset", // Set the e-mail subject
                html: htmlToSend // Set the e-mail content
            }
            global.smtpTransport.sendMail( mailOptions, ( error, response ) => { // Send the e-mail
                
                if( error ) { // If there was an error
                    console.log( error ); // If there was an error output it to the console
                    return; // Return to prevent further actions
                }
                console.log('Reset email has been sent.'); // Log the confirmation message
            });
    
        });

    } ).catch( ( error ) => {
        console.log( error ); // Log the error
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.sendFile( path.join( __dirname, '../public/unknownError.html' ) ); // Send the unknown error HTML file
    } );

} );

router.get( '/reset/:type/:id/:token', ( req, res ) => { // When visiting /reset/:type/:id/:token
    
    var type = req.params.type; // Create a variable for the type
    var id = req.params.id; // Create a variable for the ID
    var token = req.params.token; // Create a variable for the token

    if ( type == 'user' ) { // If a user password is being resetted

        User.getUserInfo( 'UserPassword, UserRegistrationDate', 'UserID', id ).then( ( result ) => {

            if( result.length == 0 ) { // If the user doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.sendFile( path.join( __dirname, '../public/userError.html' ) ); // Send the user error HTML file
                return; // Return to prevent further actions
            }

            jwt.verify( token, ( result[0].UserPassword + result[0].UserRegistrationDate ), ( error, decoded ) => { // Verify the token

                if ( error ) { // If there was an error decoding the token
                    console.log( error ); // Log the error to the console
                    res.status( 498 ); // Set the status code to 498 ( Invalid Token ) - this is an unofficial code
                    res.sendFile( path.join( __dirname, '../public/tokenError.html' ) ); // Send the token error HTML file
                    return; // Return to prevent further actions
                }

                fs.readFile( path.join( __dirname, "../public/passwordReset.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                    if ( err ) { // If there was an error reading the file
                        console.log( err ); // Print the error message to the console
                        return; // Return to prevent further actions
                    }
            
                    var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                    var variables = { // Create a variables object
                        error: null
                    };
                    var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                    
                    res.send( htmlToSend ); // Send the reset password HTML file
            
                });

            } );

        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.sendFile( path.join( __dirname, '../public/unknownError.html' ) ); // Send the unknown error HTML file
        } );

    } else if ( type == 'recruiter' ) { // If a recruiter password is being resetted

        User.getRecruiterInfo( 'RecruiterPassword, RecruiterRegistrationDate', 'RecruiterID', id ).then( ( result ) => {

            if( result.length == 0 ) { // If the recruiter doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.sendFile( path.join( __dirname, '../public/recruiterError.html' ) ); // Send the recruiter error HTML file
                return; // Return to prevent further actions
            }

            jwt.verify( token, ( result[0].RecruiterPassword + result[0].RecruiterRegistrationDate ), ( error, decoded ) => { // Verify the token

                if ( error ) { // If there was an error decoding the token
                    console.log( error ); // Log the error to the console
                    res.status( 498 ); // Set the status code to 498 ( Invalid Token ) - this is an unofficial code
                    res.sendFile( path.join( __dirname, '../public/tokenError.html' ) ); // Send the token error HTML file
                    return; // Return to prevent further actions
                }

                fs.readFile( path.join( __dirname, "../public/passwordReset.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                    if ( err ) { // If there was an error reading the file
                        console.log( err ); // Print the error message to the console
                        return; // Return to prevent further actions
                    }
            
                    var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                    var variables = { // Create a variables object
                        error: null
                    };
                    var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                    
                    res.send( htmlToSend ); // Send the reset password HTML file
            
                });

            } );

        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.sendFile( path.join( __dirname, '../public/unknownError.html' ) ); // Send the unknown error HTML file
        } );

    } else { // For an unknown type
        res.status( 404 ); // Set the status code to 404 ( Not Found )
        res.sendFile( path.join( __dirname, '../public/linkError.html' ) ); // Send the link error HTML file
    }

} );

router.post( '/reset/:type/:id/:token', [ 

    body('newPassword', 'Password is required.').not( ).isEmpty(), // If the password isn't empty
    body('newPassword', 'Password has to contain at least 6 characters and a maximum of 30 characters.').isLength(6, 30), // If the password meets the length requirements

 ], ( req, res ) => { // When visiting /reset/:type/:id/:token
    
    var type = req.params.type; // Create a variable for the type
    var id = req.params.id; // Create a variable for the ID
    var token = req.params.token; // Create a variable for the token

    var password = req.body.newPassword; // Create a variable for the password

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields

        fs.readFile( path.join( __dirname, "../public/passwordReset.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
            if ( err ) { // If there was an error reading the file
                console.log( err ); // Print the error message to the console
                return; // Return to prevent further actions
            }
    
            var template = handlebars.compile( html ); // Compile the HTML file using handlebars
            var variables = { // Create a variables object
                error: errors[0].msg
            };
            var htmlToSend = template( variables ); // Replace all the variables in the HTML file
            
            res.status( 449 ); // Set the status code to 449 ( Retry With )
            res.send( htmlToSend ); // Send the reset password HTML file
    
        });

        return; // Return to prevent further actions
    }

    if ( type == 'user' ) { // If a user password is being resetted

        User.getUserInfo( 'UserFirstName, UserPassword, UserRegistrationDate', 'UserID', id ).then( ( result ) => {

            if( result.length == 0 ) { // If the user doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.sendFile( path.join( __dirname, '../public/userError.html' ) ); // Send the user error HTML file
                return; // Return to prevent further actions
            }

            jwt.verify( token, ( result[0].UserPassword + result[0].UserRegistrationDate ), ( error, decoded ) => { // Verify the token

                if ( error ) { // If there was an error decoding the token
                    console.log( error ); // Log the error to the console
                    res.status( 498 ); // Set the status code to 498 ( Invalid Token ) - this is an unofficial code
                    res.sendFile( path.join( __dirname, '../public/tokenError.html' ) ); // Send the token error HTML file
                    return; // Return to prevent further actions
                }

                User.resetUserPassword( decoded.id, password ).then( ( findResult ) => {

                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.sendFile( path.join( __dirname, '../public/resetSuccess.html' ) ); // Send the reset success HTML file

                    fs.readFile( path.join( __dirname, "../resetConfirmationTemplate.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                        if ( err ) { // If there was an error reading the file
                            console.log( err ); // Print the error message to the console
                            return; // Return to prevent further actions
                        }
                
                        var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                        var variables = { // Create a variables object
                            firstName: result[0].UserFirstName // Set the first name to the user's first name
                        };
                        var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                        
                        var mailOptions = { // Create a variable for the mail options
                            to: decoded.email, // Set the receiver e-mail
                            from: 'Mateo from JOBJOIN <matej.sindo@gmail.com>', // Set the sender's name
                            subject: "Your JobJoin password has been reset", // Set the e-mail subject
                            html: htmlToSend // Set the e-mail content
                        }
                        global.smtpTransport.sendMail( mailOptions, ( error, response ) => { // Send the e-mail
                            
                            if( error ) { // If there was an error
                                console.log( error ); // If there was an error output it to the console
                                return; // Return to prevent further actions
                            }
                            console.log('Reset confirmation email has been sent.'); // Log the confirmation message
                        });
                
                    });

                } ).catch( ( error ) => {
                    console.log( error ); // Log the error
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.sendFile( path.join( __dirname, '../public/unknownError.html' ) ); // Send the unknown error HTML file
                } );

            } );

        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.sendFile( path.join( __dirname, '../public/unknownError.html' ) ); // Send the unknown error HTML file
        } );

    } else if ( type == 'recruiter' ) { // If a recruiter password is being resetted

        User.getRecruiterInfo( 'RecruiterFirstName, RecruiterPassword, RecruiterRegistrationDate', 'RecruiterID', id ).then( ( result ) => {

            if( result.length == 0 ) { // If the recruiter doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.sendFile( path.join( __dirname, '../public/recruiterError.html' ) ); // Send the recruiter error HTML file
                return; // Return to prevent further actions
            }

            jwt.verify( token, ( result[0].RecruiterPassword + result[0].RecruiterRegistrationDate ), ( error, decoded ) => { // Verify the token

                if ( error ) { // If there was an error decoding the token
                    console.log( error ); // Log the error to the console
                    res.status( 498 ); // Set the status code to 498 ( Invalid Token ) - this is an unofficial code
                    res.sendFile( path.join( __dirname, '../public/tokenError.html' ) ); // Send the token error HTML file
                    return; // Return to prevent further actions
                }

                User.resetRecruiterPassword( decoded.id, password ).then( ( findResult ) => {

                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.sendFile( path.join( __dirname, '../public/resetSuccess.html' ) ); // Send the reset success HTML file

                    fs.readFile( path.join( __dirname, "../resetConfirmationTemplate.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                        if ( err ) { // If there was an error reading the file
                            console.log( err ); // Print the error message to the console
                            return; // Return to prevent further actions
                        }
                
                        var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                        var variables = { // Create a variables object
                            firstName: result[0].RecruiterFirstName // Set the first name to the user's first name
                        };
                        var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                        
                        var mailOptions = { // Create a variable for the mail options
                            to: decoded.email, // Set the receiver e-mail
                            from: 'Mateo from JOBJOIN <matej.sindo@gmail.com>', // Set the sender's name
                            subject: "Your JobJoin password has been reset", // Set the e-mail subject
                            html: htmlToSend // Set the e-mail content
                        }
                        global.smtpTransport.sendMail( mailOptions, ( error, response ) => { // Send the e-mail
                            
                            if( error ) { // If there was an error
                                console.log( error ); // If there was an error output it to the console
                                return; // Return to prevent further actions
                            }
                            console.log('Reset confirmation email has been sent.'); // Log the confirmation message
                        });
                
                    });

                } ).catch( ( error ) => {
                    console.log( error ); // Log the error
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.sendFile( path.join( __dirname, '../public/unknownError.html' ) ); // Send the unknown error HTML file
                } );

            } );

        } ).catch( ( error ) => {
            console.log( error ); // Log the error
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.sendFile( path.join( __dirname, '../public/unknownError.html' ) ); // Send the unknown error HTML file
        } );

    } else { // For an unknown type
        res.status( 404 ); // Set the status code to 404 ( Not Found )
        res.sendFile( path.join( __dirname, '../public/linkError.html' ) ); // Send the link error HTML file
    }

} );

router.get( '/removal', ( req, res ) => {
    
    var id = req.decoded.id; // Create a variable for the ID
    var type = req.decoded.type; // Create a variable for the user type
    
    User.findUserById( id, type ).then( ( result ) => {
        
        if ( result == null ) { // If the user doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }
        
        res.status( 200 ); // Set the status code to 200 ( Okay )
        res.json( { message: MessageList.success.account.delete_confirmation } ); // Send back the message to the client

        var token = jwt.sign( { id: id, email: result.email, exp: ( Date.now() / 1000 ) + 86400 }, ( result.password + result.registrationDate ) );
                    // Create a new token containing the user's deletion info
                    // Make it have the user's password hash and registration date as the secret
                    // Give it an expiration date of 1 day

        fs.readFile( path.join( __dirname, "../deleteTemplate.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
            if ( err ) { // If there was an error reading the file
                console.log( err ); // Print the error message to the console
                return; // Return to prevent further actions
            }
    
            var link = "http://" + req.get( 'host' ) + "/delete/" + type + "/" + id + "/" + token; // Create a variable for the deletion link
            var template = handlebars.compile( html ); // Compile the HTML file using handlebars
            var variables = { // Create a variables object
                firstName: result.firstName, // Set the first name to the user's first name
                link: link // Set the link to the verification link
            };
            var htmlToSend = template( variables ); // Replace all the variables in the HTML file
            
            var mailOptions = { // Create a variable for the mail options
                to: result.email, // Set the receiver e-mail
                from: 'Mateo from JOBJOIN <matej.sindo@gmail.com>', // Set the sender's name
                subject: "JobJoin Account Deletion", // Set the e-mail subject
                html: htmlToSend // Set the e-mail content
            }
            global.smtpTransport.sendMail( mailOptions, ( error, response ) => { // Send the e-mail
                
                if( error ) { // If there was an error
                    console.log( error ); // If there was an error output it to the console
                    return; // Return to prevent further actions
                }
                console.log('Deletion email has been sent.'); // Log the confirmation message
            });
    
        });
        
    } );
    
} );

router.get( '/delete/:type/:id/:token', ( req, res ) => { // When visiting /delete/:type/:id/:token
    res.sendFile( path.join( __dirname, '../public/deleteAccountForm.html' ) ); // Send the delete account form HTML file
} );

router.post( '/delete/:type/:id/:token', ( req, res ) => { // When posting to /delete/:type/:id/:token
    
    var id = req.params.id; // Create a variable for the id
    var type = req.params.type; // Create a variable for the type
    var token = req.params.token; // Create a variable for the token
    
    if ( type == 'user' ) {
        
        User.getUserInfo( 'UserPassword, UserRegistrationDate', 'UserID', id ).then( ( result ) => {
            
            if( result.length == 0 ) { // If the user doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.sendFile( path.join( __dirname, '../public/userError.html' ) ); // Send the user error HTML file
                return; // Return to prevent further actions
            }
            
            jwt.verify( token, ( result[0].UserPassword + result[0].UserRegistrationDate ), ( error, decoded ) => { // Verify the token
            
                if ( error ) { // If there was an error decoding the token
                    console.log( error ); // Log the error to the console
                    res.status( 498 ); // Set the status code to 498 ( Invalid Token ) - this is an unofficial code
                    res.sendFile( path.join( __dirname, '../public/tokenError.html' ) ); // Send the token error HTML file
                    return; // Return to prevent further actions
                }
                
                User.deleteUser( id ).then( ( deleteResult ) => {
                
                    global.cache.del( 'login-' + id ); // Delete the login key for the user from the cache ( to prevent app usage )
                
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.sendFile( path.join( __dirname, '../public/deleteSuccess.html' ) ); // Send the delete success HTML file
                    
                    User.deleteUserInfo( id ).then( ( deleteInfoResult ) => {
                        
                    } ).catch( ( error ) => {
                        console.log( error );
                    } );
                    
                } ).catch( ( error ) => {
                    console.log( error );
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.sendFile( path.join( __dirname, '../public/unknownError.html' ) ); // Send the unknown error HTML file
                } );
                
            } );
            
        } ).catch( ( error ) => {
            console.log( error );
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.sendFile( path.join( __dirname, '../public/unknownError.html' ) ); // Send the unknown error HTML file
        } );
        
    } else if ( type == 'recruiter' ) {
        
        User.getRecruiterInfo( 'RecruiterPassword, RecruiterRegistrationDate', 'RecruiterID', id ).then( ( result ) => {
            
            if( result.length == 0 ) { // If the recruiter doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.sendFile( path.join( __dirname, '../public/recruiterError.html' ) ); // Send the recruiter error HTML file
                return; // Return to prevent further actions
            }
            
            jwt.verify( token, ( result[0].RecruiterPassword + result[0].RecruiterRegistrationDate ), ( error, decoded ) => { // Verify the token
            
                if ( error ) { // If there was an error decoding the token
                    console.log( error ); // Log the error to the console
                    res.status( 498 ); // Set the status code to 498 ( Invalid Token ) - this is an unofficial code
                    res.sendFile( path.join( __dirname, '../public/tokenError.html' ) ); // Send the token error HTML file
                    return; // Return to prevent further actions
                }
                
                User.deleteRecruiter( id ).then( ( deleteResult ) => {
                    
                    global.cache.del( 'login-' + id ); // Delete the login key for the recruiter from the cache ( to prevent app usage )
                    
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.sendFile( path.join( __dirname, '../public/deleteSuccess.html' ) ); // Send the delete success HTML file
                    
                    Job.getJobInfo( 'JobID', 'JobRecruiterID', id ).then( ( jobResult ) => { // Find all jobs the recruiter has posted
                        
                        for ( var i = 0; i < jobResult.length; i++ ) { // For each found job from the recruiter
                            Job.cancelJob( jobResult[ i ].JobID ); // Cancel that job listing
                        }
                        
                    } );
                    
                } ).catch( ( error ) => {
                    console.log( error );
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.sendFile( path.join( __dirname, '../public/unknownError.html' ) ); // Send the unknown error HTML file
                } );
                
            } );
        
        } );
            
    } else {
        res.status( 404 ); // Set the status code to 404 ( Not Found )
        res.json( { message: MessageList.error.user_type.unknown } ); // Send the errors back to the client
    }
    
} );

router.post( '/action/ban', ( req, res ) => { // When posting to /action/ban
    
    if ( req.decoded[11072018] == null && req.get( 'host' ) != 'localhost' ) { // Only allow an admin token
        console.log( 'Unauthorized ban attempt.' );
        return;
    }

    var id = req.body.banID; // Create a variable for the ban ID
    var type = req.body.banType; // Create a variable for the ban user type

    if ( type == 'user' ) { // If we are banning a user

        User.getUserInfo( 'UserFirstName, UserEmail, UserBanned', 'UserID', id ).then( ( result ) => {

            if( result.length == 0 ) { // If the user doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.user.doesnt_exist } ); // Send back the errors to the client
                return; // Return to prevent further actions
            }

            if ( result[0].UserBanned == 1 ) { // If the user has already been banned
                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                res.json( { message: MessageList.error.user.already_banned } ); // Send back the errors to the client
                return; // Return to prevent further actions
            }

            User.banUser( id ).then( ( banResult ) => {

                global.cache.del( 'login-' + id ); // Delete the login key for the user from the cache ( to prevent app usage )

                res.status( 200 ); // Set the status code to 200 ( Okay )
                res.json( { message: MessageList.success.user.banned } ); // Send back the message to the client

                fs.readFile( path.join( __dirname, "../banTemplate.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                    if ( err ) { // If there was an error reading the file
                        console.log( err ); // Print the error message to the console
                        return; // Return to prevent further actions
                    }
            
                    var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                    var variables = { // Create a variables object
                        firstName: result[0].UserFirstName // Set the first name to the user's first name
                    };
                    var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                    
                    var mailOptions = { // Create a variable for the mail options
                        to: result[0].UserEmail, // Set the receiver e-mail
                        from: 'Mateo from JOBJOIN <matej.sindo@gmail.com>', // Set the sender's name
                        subject: "JobJoin Account Suspended", // Set the e-mail subject
                        html: htmlToSend // Set the e-mail content
                    }
                    global.smtpTransport.sendMail( mailOptions, ( error, response ) => { // Send the e-mail
                        
                        if( error ) { // If there was an error
                            console.log( error ); // If there was an error output it to the console
                            return; // Return to prevent further actions
                        }
                        console.log('Ban notification email has been sent.'); // Log the confirmation message
                    });
            
                });

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

    } else if ( type == 'recruiter' ) { // If we are banning a recruiter

        User.getRecruiterInfo( 'RecruiterFirstName, RecruiterEmail, RecruiterBanned', 'RecruiterID', id ).then( ( result ) => {

            if( result.length == 0 ) { // If the recruiter doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send back the errors to the client
                return; // Return to prevent further actions
            }

            if ( result[0].RecruiterBanned == 1 ) { // If the recruiter has already been banned
                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                res.json( { message: MessageList.error.recruiter.already_banned } ); // Send back the errors to the client
                return; // Return to prevent further actions
            }

            User.banRecruiter( id ).then( ( banResult ) => {

                global.cache.del( 'login-' + id ); // Delete the login key for the recruiter from the cache ( to prevent app usage )

                res.status( 200 ); // Set the status code to 200 ( Okay )
                res.json( { message: MessageList.success.recruiter.banned } ); // Send back the message to the client

                Job.getJobInfo( 'JobID', 'JobRecruiterID', id ).then( ( jobResult ) => { // Find all jobs the recruiter has posted
                        
                    for ( var i = 0; i < jobResult.length; i++ ) { // For each found job from the recruiter
                        Job.cancelJob( jobResult[ i ].JobID ); // Cancel that job listing
                    }
                    
                } );

                fs.readFile( path.join( __dirname, "../banTemplate.html" ) , { encoding: 'utf-8' }, function ( err, html ) { // Read the HTML file from the file system
                    if ( err ) { // If there was an error reading the file
                        console.log( err ); // Print the error message to the console
                        return; // Return to prevent further actions
                    }
            
                    var template = handlebars.compile( html ); // Compile the HTML file using handlebars
                    var variables = { // Create a variables object
                        firstName: result[0].RecruiterFirstName // Set the first name to the user's first name
                    };
                    var htmlToSend = template( variables ); // Replace all the variables in the HTML file
                    
                    var mailOptions = { // Create a variable for the mail options
                        to: result[0].RecruiterEmail, // Set the receiver e-mail
                        from: 'Mateo from JOBJOIN <matej.sindo@gmail.com>', // Set the sender's name
                        subject: "JobJoin Account Suspended", // Set the e-mail subject
                        html: htmlToSend // Set the e-mail content
                    }
                    global.smtpTransport.sendMail( mailOptions, ( error, response ) => { // Send the e-mail
                        
                        if( error ) { // If there was an error
                            console.log( error ); // If there was an error output it to the console
                            return; // Return to prevent further actions
                        }
                        console.log('Ban notification email has been sent.'); // Log the confirmation message
                    });
            
                });

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

    }

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
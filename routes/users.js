var path = require('path'); // Core Module in Node JS

var express = require('express'); // Get the express so that we can get the router
var { body, query, validationResult } = require('express-validator'); // Use the express validator to validate forms

var router = express.Router(); // We don't have the app variable so we use the Router class to route from here
var countries = require('country-list'); // Get list of all countries
var languageList = require('languages'); // Get a list of all the languages

var User = require( '../models/user.js' ); // Get the user model
var Chat = require( '../models/chat.js' ); // Get the chat model
var Job = require( '../models/job.js' ); // Get the job model
var Quiz = require( '../models/quiz.js' ); // Get the quiz model

var socket = require('../socket.js'); // Get the socket IO server
var { sendNotification } = require('../notificationManager.js'); // Get the notification manager
var { rotateImage } = require('../utils/imageHandler'); // Get the image handler

var ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId( );

// Set up MULTER for images
var multer = require( 'multer' ); // Require Multer for image uploading
var fs = require('fs'); // Require the file system

const storage = multer.diskStorage( {
    destination: function( req, file, cb ) {
        cb( null, 'public/uploads/users/' );
    },
    filename: function( req, file, cb ) {
        cb( null, new Date().toISOString().replace(/:/g, '-') + uid.randomUUID( 11 ) );
    }
} );

const fileFilter = function( req, file, cb ) {
    
    if ( file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' ) { // If the image is either JPEG or PNG
        cb( null, true ); // Allow the image
    } else {
        cb( 'Unsupported file extension. The image must be in JPEG or PNG format.', false ); // Reject the image
    }

}

var upload = multer( { storage: storage, limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB
}, fileFilter: fileFilter } ); // Set up multer for uploading

var MessageList = require( '../message_config' ); // Get the message list
var VM = require( '../verification_config' ); // Get the verification message list

router.post( '/chat-unlock/', ( req, res ) => { // When posting to /chat-unlock/
    
    var id = req.body.userID; // Create a variable for the user ID
    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.getUserInfo( 'UserID', 'UserID', id ).then( ( result ) => {

        if( result.length == 0 ) { // If the user doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        User.getChatUnlockInfo( 'UnlockID', id, recruiterID ).then( ( unlockResult ) => {

            if( unlockResult.length != 0 ) { // If a chat unlock exists
                res.status( 409 ); // Set the status code to 409 ( Conflict )
                res.json( { message: MessageList.error.chat_unlocks.already_unlocked } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            new Promise( ( resolve, reject ) => {

                User.getRecruiterInfo( 'RecruiterCreditCount', 'RecruiterID', recruiterID ).then( ( recruiterResult ) => {
        
                    if ( recruiterResult.length == 0 ) { // If the recruiter doesn't exist
                        res.status( 404 ); // Set the status code to 404 ( Not Found )
                        res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the errors back to the client
                        return; // Return to prevent further actions
                    }
                    
                    
                    var lastMonth = new Date(); // Create a new date object
                    lastMonth.setMonth( lastMonth.getMonth() - 1 ); // Remove one month from the date

                    if ( recruiterResult[0].RecruiterCreditCount > 0 ) { // If the recruiter has purchased credits and has credits left
                            
                        User.updateCreditCount( ( recruiterResult[0].RecruiterCreditCount - 1 ), recruiterID ).then( ( updateCreditResult ) => { // Update the recruiter's credit count ( remove one credit )

                            resolve( ); // Resolve the promise

                        } ).catch( ( error ) => {
                            console.log( error ); // Log the error to the console
                            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                        } );

                    } else {
                        res.status( 403 ); // Set the status code to 403 ( Forbidden )
                        res.json( { message: MessageList.error.credits.not_enough_for_chat_offer } ); // Send the errors back to the client
                    }
        
                } ).catch( ( error ) => {
                    console.log( error ); // Log the error to the console
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                } );
        
            } ).then( ( creditResult ) => {

                User.newChatUnlock( id, recruiterID ).then( ( createUnlockResult ) => {

                    let message = { // Create a variable for the message
                        message: 'CF385DEAF06072B2B7E465B88696006BAE21A1868C59F0CF576F3EE526038167', // Set the message text
                        senderID: recruiterID, // Set the message sender ID
                        receiverID: id // Set the message receiver ID
                    };

                    Chat.newMessage( message ).then( ( new_message_result ) => { // Add the new message to the database
                        
                        console.log( 'Setting new value' )
                        console.log( result[0].UserID + recruiterID );

                        global.cache.set( ( result[0].UserID + recruiterID ), 1 ); // Update the cache and make the chat unlocked
                        res.status( 202 ); // // Set the status code to 202 ( Accepted )
                        res.json( { message: MessageList.success.chat_unlocks.unlocked } ); // Send back a message
                        
                        let message = 'Poslodavac je otključao razgovor s Vama!';

                        socket.io.in( id ).clients( ( error, clients ) => {
                            
                            if ( error ) { // If there was an error
                                console.log( error ); // Print the error to the console
                                return; // Return to prevent further actions
                            }

                            if ( clients.length ) { // If the receiver is connected or was connected
                                io.to( id ).emit( 'new-unlock', { message } ); // Send a 'new-unlock' socket to the client
                            } else { // If the receiver is not connected, send a notification
                                sendNotification( id, 'Novi razgovor', message, null );
                            }
            
                        } );
    
                    } ).catch( ( error ) => {
                        console.log( 'Recruiter payed a credit but couldn\'t create new message! - Chat Unlocked' );
                        console.log( error ); // Log the error
                    } );
    
                } ).catch( ( error ) => {
                    console.log( error ); // Log the error to the console
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                } );

            } );

        } ).catch( ( error ) => {
            console.log( error ); // Log the error to the console
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/edit/', [ 

    body('userFirstName', VM.required( 'firstName' ) ).not( ).isEmpty(), // If the first name isn't empty
	body('userFirstName', VM.alpha( 'firstName' ) ).matches( /^[a-z\-\u0100-\u017F]+$/i ), // If the first name contains only letters
	body('userFirstName', VM.length( 'firstName', 2, 16 ) ).isLength(2, 16), // If the first name meets the length requirements
    body('userLastName',  VM.required( 'lastName' ) ).not( ).isEmpty(), // If the last name isn't empty
	body('userLastName', VM.alpha( 'lastName' ) ).matches( /^[a-z\-\u0100-\u017F]+$/i ), // If the last name contains only letters
	body('userLastName', VM.length( 'lastName', 2, 20 ) ).isLength(2, 20), // If the last name meets the length requirements
    body('userBirthday', VM.required( 'birthday' ) ).not( ).isEmpty(), // If the birthday isn't empty
    body('userBirthday', VM.not_valid( 'birthday' ) ).isISO8601( ), // If the birthday is valid
    body('userAbout', 'User about has to contain at least 0 characters and a maximum of 1,000 characters.').isLength(0, 1000), // If the about user meets the length requirements

 ], ( req, res ) => { // When posting to /edit/

    var userID = req.decoded.id; // Create a variable for the user ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.getUserInfo( 'UserID', 'UserID', userID ).then( ( result ) => { // Check if a user exists with that ID

        if( result.length == 0 ) { // If the user doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        var firstName = req.body.userFirstName; // Create a variable for the first name
        var lastName = req.body.userLastName; // Create a variable for the last name
        var birthday = req.body.userBirthday; // Create a variable for the birthday
        var about = req.body.userAbout; // Create a variable for the about

        var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

        if ( errors.length ) { // If Express Validator finds errors in the given fields
            res.status( 449 ); // Set the status code to 449 ( Retry With )
            res.json( errors ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        var user = { // Define a user object
            firstName: firstName, // Set the first name
            lastName: lastName, // Set the last name
            birthday: birthday, // Set the birthday
            about: about, // Set the about
        }

        User.updateUser( userID, user ).then( ( result ) => { // Update the user
            res.status( 202 ); // // Set the status code to 202 ( Accepted )
            res.json( { message: MessageList.success.user.updated, user } ); // Send back a message
            global.cache.del( userID + '-location' ); // Delete the old user location from the cache
        } ).catch( ( error ) => {
            console.log( error ); // Log the error to the console
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/edit/jobtype', [ 

    body('userJobTypeID', VM.required( 'jobType' ) ).not( ).isEmpty() // If the job type isn't empty

 ], ( req, res ) => {

    var userID = req.decoded.id; // Create a variable for the user ID

    var jobTypeID = req.body.userJobTypeID; // Create a variable for the about user

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.getUserInfo( 'UserID', 'UserID', userID ).then( ( result ) => { // Check if a user exists with that ID

        if( result.length == 0 ) { // If the user doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.getJobTypeInfo( 'JobTypeName', 'JobTypeID', jobTypeID ).then( ( find_result ) => {

            if ( result.length == 0 ) {
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.job_type.doesnt_exist } );
                return;
            }

            User.updateJobTypeID( userID, jobTypeID ).then( ( update_result ) => {

                res.status( 202 ); // // Set the status code to 202 ( Accepted )
                res.json( { message: MessageList.success.job_type.user_updated, jobTypeID } );
    
            } ).catch( ( error ) => {
                console.log( error ); // Log the error to the console
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
            } );

        } ).catch( ( error ) => {
            console.log( error ); // Log the error to the console
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/edit/address', [ 

    body('userAddress', VM.length( 'address', 3, 100 ) ).optional( ).isLength(3, 100), // If the address meets the length requirements
    body('userCity', VM.required( 'city' ) ).not( ).isEmpty(), // If the city isn't empty
    body('userCity', VM.alpha_and_spaces( 'city' ) ).not( ).matches( '\d' ), // If the city only contains letters and spaces
    body('userCity', VM.required( 'city', 3, 100 ) ).isLength(3, 40), // If the city meets the length requirements
    body('userState', VM.required( 'state' ) ).not( ).isEmpty(), // If the state isn't empty
    body('userState', VM.length( 'state', 2, 50 ) ).isLength(2, 50), // If the state meets the length requirements
    body('userZip', VM.alphanumeric( 'zip' ) ).optional( ).matches( /^[a-z0-9 \-\u0100-\u017F]+$/i ), // If the ZIP only contains letters and numbers
    body('userZip', VM.length( 'zip', 2, 12 ) ).optional( ).isLength(2, 12), // If the ZIP meets the length requirements
    body('userCountry', VM.required( 'country' ) ).not( ).isEmpty(), // If the country isn't empty
    body('userCountry', VM.length( 'country', 2, 45 ) ).isLength(2, 45), // If the country meets the length requirements
    body('userLat', VM.numeric( 'lat' ) ).isFloat(), // If the lat is a float
    body('userLat', VM.not_valid( 'lat' ) ).custom( ( lat ) => { // Define a custom validator
        if ( lat >= -90 && lat <= 90 ) return true; // If the lat is valid return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('userLong', VM.numeric( 'long' ) ).isFloat(), // If the lat is a float
    body('userLong', VM.not_valid( 'long' ) ).custom( ( long ) => { // Define a custom validator
        if ( long >= -180 && long <= 180 ) return true; // If the lat is valid return true ( no error )
        return false; // Otherwise return false ( error )
    } )

 ], ( req, res ) => {

    var userID = req.decoded.id; // Create a variable for the user ID

    var address = req.body.userAddress; // Create a variable for the address
    var city = req.body.userCity; // Create a variable for the city
    var state = req.body.userState; // Create a variable for the state
    var zip = req.body.userZip; // Create a variable for the ZIP
    var country = req.body.userCountry; // Create a variable for the country
    var lat = req.body.userLat; // Create a variable for the lat
    var long = req.body.userLong; // Create a variable for the long

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable
    
    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    const info = {
        address,
        city,
        state,
        zip,
        country,
        lat,
        long
    }

    User.getUserInfo( 'UserID', 'UserID', userID ).then( ( result ) => { // Check if a user exists with that ID

        if( result.length == 0 ) { // If the user doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        User.updateAddress( userID, info ).then( ( update_result ) => {

            res.status( 202 ); // // Set the status code to 202 ( Accepted )
            res.json( { message: MessageList.success.address.updated } );

        } ).catch( ( error ) => {
            console.log( error ); // Log the error to the console
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/edit/experience/', [ 

    body('experience', VM.between( 'experience', 0, 5 ) ).custom( ( experience ) => { // Define a custom validator
        if ( experience == undefined ) return false; // If the array hasn't been set
        if ( experience.length >= 0 && experience.length <= 5 ) return true; // If the experience array length is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('experience.*.typeID',  VM.required( 'experienceType' ) ).not( ).isEmpty(), // If the experience type isn't empty
    body('experience.*.company', VM.required( 'companyName' ) ).not( ).isEmpty(), // If the company name isn't empty
    body('experience.*.company', VM.length( 'companyName', 3, 30 ) ).isLength(3, 30), // If the company name meets the length requirements
    body('experience.*.amount', VM.required( 'experienceAmount' ) ).not( ).isEmpty(), // If the experience amount isn't empty
    body('experience.*.amount', VM.numeric( 'experienceAmount' ) ).isNumeric(), // If the experience amount contains only numbers
    body('experience.*.amount', VM.between( 'experienceAmount', 1, 720 ) ).custom( ( amount ) => { // Define a custom validator
        if ( amount >= 1 && amount <= 720 ) return true; // If the experience amount is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('experience.*.title', VM.required( 'experienceTitle' ) ).not( ).isEmpty(), // If the title is not empty
    body('experience.*.title', VM.length( 'experienceTitle', 3, 50 ) ).isLength(3, 50), // If the title meets the length requirements
    body('experience.*.description', VM.between( 'experienceDescription', 3, 500 ) ).custom( ( description ) => { // Define a custom validator
        if ( description != null ) {
            if ( description.length >= 3 && description.length <= 500 ) {
                return true; // If the experience description is not null and the length is withing an acceptable range, return true ( no error )
            }
        }
        return false; // Otherwise return false ( error )
    } )

 ], ( req, res ) => { // When posting to /edit/experience/
    
    var experience = req.body.experience; // Create a variable for the experience
    var userID = req.decoded.id; // Create a variable for the user ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }
    
    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.updateUserExperience( userID, experience ).then( ( result ) => {
        
        res.status( 202 ); // // Set the status code to 202 ( Accepted )
        res.json( { message: MessageList.success.user.experience_updated, experience } ); // Send back a message

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/edit/education/', [ 

    body('education', VM.between( 'education', 0, 3 ) ).custom( ( education ) => { // Define a custom validator
        if ( education == undefined ) return false; // If the array hasn't been set
        if ( education.length >= 0 && education.length <= 3 ) return true; // If the education array length is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('education.*.country', VM.required( 'educationCountry' ) ).not( ).isEmpty(), // If the country isn't empty
	body('education.*.country', VM.length( 'educationCountry', 2, 45 ) ).isLength(2, 45), // If the country meets the length requirements
    body('education.*.country', VM.not_valid( 'educationCountry' ) ).custom( ( country ) => { // Define a custom validator
        if ( countries.getNames().indexOf( country ) != -1 ) return true; // If the country is listed return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('education.*.school', VM.required( 'educationSchool' ) ).not( ).isEmpty(), // If the school name isn't empty
    body('education.*.school', VM.length( 'educationSchool', 3, 70 ) ).isLength(3, 70), // If the school name meets the length requirements
    body('education.*.title', VM.required( 'educationTitle' ) ).not( ).isEmpty(), // If the title isn't empty
    body('education.*.title', VM.between( 'educationTitle', 0, 2 ) ).custom( ( title ) => { // Define a custom validator
        if ( title >= 0 && title <= 2 ) return true; // If the title is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('education.*.major', VM.required( 'educationMajor' ) ).not( ).isEmpty(), // If the major isn't empty
    body('education.*.major', VM.length( 'educationMajor', 3, 70 ) ).isLength(3, 70), // If the major meets the length requirements
    body('education.*.graduationYear', VM.required( 'educationGraduationYear' ) ).not( ).isEmpty(), // If the graduation year isn't empty
    body('education.*.graduationYear', VM.numeric( 'educationGraduationYear' ) ).isNumeric(), // If the graduation year contains only numbers
    body('education.*.graduationYear', VM.between( 'educationGraduationYear', 1900, new Date().getFullYear( ) ) ).custom( ( year ) => { // Define a custom validator
        if ( year >= 1900 && year <= ( new Date().getFullYear() ) ) return true; // If the graduation year is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } )

 ], ( req, res ) => { // When posting to /edit/education/

    var education = req.body.education; // Create a variable for the education
    var userID = req.decoded.id; // Create a variable for the user ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.updateUserEducation( userID, education ).then( ( result ) => {
        
        res.status( 202 ); // // Set the status code to 202 ( Accepted )
        res.json( { message: MessageList.success.user.education_updated, education } ); // Send back a message

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/edit/languages/', [ 

    body('languages', VM.between( 'languages', 0, 5 ) ).custom( ( languages ) => { // Define a custom validator
        if ( languages == undefined ) return false; // If the array hasn't been set
        if ( languages.length >= 0 && languages.length <= 5 ) return true; // If the languages array length is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('languages.*.name', VM.required( 'languagesName' ) ).not( ).isEmpty(), // If the company name isn't empty
    body('languages.*.name', VM.length( 'languagesName', 2, 3 ) ).isLength(2, 3), // If the company name meets the length requirements
    body('languages.*.name', VM.not_valid( 'languagesName' ) ).custom( ( name ) => { // Define a custom validator
        return languageList.isValid( name ); // If the language code exists return true ( no error )
    } ),
    body('languages.*.level', VM.required( 'languagesLevel' ) ).not( ).isEmpty(), // If the language level isn't empty
    body('languages.*.level', VM.numeric( 'languagesLevel' ) ).isNumeric(), // If the language level contains only numbers
    body('languages.*.level', VM.between( 'languagesLevel', 0, 3 ) ).custom( ( level ) => { // Define a custom validator
        if ( level >= 0 && level <= 3 ) return true; // If the language level is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } )

 ], ( req, res ) => { // When posting to /edit/languages/

    var languages = req.body.languages; // Create a variable for the languages
    var userID = req.decoded.id; // Create a variable for the user ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only, languages } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.updateUserLanguages( userID, languages ).then( ( result ) => {
        
        res.status( 202 ); // // Set the status code to 202 ( Accepted )
        res.json( { message: MessageList.success.user.languages_updated, languages } ); // Send back a message

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.get( '/saved', [ 

    query('page', VM.numeric( 'pageFilter' ) ).isNumeric(), // If the page contains only numbers
    query('page', VM.between( 'pageFilter', 0, 10000 ) ).custom( ( page ) => { // Define a custom validator
        if ( page >= 0 && page <= 10000 ) return true; // If the page is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } )

 ], ( req, res ) => { // When visting /saved

    var page = req.query.page; // Create a variable for the page
    var userID = req.decoded.id; // Create a variable for the user ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getAllSavedJobs( userID, page ).then( ( result ) => {

        if( result.length == 0 ) { // If there are no saved jobs
            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( result ); // Send the result back to the client
            return; // Return to prevent further actions
        }

        var savedJobs = []; // Create an array for all the saved jobs
        for (let i = 0; i < result.length; i++) { // For each saved job found
            savedJobs.push( { // Push it to the saved jobs array
                SavedID: result[i].SavedID, // Set a value for the ID
                SavedJobID: result[i].SavedJobID, // Set a value for the job ID
                SavedTime: result[i].SavedTime, // Set a value for the time when the job was saved
            } );
            Job.getJobInfo( 'JobTitle, JobRecruiterID, JobDescription, JobCreated, JobSalary, JobSalaryType, JobEmploymentContract, JobExperience, JobTypeID, JobCity, JobCountry, JobImagePath', 'JobID', result[i].SavedJobID ).then( ( jobResult ) => {

                savedJobs[i] = { ...savedJobs[i], ...jobResult[0] }; // Set all the values
                
                Job.getJobTypeInfo( 'JobTypeName', 'JobTypeID', jobResult[0].JobTypeID ).then( ( typeResult ) => {

                    savedJobs[i]['JobType'] = typeResult[0].JobTypeName; // Set a value for the job type name

                    User.getRecruiterInfo( 'RecruiterCompanyName', 'RecruiterID', savedJobs[i]['JobRecruiterID'] ).then( ( recruiterResult ) => {

                        savedJobs[i]['JobCompanyName'] = recruiterResult[0].RecruiterCompanyName; // Set a value for the recruiter company name

                        if ( i == ( result.length - 1 ) ) { // If we are at the end of the loop
                            res.status( 200 ); // Set the status code to 200 ( Okay )
                            res.json( savedJobs ); // Send the saved jobs back to the user
                        }

                    } ).catch( ( error ) => {
                        console.log( error ); // Log the error to the console
                        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                    } );

                } ).catch( ( error ) => {
                    console.log( error ); // Log the error to the console
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                } );

            } ).catch( ( error ) => {
                console.log( error ); // Log the error to the console
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
            } );

        }

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/applied', [ 

    body('page', VM.numeric( 'pageFilter' ) ).isNumeric(), // If the page contains only numbers
    body('page', VM.between( 'pageFilter', 0, 10000 ) ).custom( ( page ) => { // Define a custom validator
        if ( page >= 0 && page <= 10000 ) return true; // If the page is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('status', VM.numeric( 'status' ) ).optional( ).isNumeric(), // If the page contains only numbers
    body('status', VM.zero_or_one_or_two( 'status', 'onlyPending', 'onlyShortlisted', 'onlyDenied' ) ).optional( ).custom( ( status ) => { // Define a custom validator
        if ( status == 0 || status == 1 || status == 2 ) return true; // If the status is valid return true ( no error )
        return false; // Otherwise return false ( error )
    } )

 ], ( req, res ) => { // When visting /applied

    var page = req.body.page; // Create a variable for the page
    var userID = req.decoded.id; // Create a variable for the user ID
    var status = req.body.status; // Create a variable for the application status
    var expired = req.body.expired; // Create a variable for the application expired status

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getUserApplications( userID, page, status, expired ).then( applications_result => {

        if( applications_result.length == 0 ) { // If there are no applications
            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( [ ] ); // Send the applications back to the client
            return; // Return to prevent further actions
        }

        var applications = []; // Create an array for all the applications

        for (let i = 0; i < applications_result.length; i++) { // For each application found
            applications.push( { // Push it to the application array
                id: applications_result[i].ApplicationID, // Set a value for the ID
                userID: applications_result[i].ApplicationUserID, // Set a value for the user ID
                recruiterID: applications_result[i].ApplicationRecruiterID, // Set a value for the recruiter ID
                jobID: applications_result[i].ApplicationJobID, // Set a value for the job ID
                status: applications_result[i].ApplicationStatus, // Set a value for application accepted value
                recruiterResponse: applications_result[i].ApplicationResponse, // Set a value for application response value
                issued: applications_result[i].ApplicationIssued, // Set a value for the application issue time
                JobTitle: applications_result[i].JobTitle, // Set a value for the job title
                JobDescription: applications_result[i].JobDescription, // Set a value for the job description
                JobSalary: applications_result[i].JobSalary, // Set a value for the job salary
                JobSalaryType: applications_result[i].JobSalaryType, // Set a value for the job salary type
                JobEmploymentContract: applications_result[i].JobEmploymentContract, // Set a value for the job employment contract
                JobExperience: applications_result[i].JobExperience, // Set a value for the job experience
                JobHired: applications_result[i].JobHired, // Set a value for the job hired state
                JobCity: applications_result[i].JobCity, // Set a value for the job city
                JobState: applications_result[i].JobState, // Set a value for the job state
                JobType: applications_result[i].JobTypeName, // Set a value for the job type name
                JobCompanyName: applications_result[i].RecruiterCompanyName, // Set a value for the job company name
            } );

            if ( expired != null ) applications[i].expired = true; // If we are looking at expired applications

            if ( i == ( applications_result.length - 1 ) ) { // If we are at the end of the loop
                res.status( 200 ); // Set the status code to 200 ( Okay )
                res.json( applications ); // Send the applications back to the user
            }

        }

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/image', ( req, res ) => { // When posting to /image

    var userID = req.decoded.id; // Create a variable for the user ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }
    
    upload.single( 'image' )( req, res, ( error ) => { // Upload the picture
        
        if ( error ) { // If there was an error
            if ( error.code === 'LIMIT_FILE_SIZE' ) { // If the file is too big
                res.status( 415 ); // Set the status code to 415 ( Unsupported Media Type )
                res.json( { message: MessageList.error.image.too_large } ); // Send back the error to the client
            } else { // if it's a different error
                res.status( 415 ); // Set the status code to 415 ( Unsupported Media Type )
                res.json( { message: error } ); // Send the error back to the client
            }
        } else { // If everything is okay

            User.getUserInfo( 'UserImagePath', 'UserID', userID ).then( ( userResult ) => {

                if( userResult.length == 0 ) { // If the user doesn't exist
                    res.status( 404 ); // Set the status code to 404 ( Not Found )
                    res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
                    return; // Return to prevent further actions
                }

                User.updateUserPicture( req.file.path.substring( 7 ), userID ).then( ( updateResult ) => { // Update the picture path in the database

                    if ( userResult[0].UserImagePath != null ) { // If the user had a profile picture
                        fs.unlink( 'public/' + userResult[0].UserImagePath, ( deleteError )  => { // Delete that saved picture
                            if ( deleteError ) { // If there was an error deleting it
                                console.log( deleteError ); // Log the error to the console
                            }
                        });
                    }
    
                    // If the picture path was updated
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( { message: MessageList.success.user.image_uploaded } ); // Send back the message to the client

                    rotateImage( req.file.path ); // Rotate the image if needed
    
                } ).catch( ( error ) => {
                    console.log( error ); // Log the error to the console
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.json( { message: MessageList.error.unknown } ); // Send the error to the client
                } );

            } ).catch( ( error ) => {
                console.log( error ); // Log the error to the console
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.unknown } ); // Send the error to the client
            } );
        }
    } );
    
} );

router.post( '/image/remove', ( req, res ) => { // When posting to /image/remove
    
    var userID = req.decoded.id; // Create a variable for the user ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.getUserInfo( 'UserImagePath', 'UserID', userID ).then( ( userResult ) => {

        if( userResult.length == 0 ) { // If the user doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( userResult[0].UserImagePath == null ) { // If the user doesn't have an image
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.user.no_image } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        User.updateUserPicture( null, userID ).then( ( deleteResult ) => { // Delete the picture path in the database

            if ( userResult[0].UserImagePath != null ) { // If the user had a profile picture
                fs.unlink( 'public/' + userResult[0].UserImagePath, ( deleteError )  => { // Delete that saved picture
                    if ( deleteError ) { // If there was an error deleting it
                        console.log( deleteError ); // Log the error to the console
                    }
                });
            }

            // If the picture path was updated
            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( { message: MessageList.success.user.image_deleted } ); // Send back the message to the client

        } ).catch( ( error ) => {
            console.log( error ); // Log the error to the console
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the error to the client
        } );

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the error to the client
    } );

} );

router.get( '/:id/quiz', ( req, res ) => { // When visiting /:id/quiz

    var id = req.params.id; // Create a variable for the ID
    var jobID = req.query.jobID; // Create a variable for the job ID

    Quiz.getQuizAnswersFromUser( id, jobID ).then( ( result ) => {

        if( result.length == 0 ) { // If the user doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.quiz.not_solved } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Quiz.getQuestions( result[0].QuizID ).then( async ( questions ) => {

            let total_points = 0;
            
            questions.forEach( q => {
                if ( q.QuestionPoints ) total_points += q.QuestionPoints
            } );

            let answers = new Array( result[ result.length - 1 ].QuestionNumber + 1 );

            let user_points = 0;

            for ( const [ answer_index, answer ] of result.entries( ) ) {
                if ( !answers[ answer.QuestionNumber ] ) answers[ answer.QuestionNumber ] = {
                    text: answer.QuestionText,
                    type: answer.QuestionType,
                    number: answer.QuestionNumber,
                    answers: []
                }

                let value = answer.AnswerAnswerID;

                if ( value != null ) value = await Quiz.getAnswer( value ).then( data => data[0] ? data[0].QuestionAnswerValue : null );
                if ( value == null ) value = answer.AnswerValue;

                answers[ answer.QuestionNumber ].answers.push( {
                    value: value,
                    correct: answer.AnswerPoints > 0,
                    points: answer.AnswerPoints
                } )

                if ( answer.AnswerPoints ) user_points += answer.AnswerPoints

                if ( answer_index == ( result.length - 1 ) ) {
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( { answers, user_points, total_points } ); // Send the answers back
                }
            }

        } );

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.get( '/:id', ( req, res ) => { // When visiting /:id

    var id = req.params.id; // Create a variable for the ID
    var details = req.query.details; // Create a variable for the details tag ( if the details tag is specified, return all the info about a user )
    var appID = req.query.appID; // Create a variable for the appID tag ( if the appID tag is specified, check the application status for the user )
    var address = req.query.address; // Create a variable for the address tag ( if the address tag is specified, return the user address )

    User.getUserInfo( 'UserID, UserEmail, UserFirstName, UserLastName, UserBirthday, UserAbout, UserBanned, UserJobTypeID, UserAddress, UserCity, UserState, UserZip, UserCountry, UserLat, UserLong, UserImagePath', 'UserID', id ).then( ( result ) => {

        if( result.length == 0 ) { // If the user doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }
        
        if ( result[0].UserFirstName == null && result[0].UserRegistrationDate == null ) { // If the user's account has been deleted
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.user.deleted } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        var user = { // Define a user object
            firstName: result[0].UserFirstName, // Set the user first name
            lastName: result[0].UserLastName, // Set the user last name
            birthday: result[0].UserBirthday, // Set the user birthday
            about: result[0].UserAbout, // Set the about user
            banned: result[0].UserBanned, // Set the user banned status
            jobTypeID: result[0].UserJobTypeID, // Set the target job type ID for the user
            imagePath: result[0].UserImagePath ? result[0].UserImagePath.replace(/\\/g,"/") : "" // Set the user image path
        }

        if ( req.decoded.id == result[0].UserID ) { // If the user is looking at his own profile
            user.email = result[0].UserEmail;
        }

        if ( details == null ) { // If the details tag hasn't been specified
            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( user ); // Send back the user object
            return; // Return to prevent further actions ( this way no extra information will be returned to the client )
        }
        // If we want all the details about the user, continue
        User.getUserExperienceInfo( 'ExperienceID, ExperienceTypeID, ExperienceCompany, ExperienceAmount, ExperienceTitle, ExperienceDescription', 'ExperienceUserID', id ).then( ( experienceResult ) => {

            user.experience = []; // Define a new key/value pair for experience and make it an array

            for ( let i = 0, x = experienceResult.length; i < x; i++ ) { // Go through each experience for the user ( store the experienceResult.length once for increased performance )
                user.experience.push( { // Push an object into the array
                    id: experienceResult[i].ExperienceID, // Set the experience ID
                    typeID: experienceResult[i].ExperienceTypeID, // Set the experience type ID
                    company: experienceResult[i].ExperienceCompany, // Set the experience company
                    amount: experienceResult[i].ExperienceAmount, // Set the experience amount
                    title: experienceResult[i].ExperienceTitle, // Set the experience title
                    description: experienceResult[i].ExperienceDescription // Set the experience description
                } );
            }

            User.getUserEducationInfo( 'EducationID, EducationCountry, EducationSchool, EducationTitle, EducationMajor, EducationGraduationYear', 'EducationUserID', id ).then( ( educationResult ) => {

                user.education = []; // Define a new key/value pair for education and make it an array

                for ( let i = 0, x = educationResult.length; i < x; i++ ) { // Go through each education for the user ( store the educationResult.length once for increased performance )
                    user.education.push( { // Push an object into the array
                        id: educationResult[i].EducationID, // Set the education ID
                        country: educationResult[i].EducationCountry, // Set the education country
                        school: educationResult[i].EducationSchool, // Set the education school
                        title: educationResult[i].EducationTitle, // Set the education title
                        major: educationResult[i].EducationMajor, // Set the education major
                        graduationYear: educationResult[i].EducationGraduationYear // Set the education graduation year
                     } );
                }

                User.getUserLanguageInfo( 'LanguageID, LanguageName, LanguageLevel', 'LanguageUserID', id ).then( ( languageResult ) => {

                    user.languages = []; // Define a new key/value pair for languages and make it an array

                    for ( let i = 0, x = languageResult.length; i < x; i++ ) { // Go through each language for the user ( store the languageResult.length once for increased performance )
                        user.languages.push( { // Push an object into the array
                            id: languageResult[i].LanguageID, // Set the language ID
                            name: languageResult[i].LanguageName, // Set the language name
                            level: languageResult[i].LanguageLevel // Set the language level
                        } );
                    }

                    new Promise( ( resolve, reject ) => {

                        if ( appID == '' || appID == null ) { // If the appID tag hasn't been set
                            resolve( ); // Resolve the promise
                            return; // Return to prevent further actions
                        }
                        
                        Job.getApplication( 'ApplicationStatus, ApplicationJobID, ApplicationQuizScore', 'ApplicationID', appID ).then( ( applicationResult ) => {
                            
                            if ( applicationResult.length == 0 ) { // If no application results were found
                                resolve( ); // Resolve the promise
                                return; // Return to prevent further actions
                            }

                            Job.getJobInfo( 'JobQuizRequired', 'JobID', applicationResult[0].ApplicationJobID ).then( job_result => {

                                user.quizRequired = job_result[0].JobQuizRequired; // Set the job quiz required flag
                                user.applicationStatus = applicationResult[0].ApplicationStatus; // Set the application status for the user
                                user.applicationJobID = applicationResult[0].ApplicationJobID; // Set the application job ID
                                user.applicationQuizScore = applicationResult[0].ApplicationQuizScore; // Set the application status for the user
                                resolve( ); // Resolve the promise

                            } ).catch( ( error ) => {
                                console.log( error ); // Log the error to the console
                                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                                res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                            } );

                        } ).catch( ( error ) => {
                            console.log( error ); // Log the error to the console
                            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                        } );

                    } ).then( ( ) => {

                        // Now that we have all the info about the user, send it back
                        if ( req.decoded.id != result[0].UserID ) { // If the user is not looking at his own profile ( we can't show the address )
                            res.status( 200 ); // Set the status code to 200 ( Okay )
                            res.json( user ); // Send back the user object
                            return; // Return to prevent further actions ( this way no extra information will be returned to the client )
                        }

                        if ( address != null ) {
                            user.detailed = true; // Set the detailed tag to make sure we know the address was received, even if it's null
                            user.address = result[0].UserAddress; // Set the user address
                            user.city = result[0].UserCity; // Set the user city
                            user.state = result[0].UserState; // Set the user state
                            user.zip = result[0].UserZip; // Set the user zip
                            user.country = result[0].UserCountry; // Set the user country
                            user.lat = result[0].UserLat; // Set the user lat
                            user.long = result[0].UserLong; // Set the user long
                        }

                        res.status( 200 ); // Set the status code to 200 ( Okay )
                        res.json( user ); // Send back the user object

                    } ).catch( ( error ) => {
                        console.log( error ); // Log the error to the console
                        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                    } );
                    
                } ).catch( ( error ) => {
                    console.log( error ); // Log the error to the console
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                } );

            } ).catch( ( error ) => {
                console.log( error ); // Log the error to the console
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
            } );

        } ).catch( ( error ) => {
            console.log( error ); // Log the error to the console
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

module.exports = router;
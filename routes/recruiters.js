var express = require('express'); // Get the express so that we can get the router
var { body, query, param, validationResult } = require('express-validator'); // Use the express validator to validate forms

var router = express.Router(); // We don't have the app variable so we use the Router class to route from here

var User = require( '../models/user.js' ); // Get the user model
var Job = require( '../models/job.js' ); // Get the job model

var { rotateImage } = require('../utils/imageHandler'); // Get the image handler

var ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId( );

// Set up MULTER for images

var multer = require( 'multer' ); // Require Multer for image uploading
var fs = require('fs'); // Require the file system

const storage = multer.diskStorage( {
    destination: function( req, file, cb ) {
        cb( null, 'public/uploads/recruiters/' );
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

router.post( '/edit/', [ 

    body('recruiterFirstName', VM.required( 'firstName' ) ).not( ).isEmpty(), // If the first name isn't empty
    body('recruiterFirstName', VM.alpha( 'firstName' ) ).matches( /^[a-z\u0100-\u017F]+$/i ), // If the first name contains only letters
    body('recruiterFirstName', VM.length( 'firstName', 2, 16 ) ).isLength(2, 16), // If the first name meets the length requirements
    body('recruiterLastName', VM.required( 'lastName' ) ).not( ).isEmpty(), // If the last name isn't empty
    body('recruiterLastName', VM.alpha( 'lastName' ) ).matches( /^[a-z\-\u0100-\u017F]+$/i ), // If the last name contains only letters
    body('recruiterLastName', VM.length( 'lastName', 2, 20 ) ).isLength(2, 20), // If the last name meets the length requirements
    body('recruiterCompanyName', VM.required( 'companyName' ) ).not( ).isEmpty(), // If the company name isn't empty
    body('recruiterCompanyName', VM.length( 'companyName', 3, 30 ) ).isLength(3, 30) // If the company name meets the length requirements

 ], ( req, res ) => { // When posting to /edit/

    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.getRecruiterInfo( 'RecruiterID', 'RecruiterID', recruiterID ).then( ( result ) => { // Check if a recruiter exists with that ID

        if( result.length == 0 ) { // If the recruiter doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        var firstName = req.body.recruiterFirstName; // Create a variable for the first name
        var lastName = req.body.recruiterLastName; // Create a variable for the last name
        var companyName = req.body.recruiterCompanyName; // Create a variable for the company name

        // Validation
        var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

        if ( errors.length ) { // If Express Validator finds errors in the given fields
            res.status( 449 ); // Set the status code to 449 ( Retry With )
            res.json( errors ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        var recruiter = { // Define a recruiter object
            firstName: firstName, // Set the first name
            lastName: lastName, // Set the last name
            companyName: companyName // Set the company name
        }

        User.updateRecruiter( recruiterID, recruiter ).then( ( result ) => { // Update the recruiter
            res.status( 202 ); // // Set the status code to 202 ( Accepted )
            res.json( { message: MessageList.success.recruiter.updated } ); // Send back a message
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

router.get( '/applied-total/:id', [

    param('id', VM.required( 'jobID' ) ).not( ).isEmpty() // If the job ID has been specified

], ( req, res ) => { // When visting /applied-count/:id

    var jobID = req.params.id; // Create a variable for the job ID
    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getJobInfo( 'JobRecruiterID', 'JobID', jobID ).then( ( result ) => {

        if ( result.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( result[0].JobRecruiterID !== recruiterID ) { // If the user is not the job poster
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.job.not_the_creator } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.getApplicationCount( jobID ).then( ( application_result ) => {

            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( { // Send back the total application counts
                total: application_result[0].ApplicationCount
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

router.get( '/applied-count/:id', [

    param('id', VM.required( 'jobID' ) ).not( ).isEmpty() // If the job ID has been specified

], ( req, res ) => { // When visting /applied-count/:id

    var jobID = req.params.id; // Create a variable for the job ID
    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getJobInfo( 'JobRecruiterID', 'JobID', jobID ).then( ( result ) => {

        if ( result.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( result[0].JobRecruiterID !== recruiterID ) { // If the user is not the job poster
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.job.not_the_creator } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.getJobApplicationCount( jobID ).then( ( application_result ) => {

            Job.getExpiredApplicationCount( jobID ).then( ( expired_result ) => {

                res.status( 200 ); // Set the status code to 200 ( Okay )
                res.json( { // Send back the total application counts
                    pending: application_result[0].Pending,
                    denied: application_result[0].Denied,
                    shortlisted: application_result[0].Shortlisted,
                    expired: expired_result[0].Expired
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

router.get( '/applied/:id', [

    param('id', VM.required( 'jobID' ) ).not( ).isEmpty(), // If the job ID has been specified
    query('page', VM.required( 'pageFilter' ) ).not( ).isEmpty(), // If the page parameter is set
    query('page', VM.numeric( 'pageFilter' ) ).isNumeric(), // If the page contains only numbers
    query('page', VM.between( 'pageFilter', 0, 10000 ) ).custom( ( page ) => { // Define a custom validator
        if ( page >= 0 && page <= 10000 ) return true; // If the page is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    query('status', VM.numeric( 'status' ) ).optional( ).isNumeric(), // If the page contains only numbers
    query('status', VM.zero_or_one_or_two( 'status', 'onlyPending', 'onlyShortlisted', 'onlyDenied' ) ).optional( ).custom( ( status ) => { // Define a custom validator
        if ( status >= 0 && status <= 2 ) return true; // If the status is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } )

], ( req, res ) => { // When visting /applied/:id

    var jobID = req.params.id; // Create a variable for the job ID
    var page = req.query.page; // Create a variable for the page
    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID
    var status = req.query.status; // Create a variable for the application status

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    // Validation
    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    if ( page == "" || page == null ) page = 0; // Set a default page number

    Job.getRecruiterApplications( recruiterID, jobID, page, status ).then( applications_result => {

        if( applications_result.length == 0 ) { // If there are no applications
            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( [ ] ); // Send the applications back to the recruiter
            return; // Return to prevent further actions
        }
        
        var applications = [ ]; // Create an array for all the applications

        for (let i = 0; i < applications_result.length; i++) {
            
            User.getUserExperienceInfo( 'ExperienceID, ExperienceTypeID, ExperienceCompany, ExperienceAmount, ExperienceTitle, ExperienceDescription', 'ExperienceUserID', applications_result[i].ApplicationUserID ).then( ( experienceResult ) => {

                let experience = []; // Define a new key/value pair for experience and make it an array
    
                for ( let i = 0, x = experienceResult.length; i < x; i++ ) { // Go through each experience for the user ( store the experienceResult.length once for increased performance )
                    experience.push( { // Push an object into the array
                        id: experienceResult[i].ExperienceID, // Set the experience ID
                        typeID: experienceResult[i].ExperienceTypeID, // Set the experience type ID
                        company: experienceResult[i].ExperienceCompany, // Set the experience company
                        amount: experienceResult[i].ExperienceAmount, // Set the experience amount
                        title: experienceResult[i].ExperienceTitle, // Set the experience title
                        description: experienceResult[i].ExperienceDescription // Set the experience description
                    } );
                }
    
                applications.push( { // Push it to the application array
                    id: applications_result[i].ApplicationID, // Set a value for the application ID
                    issued: applications_result[i].ApplicationIssued, // Set a value for the application issue time
                    userID: applications_result[i].ApplicationUserID, // Set a value for the user ID
                    quizScore: applications_result[i].ApplicationQuizScore, // Set a value for the quiz score
                    firstName: applications_result[0].UserFirstName, // Set a value for the first name
                    lastName: applications_result[0].UserLastName, // Set a value for the last name
                    birthday: applications_result[0].UserBirthday, // Set a value for the birthday
                    about: applications_result[0].UserAbout, // Set a value for the about
                    city: applications_result[0].UserCity, // Set a value for the city
                    state: applications_result[0].UserState, // Set a value for the state
                    imagePath: applications_result[0].UserImagePath ? applications_result[0].UserImagePath.replace(/\\/g,"/") : '', // Set a value for the image path
                    jobTypeID: applications_result[0].UserJobTypeID, // Set a value for the job type ID
                    experience: experience // Set a value for the user experience
                } );

                if ( i == ( applications_result.length - 1 ) ) { // If we are at the end of the loop
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( applications ); // Send the applications back to the recruiter
                }
    
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

router.post( '/image/', ( req, res ) => { // When posting to /image/

    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
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
            
            User.getRecruiterInfo( 'RecruiterImagePath', 'RecruiterID', recruiterID ).then( ( recruiterResult ) => {

                if( recruiterResult.length == 0 ) { // If the recruiter doesn't exist
                    res.status( 404 ); // Set the status code to 404 ( Not Found )
                    res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the errors back to the client
                    return; // Return to prevent further actions
                }

                User.updateRecruiterPicture( req.file.path.substring( 7 ), recruiterID ).then( ( updateResult ) => { // Update the picture path in the database

                    if ( recruiterResult[0].RecruiterImagePath != null ) { // If the recruiter had a profile picture
                        fs.unlink( 'public/' + recruiterResult[0].RecruiterImagePath, ( deleteError )  => { // Delete that saved picture
                            if ( deleteError ) { // If there was an error deleting it
                                console.log( deleteError ); // Log the error to the console
                            }
                        });
                    }
                    
                    // If the picture path was updated
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( { message: MessageList.success.recruiter.image_uploaded } ); // Send back the message to the client
                    
                    rotateImage( req.file.path );
                    
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

router.post( '/image/remove', ( req, res ) => { // When posting to /image/:id/remove
    
    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.getRecruiterInfo( 'RecruiterImagePath', 'RecruiterID', recruiterID ).then( ( recruiterResult ) => {

        if( recruiterResult.length == 0 ) { // If the recruiter doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( recruiterResult[0].RecruiterImagePath == null ) { // If the recruiter doesn't have an image
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.recruiter.no_image } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        User.updateRecruiterPicture( null, recruiterID ).then( ( deleteResult ) => { // Delete the picture path in the database

            if ( recruiterResult[0].RecruiterImagePath != null ) { // If the recruiter had a profile picture
                fs.unlink( 'public/' + recruiterResult[0].RecruiterImagePath, ( deleteError )  => { // Delete that saved picture
                    if ( deleteError ) { // If there was an error deleting it
                        console.log( deleteError ); // Log the error to the console
                    }
                });
            }

            // If the picture path was updated
            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( { message: MessageList.success.recruiter.image_deleted } ); // Send back the message to the client

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

router.get( '/nearby', [ 

    query('perPage', VM.between( 'perPage', 0, 10 ) ).optional( ).custom( ( perPage ) => ( perPage >= 0 && perPage <= 10 ) ),
    query('perPage', VM.numeric( 'perPage' ) ).optional( ).isNumeric(),
    query('page', VM.between( 'pageFilter', 0, 10000 ) ).optional( ).custom( ( page ) => ( page >= 0 && page <= 10000 ) ),
    query('page', VM.numeric( 'pageFilter' ) ).optional( ).isNumeric(),
    query('city', VM.required( 'city' ) ).not( ).isEmpty(), // If the city isn't empty
    query('city', VM.alpha_and_spaces( 'city' ) ).matches('^[a-zA-Z ]+$'), // If the city only contains letters
    query('city', VM.length( 'city', 3, 40 ) ).isLength(3, 40) // If the city meets the length requirements

 ], ( req, res ) => { // When visiting /nearby
    
    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    if ( Object.keys(req.query).length === 0 ) { // If the query is empty
        res.status( 406 ); // Set the status code to 406 ( Unacceptable )
        res.send( MessageList.error.query.must_specify ); // Send the error to the client
        return; // Return to prevent further actions
    }

    var jobTypeID = req.query.jobTypeID; // Create a variable for the target job type ID filter
    var perPage = req.query.perPage; // Create a variable for the perPage filter
    var page = req.query.page; // Create a variable for the page filter
    var city = req.query.city; // Create a variable for the city filter

    if ( perPage == "" || perPage == null ) perPage = 10;
    if ( page == "" || page == null ) page = 0;

    // Validation
    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.send( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }
    
    const date = new Date(); // Create a new date object
    const currentDate = date.getFullYear() + "-" + ( "0" + ( date.getMonth() + 1 ) ).slice( -2 ) + "-" + ( "0" + ( date.getDate() ) ).slice( -2 );
    const seed = req.decoded.id + currentDate;

    User.getRandomUsers( city, jobTypeID, seed, page, perPage ).then( user_result => {

        var users = []; // Create a variable for the users
        
        if ( user_result.length == 0 ) { // If there were no candidates found
            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( users ); // Send the users back to the recruiter
            return; // Return to prevent further actions
        }

        for (let i = 0; i < user_result.length; i++) { // For each found user

            User.getUserExperienceInfo( 'ExperienceID, ExperienceTypeID, ExperienceCompany, ExperienceAmount, ExperienceTitle, ExperienceDescription', 'ExperienceUserID', user_result[ i ].UserID ).then( ( experienceResult ) => {

                let experience = []; // Define a new key/value pair for experience and make it an array
    
                for ( let i = 0, x = experienceResult.length; i < x; i++ ) { // Go through each experience for the user ( store the experienceResult.length once for increased performance )
                    experience.push( { // Push an object into the array
                        id: experienceResult[i].ExperienceID, // Set the experience ID
                        typeID: experienceResult[i].ExperienceTypeID, // Set the experience type ID
                        company: experienceResult[i].ExperienceCompany, // Set the experience company
                        amount: experienceResult[i].ExperienceAmount, // Set the experience amount
                        title: experienceResult[i].ExperienceTitle, // Set the experience title
                        description: experienceResult[i].ExperienceDescription // Set the experience description
                    } );
                }

                users.push( { // Push a new user into the users array
                    id: user_result[ i ].UserID, // Set the user ID
                    firstName: user_result[ i ].UserFirstName, // Set the user's first name
                    lastName: user_result[ i ].UserLastName, // Set the user's last name
                    birthday: user_result[ i ].UserBirthday, // Set the user's birthday
                    city: user_result[ i ].UserCity, // Set the user's city
                    state: user_result[ i ].UserState, // Set the user's state
                    imagePath: user_result[ i ].UserImagePath ? user_result[ i ].UserImagePath.replace(/\\/g,"/") : '', // Set the user's image path
                    jobTypeID: user_result[ i ].UserJobTypeID, // Set the user's job type ID
                    jobTypeName: user_result[ i ].JobTypeName, // Set the user's job type name
                    experience: experience // Set the user's experience
                } );

                if ( i == ( user_result.length - 1 ) ) { // If we are at the end of the loop
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( users ); // Send the users back to the recruiter
                }
    
            } ).catch( ( error ) => {
                console.log( error ); // Log the error to the console
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
            } );

        }

    } )

} );

router.get( '/jobs', [ 

    query('page', VM.between( 'pageFilter', 0, 10000 ) ).optional( ).custom( ( page ) => ( page >= 0 && page <= 10000 ) ),
    query('page', VM.numeric( 'pageFilter' ) ).optional( ).isNumeric(),

 ], ( req, res ) => { // When visiting /job-listings
    
    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID
    var inactive = req.query.inactive; // Create a variable for the inactive filter
    
    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.send( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var page = req.query.page; // Create a variable for the page filter

    if ( page == null || page == '' ) page = 0;
    
    if ( inactive != null ) inactive = true;

    Job.getJobsByFilter( recruiterID, page, inactive ).then( ( result ) => { // Get all job listings from a recruiter
        
        if ( !result.length ) {
            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( [ ] ); // Send the jobs back to the recruiter
            return;
        }

        var jobs = []; // Create a variable for all the jobs

        for (let i = 0; i < result.length; i++) { // For each job

            jobs.push( { // Push a new job into the job array
                id: result[ i ].JobID, // Set the job ID
                title: result[ i ].JobTitle, // Set the job title
                description: result[ i ].JobDescription, // Set the job description
                imagePath: ( result[ i ].JobImagePath ) ? result[ i ].JobImagePath.replace(/\\/g,"/") : '', // Set the job image path
                city: result[ i ].JobCity, // Set the job city
                state: result[ i ].JobState, // Set the job state
                salary: result[ i ].JobSalary, // Set the job salary
                salaryType: result[ i ].JobSalaryType, // Set the job salary type
                created: result[ i ].JobCreated // Set the job creation date
            } );

            Job.getApplicationCount( result[ i ].JobID ).then( ( application_result ) => { // Count all the applications for that job

                jobs[ i ][ 'applicationCount' ] = application_result[0].ApplicationCount; // Set the application count for that job

                if ( i == (  result.length - 1 ) ) { // If we are at the end of the loop
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json(  jobs ); // Send the jobs back to the recruiter
                }

            } ).catch( ( error ) => {
                console.log( error ); // Log the error to the console
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.send( MessageList.error.unknown ); // Send the error to the client
            } );

        }

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.send( MessageList.error.unknown ); // Send the error to the client
    } );

} );

router.post( '/job-listings', [ 

    body('page', VM.between( 'pageFilter', 0, 10000 ) ).optional( ).custom( ( page ) => ( page >= 0 && page <= 10000 ) ),
    body('page', VM.numeric( 'pageFilter' ) ).optional( ).isNumeric(),
    body('recruiterID', VM.required( 'recruiterID' ) ).not( ).isEmpty(),

 ], ( req, res ) => { // When visiting /job-listings
    
    var recruiterID = req.body.recruiterID; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var page = req.body.page; // Create a variable for the page filter

    if ( page == null || page == '' ) page = 0;
    
    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.send( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getRecruiterJobs( recruiterID, page ).then( ( result ) => { // Get all job listings from a recruiter
        
        res.status( 200 ); // Set the status code to 200 ( Okay )
        res.json( result ); // Send the jobs back to the recruiter

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.send( MessageList.error.unknown ); // Send the error to the client
    } );

} );

router.get( '/credits', ( req, res ) => { // When visiting /credits

    var id = req.decoded.id; // Create a variable for the ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.getRecruiterInfo( 'RecruiterCreditCount', 'RecruiterID', id ).then( ( result ) => {

        if( result.length == 0 ) { // If the recruiter doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        res.status( 200 ); // Set the status code to 200 ( Okay )
        res.json( { credits: result[0].RecruiterCreditCount } ); // Send back the credit count

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.get( '/:id', ( req, res ) => { // When visiting /:id

    var id = req.params.id; // Create a variable for the ID

    User.getRecruiterInfo( 'RecruiterEmail, RecruiterFirstName, RecruiterLastName, RecruiterCompanyName, RecruiterBanned, RecruiterImagePath', 'RecruiterID', id ).then( ( result ) => {

        if( result.length == 0 ) { // If the recruiter doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }
        
        if ( result[0].RecruiterFirstName == null && result[0].RecruiterRegistrationDate == null ) { // If the recruiter's account has been deleted
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.recruiter.deleted } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        var recruiter = { // Define a recruiter object
            firstName: result[0].RecruiterFirstName, // Set the first name
            lastName: result[0].RecruiterLastName, // Set the last name
            companyName: result[0].RecruiterCompanyName, // Set the company name
            banned: result[0].RecruiterBanned, // Set the recruiter banned status
            imagePath: ( result[0].RecruiterImagePath ) ? result[0].RecruiterImagePath.replace(/\\/g,"/") : '' // Set the image path
        }

        if ( id == req.decoded.id ) recruiter.email = result[0].RecruiterEmail;

        res.status( 200 ); // Set the status code to 200 ( Okay )
        res.json( recruiter ); // Send back the recruiter object

    } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

module.exports = router;
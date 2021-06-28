var express = require('express'); // Get the express so that we can get the router
var { body, validationResult } = require('express-validator'); // Use the express validator to validate forms

var router = express.Router(); // We don't have the app variable so we use the Router class to route from here
var path = require('path'); // Core Module in Node JS
var geoip = require('geoip-lite'); // Used for getting the country of the visitor
var ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId( );

var Job = require( '../models/job.js' ); // Get the job model
var User = require( '../models/user.js' ); // Get the user model
var Quiz = require( '../models/quiz.js' ); // Get the quiz model

var NodeGeocoder = require('node-geocoder');

var socket = require('../socket.js'); // Get the socket IO server
var { sendNotificationInBulk } = require('../notificationManager.js'); // Get the notification manager
var { rotateImage } = require('../utils/imageHandler'); // Get the image handler

// Set up MULTER for images

var multer = require( 'multer' ); // Require Multer for image uploading
var fs = require('fs'); // Require the file system

const storage = multer.diskStorage( {
    destination: function( req, file, cb ) {
        cb( null, 'public/uploads/jobs/' );
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

var options = {
    provider: 'locationiq',
    apiKey: '369794d463f960'
  };
   
var geocoder = NodeGeocoder( options );

router.post( '/new', [

    // Validation
    body('jobTitle', VM.required( 'jobTitle' ) ).not( ).isEmpty(), // If the title is not empty
    body('jobTitle', VM.length( 'jobTitle', 3, 100 ) ).isLength(3, 100), // If the title meets the length requirements
    body('jobDescription', VM.required( 'jobDescription' ) ).not( ).isEmpty(), // If the description is not empty
    body('jobDescription', VM.length( 'jobDescription', 3, 2000 ) ).isLength(3, 2000), // If the description meets the length requirements
    body('jobDefaultResponse', VM.length( 'jobDefaultResponse', 3, 800 ) ).optional( { checkFalsy: true } ).isLength(3, 800), // If the default response meets the length requirements
    body('jobSalary', VM.required( 'jobSalary' ) ).not( ).isEmpty(), // If the salary is not empty
    body('jobSalary', 'Job salary must be 0 - 300 per hour, or 500 - 30,000 per month.').custom( ( salary, { req } ) => { // Define a custom validator
        if ( req.body.jobSalaryType == 0 && salary >= 0 && salary <= 300 ) return true; // If the salary is within an acceptable range return true ( no error )
        if ( req.body.jobSalaryType == 1 && salary >= 500 && salary <= 30000 ) return true; // If the salary is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('jobSalaryType', VM.required( 'jobSalaryType' ) ).not( ).isEmpty(), // If the salary is not empty
    body('jobSalaryType', VM.zero_or_one( 'jobSalaryType', 'hourlyRate', 'monthlyRate' ) ).custom( ( salaryType ) => { // Define a custom validator
        if ( salaryType >= 0 && salaryType <= 1 ) return true; // If the salary type is either 0 or 1 return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('jobExperience', VM.required( 'jobExperience' ) ).not( ).isEmpty(), // If the experience is not empty
    body('jobExperience', VM.zero_or_one( 'jobExperience', 'notRequired', 'required' ) ).custom( ( experience ) => { // Define a custom validator
        if ( experience >= 0 && experience <= 1 ) return true; // If the experience is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('jobEmploymentContract', VM.required( 'jobEmploymentContract' ) ).not( ).isEmpty(), // If the employment contract is not empty
    body('jobEmploymentContract', VM.zero_or_one( 'jobEmploymentContract', 'partTime', 'fullTime' ) ).custom( ( contract ) => { // Define a custom validator
        if ( contract >= 0 && contract <= 1 ) return true; // If the employment contract is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('jobEmploymentTime', VM.required( 'jobEmploymentTime' ) ).not( ).isEmpty(), // If the employment contract is not empty
    body('jobEmploymentTime', VM.zero_or_one( 'jobEmploymentTime', 'permanent', 'temporary' ) ).custom( ( time ) => { // Define a custom validator
        if ( time >= 0 && time <= 1 ) return true; // If the employment time is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('jobStudentsAccepted', VM.required( 'jobStudentsAccepted' ) ).not( ).isEmpty(), // If the students accepted is not empty
    body('jobStudentsAccepted', VM.zero_or_one( 'jobStudentsAccepted', 'notAccepted', 'accepted' ) ).custom( ( time ) => { // Define a custom validator
        if ( time >= 0 && time <= 1 ) return true; // If the students accepted is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('jobStartingDate', VM.required( 'jobStartingDate' ) ).not( ).isEmpty(), // If the starting date is not empty
    body('jobStartingDate', VM.not_valid( 'jobStartingDate' ) ).isISO8601(), // If the starting date is a date
    body('jobStartingDate', VM.future_date( 'jobStartingDate' ) ).toDate().isAfter(), // If the starting date is after now ( the future )
    body('jobAddress', VM.length( 'address', 3, 40 ) ).optional( ).isLength(3, 40), // If the address meets the length requirements    
    body('jobCity', VM.required( 'city' ) ).not( ).isEmpty(), // If the city isn't empty
    body('jobCity', VM.alpha_and_spaces( 'city' ) ).not( ).matches( '\d' ), // If the city only contains letters and spaces
    body('jobCity', VM.length( 'city', 3, 40 ) ).isLength(3, 40), // If the city meets the length requirements
    body('jobState', VM.required( 'state' ) ).not( ).isEmpty(), // If the state isn't empty
    body('jobState', VM.length( 'state', 2, 50 ) ).isLength(2, 50), // If the state meets the length requirements
    body('jobZIP', VM.required( 'zip' ) ).not( ).isEmpty(), // If the ZIP isn't empty
    body('jobZIP', VM.alpha_and_spaces( 'zip' ) ).isAlphanumeric( ), // If the ZIP only contains letters and numbers
    body('jobZIP', VM.length( 'zip', 2, 12 ) ).isLength(2, 12), // If the ZIP meets the length requirements
    body('quiz', VM.required( 'jobQuiz' ) ).optional( ).isArray( ),
    body('quiz', VM.length( 'jobQuiz', 0, 5 ) ).optional( ).custom( ( quiz ) => { // Define a custom validator
        if ( quiz == undefined ) return false; // If the array hasn't been set
        if ( quiz.length >= 0 && quiz.length <= 5 ) return true; // If the quiz array length is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('quiz.*.text', VM.required( 'jobQuizText' ) ).optional( ).not( ).isEmpty( ),
    body('quiz.*.text', VM.length( 'jobQuizText', 2, 400 ) ).optional( ).isLength( 2, 400 ),
    body('quiz.*.type', VM.zero_or_one_or_two( 'jobQuizType', 'quizOneAnswer', 'quizMultipleAnswers', 'quizTextAnswer' ) ).optional( ).custom( type => {
        if ( type == 0 || type == 1 || type == 2 ) return true;
        return false;
    } ),
    body('quiz.*.timeLimit', VM.numeric( 'jobQuizTimeLimit' ) ).optional( ).custom( ( timeLimit, { req, path } ) => {
        const quiz_str = path.split('.')[0];
        const index = quiz_str.substr( 5, quiz_str.length ).slice( 0, -1 );
        
        if ( req.body.quiz[ index ].type == 2 ) return true;
        if ( !isNaN( timeLimit ) ) return true;

        return false;
    } ),
    body('quiz.*.timeLimit', VM.length( 'jobQuizTimeLimit', 0, 900 ) ).optional( ).custom( timeLimit => {
        // This is okay to do because timeLimit can only be null
        // if the type of the question is 2, otherwise the above validator will fail
        if ( timeLimit == null ) return true;
        if ( timeLimit >= 0 && timeLimit <= 900 ) return true;
        return false;
    } ),
    body('quiz.*.points', VM.numeric( 'jobQuizPoints' ) ).optional( ).custom( ( points, { req, path } ) => {
        const quiz_str = path.split('.')[0];
        const index = quiz_str.substr( 5, quiz_str.length ).slice( 0, -1 );
        
        if ( req.body.quiz[ index ].type == 2 ) return true;
        if ( !isNaN( points ) ) return true;

        return false;
    } ),
    body('quiz.*.points', VM.length( 'jobQuizPoints', 1, 20 ) ).optional( ).custom( points => {
        // This is okay to do because points can only be null
        // if the type of the question is 2, otherwise the above validator will fail
        if ( points == null ) return true;
        if ( points >= 1 && points <= 20 ) return true;
        return false;
    } ),
    body('quiz.*.answers', VM.length( 'jobQuizAnswers', 2, 4 ) ).optional( ).custom( ( answers, { req, path } ) => {
        const quiz_str = path.split('.')[0];
        const index = quiz_str.substr( 5, quiz_str.length ).slice( 0, -1 );
        
        if ( req.body.quiz[ index ].type == 2 ) return true;
        if ( answers.length >= 2 && answers.length <= 4 ) return true;

        return false;
    } ),
    body('quiz.*.answers.*.value', VM.required( 'jobQuizAnswerValue' ) ).optional( ).not( ).isEmpty( ),
    body('quiz.*.answers.*.value', VM.length( 'jobQuizAnswerValue', 1, 200 ) ).optional( ).isLength( 1, 200 ),
    body('quiz.*.answers.*.correct', VM.boolean( 'jobQuizAnswerCorrect' ) ).optional( ).isBoolean( ),
    body('quizRequired', VM.boolean( 'jobQuizRequired' ) ).optional( ).isBoolean( )

], ( req, res ) => { // When posting to /new

    var title = req.body.jobTitle; // Create a variable for the title
    var description = req.body.jobDescription; // Create a variable for the description
    var defaultResponse = req.body.jobDefaultResponse; // Create a variable for the default response
    var typeID = req.body.jobTypeID; // Create a variable for the job type
    var recruiterID = req.decoded.id; // Create a variable for the recruiter
    var salary = parseInt( req.body.jobSalary ); // Create a variable for the salary
    var salaryType = req.body.jobSalaryType; // Create a variable for the salary type
    var experience = req.body.jobExperience; // Create a variable for the experience
    var employmentContract = req.body.jobEmploymentContract; // Create a variable for the employment contract
    var employmentTime = req.body.jobEmploymentTime; // Create a variable for the employment time
    var studentsAccepted = req.body.jobStudentsAccepted; // Create a variable for the students accepted
    var startingDate = req.body.jobStartingDate; // Create a variable for the starting date
    var address = req.body.jobAddress; // Create a variable for the address
    var city = req.body.jobCity; // Create a variable for the city
    var state = req.body.jobState; // Create a variable for the state
    var zip = req.body.jobZIP; // Create a variable for the ZIP
    var country = 'Croatia'; // Create a variable for the country ( currently only Croatia, but can be changed in the future once the app expands internationally )
    var lat; // Create a variable for the lat
    var long; // Create a variable for the long

    var quiz = req.body.quiz; // Create a variable for the quiz
    var quizRequired = req.body.quizRequired; // Create a variable for the quiz required

    console.log( 'Default response is: "' + defaultResponse + '"' )

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

    geocoder.geocode( { address, city, zipcode: zip, country } ).then( ( result ) => {
        lat = result[0].latitude;
        long = result[0].longitude;
    
        var job = { // Define a job object
            title: title, // Set the job title
            description: description, // Set the job description
            defaultResponse: defaultResponse, // Set the job default response
            typeID: typeID, // Set the job type ID
            recruiterID: recruiterID, // Set the job recruiter ID
            salary: salary, // Set the job salary
            salaryType: salaryType, // Set the job salary type
            experience: experience, // Set the job experience
            employmentContract: employmentContract, // Set the job employment contract
            employmentTime: employmentTime, // Set the job employment time
            studentsAccepted: studentsAccepted, // Set the job students accepted
            startingDate: startingDate, // Set the job starting date
            address: address, // Set the job address
            city: city, // Set the job city
            state: state, // Set the job state
            zip: zip, // Set the job zip
            country: country, // Set the job country
            lat: lat,
            long: long
        }

        Job.newJob( job ).then( ( jobID ) => { // Create a new job

            // If no quiz was specified
            if ( !quiz.length ) {
                res.status( 202 ); // // Set the status code to 202 ( Accepted )
                res.json( { message: MessageList.success.job.created } ); // Send back a message
                return;
            }

            Quiz.createQuiz( quiz, jobID ).then( quizID => {

                Job.updateJobQuiz( jobID, quizID, quizRequired ).then( quiz_update_result => {

                    res.status( 202 ); // // Set the status code to 202 ( Accepted )
                    res.json( { message: MessageList.success.job.created } ); // Send back a message

                } ).catch( error => {
                    console.log( error );
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.json( { message: MessageList.error.job.created_without_quiz } ); // Send the message back to the client
                } );

            } ).catch( error => {
                console.log( error );
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.job.created_without_quiz } ); // Send the message back to the client
            } );
    
            Job.getJobTypeInfo( 'JobTypeName', 'JobTypeID', typeID ).then( ( jobTypeResult ) => { // Get the job type name based on the job type ID
    
                Job.getAllUsersWithJobType( typeID ).then( ( all_users ) => {
    
                    let tokens = [ ];
        
                    for (let i = 0; i < all_users.length; i++) {
                        if ( all_users[i].UserPushToken ) tokens.push( all_users[i].UserPushToken );
                    }
        
                    // Send everyone a notification
                    sendNotificationInBulk( tokens, 'Novi posao u kategoriji ' + jobTypeResult[0].JobTypeName, title, null );
        
                } );
    
            } );
    
        } ).catch( ( error ) => {
            console.log( error ); // Log the error to the console
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    } ).catch( error => {
        console.log( error );
        res.status( 529 ); // Set the status code to 529 ( Site is overloaded )
        res.json( { message: MessageList.error.overloaded } ); // Send the message back to the client
    } );

} );

router.post( '/hire/:id', ( req, res ) => { // When posting to /hire/:id

    var id = req.params.id; // Create a variable for the job ID
    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getJobInfo( 'JobRecruiterID, JobHired', 'JobID', id ).then( ( result ) => {

        if( result.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( result[0].JobRecruiterID != recruiterID ) {
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.job.not_the_creator } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( result[0].JobHired == 1 ) {
            res.status( 409 ); // Set the status code to 409 ( Conflict )
            res.json( { message: MessageList.error.job.state_already_set } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.setJobHired( id ).then( ( hiredResult ) => {

            res.status( 202 ); // // Set the status code to 202 ( Accepted )
            res.json( { message: MessageList.success.job.status_set } ); // Send back a message

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

router.post( '/apply/:id', ( req, res ) => { // When posting to /apply/:id

    var id = req.params.id; // Create a variable for the job ID
    var userID = req.decoded.id; // Create a variable for the user ID
    var will_do_quiz = req.body.quiz; // Create a variable for will do quiz filter

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getJobInfo( 'JobTitle, JobDefaultResponse, JobRecruiterID, JobCancelled, JobQuizID, JobQuizRequired', 'JobID', id ).then( ( result ) => {

        if( result.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if( result[0].JobCancelled == 1 ) { // If the job is cancelled
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.job.cancelled } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.getApplicationInfo( 'ApplicationJobID', id, userID ).then( ( applicationResult ) => {

            if( applicationResult.length != 0 ) { // If the application exists
                res.status( 409 ); // Set the status code to 409 ( Conflict )
                res.json( { message: MessageList.error.job.already_applied } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            // -2 means there is was no quiz at the time of application
            // -1 means the user didnt want to fill out the quiz
            // NULL means the user is filling out the quiz
            // Everything else is the score
            let score = -2;
            // If there is a quiz set
            if ( result[0].JobQuizID ) {
                if ( result[0].JobQuizRequired == 0 ) {
                    if ( !will_do_quiz ) score = -1;
                    if ( will_do_quiz ) score = null;
                } else {
                    score = null;
                }
            }
            

            Job.newJobApplication( userID, result[0].JobRecruiterID, id, result[0].JobDefaultResponse, score ).then( ( newApplicationResult ) => {
                
                res.status( 202 ); // // Set the status code to 202 ( Accepted )
                res.json( { message: MessageList.success.job.successfully_applied } ); // Send back a message

                socket.io.in( result[0].JobRecruiterID ).clients( ( error, clients ) => {
                    
                    if ( error ) { // If there was an error
                        console.log( error ); // Print the error to the console
                        return; // Return to prevent further actions
                    }

                    if ( clients.length ) { // If the receiver is connected or was connected
                        socket.io.to( result[0].JobRecruiterID ).emit( 'new-application', {
                            message: 'You have received a new application for a job you posted!', // Set the message
                            id: id // Set the job ID
                        } ); // Send a 'new-application' socket to the client
                    } else { // If the receiver is not connected, send a notification
                        
                        // No mobile interface for recuiters yet
                        // sendNotification( userID, result[0].JobTitle, 'Nova prijava na vaš oglas', null );
        
                    }
    
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

router.post( '/save/:id', ( req, res ) => { // When posting to /save/:id

    var id = req.params.id; // Create a variable for the job ID
    var userID = req.decoded.id; // Create a variable for the user ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getJobInfo( 'JobRecruiterID', 'JobID', id ).then( ( result ) => {

        if( result.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.getSavedJobInfo( 'SavedJobID', id, userID ).then( ( jobResult ) => {

            if( jobResult.length != 0 ) { // If the job has been saved already
                res.status( 409 ); // Set the status code to 409 ( Conflict )
                res.json( { message: MessageList.error.job.already_saved } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            Job.saveJob( userID, id ).then( ( jobSaveResult ) => {
                
                res.status( 202 ); // // Set the status code to 202 ( Accepted )
                res.json( { message: MessageList.success.job.successfully_saved } ); // Send back a message

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

router.post( '/unsave/:id', ( req, res ) => { // When posting to /unsave/:id

    var id = req.params.id; // Create a variable for the job ID
    var userID = req.decoded.id; // Create a variable for the user ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getJobInfo( 'JobRecruiterID', 'JobID', id ).then( ( result ) => {

        if( result.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.getSavedJobInfo( 'SavedJobID', id, userID ).then( ( jobResult ) => {

            if( jobResult.length == 0 ) { // If the job has NOT been saved
                res.status( 409 ); // Set the status code to 409 ( Conflict )
                res.json( { message: MessageList.error.job.not_saved } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            Job.deleteSavedJob( id, userID ).then( ( jobUnSaveResult ) => {
                
                res.status( 202 ); // // Set the status code to 202 ( Accepted )
                res.json( { message: MessageList.success.job.successfully_unsaved } ); // Send back a message

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

router.post( '/cancel/:id', ( req, res ) => { // When posting to /cancel/:id
    
    var id = req.params.id; // Create a variable for the job ID
    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getJobInfo( 'JobCancelled, JobRecruiterID', 'JobID', id ).then( ( jobResult ) => {

        if( jobResult.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( jobResult[0].JobRecruiterID != recruiterID ) {
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.job.not_the_creator } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( jobResult[0].JobCancelled != 0 ) {
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.job.already_cancelled } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.cancelJob( id ).then( ( result ) => {

            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( { message: MessageList.success.job.cancelled } ); // Send back the message to the client

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

router.post( '/image/:id', ( req, res ) => { // When posting to /image

    var jobID = req.params.id; // Create a variable for the job ID
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
            
            Job.getJobInfo( 'JobRecruiterID, JobImagePath', 'JobID', jobID ).then( ( jobResult ) => {

                if( jobResult.length == 0 ) { // If the user doesn't exist
                    res.status( 404 ); // Set the status code to 404 ( Not Found )
                    res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
                    return; // Return to prevent further actions
                }

                if ( jobResult[0].JobRecruiterID != recruiterID ) { // If the recruiter doesn't own this job
                    res.status( 403 ); // Set the status code to 403 ( Forbidden )
                    res.json( { message: MessageList.error.job.not_the_creator } ); // Send the errors back to the client
                    return; // Return to prevent further actions
                }

                Job.updateJobPicture( req.file.path.substring( 7 ), jobID ).then( ( updateResult ) => { // Update the picture path in the database

                    if ( jobResult[0].JobImagePath != null ) { // If the job had a picture
                        fs.unlink( 'public/' + jobResult[0].JobImagePath, ( deleteError )  => { // Delete that saved picture
                            if ( deleteError ) { // If there was an error deleting it
                                console.log( deleteError ); // Log the error to the console
                            }
                        });
                    }
                    
                    // If the picture path was updated
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( { message: MessageList.success.job.image_uploaded } ); // Send back the message to the client
                    
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

router.post( '/image/remove', ( req, res ) => { // When posting to /image/remove
    
    var jobID = req.body.jobID; // Create a variable for the job ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getJobInfo( 'JobImagePath', 'JobID', jobID ).then( ( jobResult ) => {

        if( jobResult.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( jobResult[0].UserImagePath == null ) { // If the job doesn't have an image
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.no_image } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.updateJobPicture( null, jobID ).then( ( deleteResult ) => { // Delete the picture path in the database

            if ( jobResult[0].JobImagePath != null ) { // If the job had an image
                fs.unlink( 'public/' + jobResult[0].JobImagePath, ( deleteError )  => { // Delete that saved picture
                    if ( deleteError ) { // If there was an error deleting it
                        console.log( deleteError ); // Log the error to the console
                    }
                });
            }

            // If the picture path was updated
            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( { message: MessageList.success.job.image_deleted } ); // Send back the message to the client

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

router.post( '/quiz/answers', [

    body('answers', VM.required( 'quizAnswers' ) ).isArray( )

] , ( req, res ) => { // When visiting /:id/quiz

    var id = req.body.quizID; // Create a variable for the quiz ID
    var answers = req.body.answers; // Create a variable for the quiz answers
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

    Quiz.getQuizInfo( 'QuizJobID', 'QuizID', id ).then( quiz_result => {

        if ( quiz_result.length == 0 ) {
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.quiz.doesnt_exist } ); // Send the errors back to the client
            return;
        }

        Quiz.getQuestions( id ).then( ( questions ) => { // Get the job's current quiz ID
        
            let total_user_points = 0;
            let total_quiz_points = 0;

            questions.forEach( ( question, q_index ) => {
                
                const type = question.QuestionType;
                const points = question.QuestionPoints;

                total_quiz_points += points;

                // Current answer can be either string, one ID, or an array of IDs
                const current_answer = answers[ q_index ];

                new Promise( ( resolve, reject ) => {

                    // If the question isn't answered
                    if ( current_answer == null ) {
                        Quiz.createAnswer( question.QuestionID, userID, null, null, 0 ).then( _ => resolve( ) );
                        return;
                    }

                    Quiz.getCorrectAnswers( question.QuestionID ).then( ( correct_answers ) => {

                        if ( type == 0 ) {
                            const correct_ans = correct_answers[ 0 ].QuestionAnswerID;
                            if ( current_answer == correct_ans ) {
                                total_user_points += points;
                                Quiz.createAnswer( question.QuestionID, userID, current_answer, null, points ).then( _ => resolve( ) );
                                return;
                            }
                            
                            Quiz.createAnswer( question.QuestionID, userID, current_answer, null, 0 ).then( _ => resolve( ) );
                        }

                        if ( type == 1 ) {

                            const total_correct_answers = correct_answers.length;          
                            const points_per_question = +( ( 1 / total_correct_answers ) * points ).toFixed( 2 );

                            let list_of_correct_answers = [ ];
                            correct_answers.forEach( cor_ans => {
                                list_of_correct_answers.push( cor_ans.QuestionAnswerID );
                            } );

                            // If the user selected more correct answers than there actually are
                            if ( list_of_correct_answers.length > current_answer.length ) {

                                current_answer.forEach( ( ans, a_index ) => {
                                    Quiz.createAnswer( question.QuestionID, userID, current_answer[ a_index ], null, 0 ).then( _ => {
                                        if( a_index == ( current_answer.length - 1 ) ) resolve( );
                                    } );
                                } );

                                return;
                            }

                            // The user selected the exact amount of correct answers or less

                            current_answer.forEach( ( ans, a_index ) => {
                                if ( list_of_correct_answers.includes( ans ) ) {
                                    total_user_points += points_per_question;
                                    Quiz.createAnswer( question.QuestionID, userID, current_answer[ a_index ], null, points_per_question ).then( _ => {
                                        if( a_index == ( current_answer.length - 1 ) ) resolve( );
                                    } );
                                    return;
                                }

                                Quiz.createAnswer( question.QuestionID, userID, current_answer[ a_index ], null, 0 ).then( _ => {
                                    if( a_index == ( current_answer.length - 1 ) ) resolve( );
                                } );

                            } );
                            
                        }

                        if ( type == 2 ) {
                            Quiz.createAnswer( question.QuestionID, userID, null, current_answer, 0 ).then( _ => resolve( ) );
                        }

                    } );

                } ).then( _ => {

                    // Once the answer has been added
                    // Check if we are at the end

                    if ( q_index == ( questions.length - 1 ) ) {

                        const score = ( total_user_points / total_quiz_points ) * 100;

                        Job.checkApplication( 'ApplicationID', quiz_result[0].QuizJobID, userID ).then( app_result => {

                            if ( app_result.length == 0 ) {
                                res.status( 404 ); // Set the status code to 404 ( Not Found )
                                res.json( { message: MessageList.error.application.doesnt_exist } ); // Send the errors back to the client
                                return;
                            }

                            Job.setApplicationQuizScore( app_result[0].ApplicationID, score ).then( _ => {

                                res.status( 200 );
                                res.json( { message: 'Doney done' } );
    
                            } );

                        } );

                    }

                } );

            } );

        } ).catch( ( error ) => {
            console.log( error ); // Log the error to the console
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    } );

} );

router.get( '/:id/quiz', ( req, res ) => { // When visiting /:id/quiz
    
    var id = req.params.id; // Create a variable for the job ID
    var userID = req.decoded.id; // Create a variable for the user ID

    Job.getJobInfo( 'JobQuizID, JobQuizRequired', 'JobID', id ).then( ( job_quiz_result ) => { // Get the job's current quiz ID

        if( job_quiz_result.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        const quizID = job_quiz_result[0].JobQuizID;
        const quizRequired = job_quiz_result[0].JobQuizRequired;

        if( quizID === null ) { // If the job doesn't have a quiz
            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( [ ] ); // Send back the empty quiz
            return; // Return to prevent further actions
        }

        const quiz = [ ];

        Quiz.getQuestions( quizID ).then( questions => {

            questions.forEach( ( question, questionIndex ) => {
                
                quiz.push( {
                    text: question.QuestionText,
                    type: question.QuestionType,
                    answers: [ ]
                } );

                // If this is not a textual answer question, add the time limit and points
                if ( quiz[ questionIndex ].type != 2 ) {
                    quiz[ questionIndex ].timeLimit = question.QuestionTimeLimit;
                    quiz[ questionIndex ].points = question.QuestionPoints;
                }

                Quiz.getQuestionAnswers( question.QuestionID ).then( ( answers ) => {

                    // If the question type is 2 and there are no answers
                    if ( answers.length == 0 ) {
                        // If we are at the last question and we have no answers to add
                        if ( questionIndex == ( questions.length - 1 ) ) {
                            res.status( 200 ); // Set the status code to 200 ( Okay )
                            res.json( { quiz, quizRequired, quizID } ); // Send back the quiz
                        }
                        return;
                    }

                    answers.forEach( ( answer, answerIndex ) => {
                        
                        quiz[ questionIndex ].answers.push( {
                            value: answer.QuestionAnswerValue
                        } );

                        // Only add correct data for recruiters, this prevents cheating if someone can extract the data
                        if ( req.decoded.type === 'recruiter' ) quiz[ questionIndex ].answers[ answerIndex ].correct = answer.QuestionAnswerCorrect;

                        // Add the answer ID's if we are dealing with a user
                        if ( req.decoded.type === 'user' ) quiz[ questionIndex ].answers[ answerIndex ].id = answer.QuestionAnswerID;

                        // If we have added all the answers and all the questions to the quiz array
                        if ( answerIndex == ( answers.length - 1 ) && questionIndex == ( questions.length - 1 ) ) {
                            res.status( 200 ); // Set the status code to 200 ( Okay )
                            res.json( { quiz, quizRequired, quizID } ); // Send back the quiz
                        }

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

router.post( '/:id/quiz', [

    body('quiz', VM.required( 'jobQuiz' ) ).isArray( ),
    body('quiz', VM.length( 'jobQuiz', 0, 5 ) ).custom( ( quiz ) => { // Define a custom validator
        if ( quiz == undefined ) return false; // If the array hasn't been set
        if ( quiz.length >= 0 && quiz.length <= 5 ) return true; // If the quiz array length is within an acceptable range return true ( no error )
        return false; // Otherwise return false ( error )
    } ),
    body('quiz.*.text', VM.required( 'jobQuizText' ) ).not( ).isEmpty( ),
    body('quiz.*.text', VM.length( 'jobQuizText', 2, 400 ) ).isLength( 2, 400 ),
    body('quiz.*.type', VM.zero_or_one_or_two( 'jobQuizType', 'quizOneAnswer', 'quizMultipleAnswers', 'quizTextAnswer' ) ).custom( type => {
        if ( type == 0 || type == 1 || type == 2 ) return true;
        return false;
    } ),
    body('quiz.*.timeLimit', VM.numeric( 'jobQuizTimeLimit' ) ).custom( ( timeLimit, { req, path } ) => {
        const quiz_str = path.split('.')[0];
        const index = quiz_str.substr( 5, quiz_str.length ).slice( 0, -1 );
        
        if ( req.body.quiz[ index ].type == 2 ) return true;
        if ( !isNaN( timeLimit ) ) return true;

        return false;
    } ),
    body('quiz.*.timeLimit', VM.length( 'jobQuizTimeLimit', 0, 900 ) ).custom( timeLimit => {
        // This is okay to do because timeLimit can only be null
        // if the type of the question is 2, otherwise the above validator will fail
        if ( timeLimit == null ) return true;
        if ( timeLimit >= 0 && timeLimit <= 900 ) return true;
        return false;
    } ),
    body('quiz.*.points', VM.numeric( 'jobQuizPoints' ) ).custom( ( points, { req, path } ) => {
        const quiz_str = path.split('.')[0];
        const index = quiz_str.substr( 5, quiz_str.length ).slice( 0, -1 );
        
        if ( req.body.quiz[ index ].type == 2 ) return true;
        if ( !isNaN( points ) ) return true;

        return false;
    } ),
    body('quiz.*.points', VM.length( 'jobQuizPoints', 1, 20 ) ).custom( points => {
        // This is okay to do because points can only be null
        // if the type of the question is 2, otherwise the above validator will fail
        if ( points == null ) return true;
        if ( points >= 1 && points <= 20 ) return true;
        return false;
    } ),
    body('quiz.*.answers', VM.length( 'jobQuizAnswers', 2, 4 ) ).custom( ( answers, { req, path } ) => {
        const quiz_str = path.split('.')[0];
        const index = quiz_str.substr( 5, quiz_str.length ).slice( 0, -1 );
        
        if ( req.body.quiz[ index ].type == 2 ) return true;
        if ( answers.length >= 2 && answers.length <= 4 ) return true;

        return false;
    } ),
    body('quiz.*.answers.*.value', VM.required( 'jobQuizAnswerValue' ) ).not( ).isEmpty( ),
    body('quiz.*.answers.*.value', VM.length( 'jobQuizAnswerValue', 1, 200 ) ).isLength( 1, 200 ),
    body('quiz.*.answers.*.correct', VM.boolean( 'jobQuizAnswerCorrect' ) ).isBoolean( ),
    body('quizRequired', VM.boolean( 'jobQuizRequired' ) ).isBoolean( )

] , ( req, res ) => { // When visiting /:id/quiz

    var id = req.params.id; // Create a variable for the job ID
    var quiz = req.body.quiz; // Create a variable for the quiz
    var quizRequired = req.body.quizRequired; // Create a variable for the quiz required setting
    var recruiterID = req.decoded.id; // Create a variable for the recruiterID ID

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

    Job.getJobInfo( 'JobRecruiterID, JobHired, JobCancelled', 'JobID', id ).then( ( job_quiz_result ) => { // Get the job's current quiz ID

        if( job_quiz_result.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( job_quiz_result[ 0 ].JobRecruiterID != recruiterID ) { // If the recruiter is not the owner of this job
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.job.not_the_creator } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( job_quiz_result[ 0 ].JobHired == 1 || job_quiz_result[ 0 ].JobCancelled == 1 ) { // If the recruiter is not the owner of this job
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.job.cancelled } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Quiz.createQuiz( quiz, id ).then( quizID => {

            Job.updateJobQuiz( id, quizID, quizRequired ).then( quiz_update_result => {

                res.status( 202 ); // // Set the status code to 202 ( Accepted )
                res.json( { message: MessageList.success.job.quiz_updated } ); // Send back a message

            } ).catch( error => {
                console.log( error );
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
            } );

        } ).catch( error => {
            console.log( error );
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

      } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.post( '/:id/app-response', [
    
    body('defaultResponse', VM.length( 'jobDefaultResponse', 3, 800 ) ).optional( { checkFalsy: true } ).isLength(3, 800), // If the default response meets the length requirements

] , ( req, res ) => { // When visiting /:id/quiz

    var id = req.params.id; // Create a variable for the job ID
    var defaultResponse = req.body.defaultResponse; // Create a variable for the defaultResponse
    var recruiterID = req.decoded.id; // Create a variable for the recruiterID ID

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

    Job.getJobInfo( 'JobRecruiterID', 'JobID', id ).then( ( job_result ) => { // Get the job's current quiz ID

        if( job_result.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( job_result[ 0 ].JobRecruiterID != recruiterID ) { // If the recruiter is not the owner of this job
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.job.not_the_creator } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.updateDefaultResponse( defaultResponse, id ).then( result => {
            
            res.status( 202 ); // // Set the status code to 202 ( Accepted )
            res.json( { message: MessageList.success.job.response_updated } ); // Send back a message

        } ).catch( error => {
            console.log( error );
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

      } ).catch( ( error ) => {
        console.log( error ); // Log the error to the console
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

router.get( '/:id', ( req, res ) => { // When visiting /:id
    
    var id = req.params.id; // Create a variable for the job ID
    var userID = req.decoded.id; // Create a variable for the user ID

    Job.getJobInfo( `JobTitle, JobDescription, JobDefaultResponse, JobTypeID, JobRecruiterID, JobSalary, JobSalaryType, JobExperience, JobEmploymentContract, JobEmploymentTime, JobStudentsAccepted, JobCreated, JobStartingDate, JobHired, JobCancelled, JobImagePath, JobQuizID, JobQuizRequired, JobAddress, JobCity, JobState, JobZip, JobCountry, JobLat, JobLong`, 'JobID', id ).then( ( result ) => { // Get all the info about a job

        if( result.length == 0 ) { // If the job doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.job.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        
        Job.getJobTypeInfo( 'JobTypeName', 'JobTypeID', result[0].JobTypeID ).then( ( jobTypeResult ) => { // Get the job type name based on the job type ID
            
            var job = { // Define a job object
                id: id, // Set the job ID
                title: result[0].JobTitle, // Set the job title
                description: result[0].JobDescription, // Set the job description
                defaultResponse: result[0].JobDefaultResponse, // Set the job default response
                type: jobTypeResult[0].JobTypeName, // Set the job type name
                typeID: result[0].JobTypeID, // Set the job type ID
                salary: result[0].JobSalary, // Set the job salary
                salaryType: result[0].JobSalaryType, // Set the job salary type
                experience: result[0].JobExperience, // Set the job experience
                employmentContract: result[0].JobEmploymentContract, // Set the job employment contract
                employmentTime: result[0].JobEmploymentTime, // Set the job employment time
                studentsAccepted: result[0].JobStudentsAccepted, // Set whether students are accepted
                created: result[0].JobCreated, // Set the job creation date
                startingDate: result[0].JobStartingDate, // Set the job starting date
                hired: result[0].JobHired, // Set the job hired state
                cancelled: result[0].JobCancelled, // Set the job cancelled state
                imagePath: ( result[0].JobImagePath ) ? result[0].JobImagePath.replace(/\\/g,"/") : '', // Set the job image path
                quizID: result[0].JobQuizID, // Set the job quiz ID
                quizRequired: result[0].JobQuizRequired, // Set the job quiz required flag
                address: result[0].JobAddress, // Set the job address
                city: result[0].JobCity, // Set the job city
                state: result[0].JobState, // Set the job state
                zip: result[0].JobZip, // Set the job zip
                country: result[0].JobCountry, // Set the job country
                location: result[0].JobLat +',' + result[0].JobLong, // Set the job location
            }

            // The recruiter doesn't need any other info
            if ( req.decoded.type == 'recruiter' ) {
                res.status( 200 ); // // Set the status code to 200 ( Okay )
                res.json( job ); // Send back the job info
                return; // Return to prevent further actions
            }
                
            User.getRecruiterInfo( 'RecruiterFirstName, RecruiterLastName, RecruiterCompanyName, RecruiterImagePath', 'RecruiterID', result[0].JobRecruiterID ).then( ( recruiterResult ) => { // Get the recruiter name based on the recruiter ID
                
                job = { ...job,
                    recruiterID: result[0].JobRecruiterID, // Set the recruiter ID
                    recruiterFirstName: recruiterResult[0].RecruiterFirstName, // Set the job recruiter first name
                    recruiterLastName: recruiterResult[0].RecruiterLastName, // Set the job recruiter last name
                    recruiterImagePath: ( recruiterResult[0].RecruiterImagePath ) ? recruiterResult[0].RecruiterImagePath.replace(/\\/g,"/") : '', // Set the job recruiter image path
                    companyName: recruiterResult[0].RecruiterCompanyName, // Set the job company name
                    saved: false, // Set the job saved state
                    applied: false // Set the job applied state
                }

                Job.getSavedJobInfo( 'SavedID', id, userID ).then( ( saved_result ) => { // Check to see if the job has been saved by the user

                    if ( saved_result.length != 0 ) { // If the result isn't empty ( the job has been saved )
                        job.saved = true; // Set the job as saved
                    }

                    Job.checkApplication( 'ApplicationStatus', id, userID ).then( ( applied_result ) => {

                        if ( applied_result.length != 0 ) { // If the user applied for the job
                            job.applied = true; // Set the job status as applied
                        }

                        res.status( 200 ); // // Set the status code to 200 ( Okay )
                        res.json( job ); // Send back the job info

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
var express = require('express'); // Get the express so that we can get the router
var { body, validationResult } = require('express-validator'); // Use the express validator to validate forms

var router = express.Router(); // We don't have the app variable so we use the Router class to route from here

var Job = require( '../models/job.js' ); // Get the job model
var User = require( '../models/user.js' ); // Get the user model

var MessageList = require( '../message_config' ); // Get the message list
var VM = require( '../verification_config' ); // Get the verification message list

router.post( '/search', [ 
    body('gte', VM.gte( 'searchGTE', 500 ) ).optional( ).custom( ( gte ) => { // Define a custom validator
        if ( gte >= 500 ) return true; // If the gte filter is within an acceptable range return true ( no error )
        return false;
    } ),
    body('gte', VM.numeric( 'searchGTE' ) ).optional( ).isNumeric(),
    body('lte', VM.lte( 'searchLTE', 2000000 ) ).optional( ).custom( ( lte ) => { // Define a custom validator
        if ( lte <= 2000000 ) return true; // If the lte filter is within an acceptable range return true ( no error )
        return false;
    } ),
    body('lte', VM.numeric( 'searchLTE' ) ).optional( ).isNumeric(),
    body('perPage', VM.between( 'perPage', 0, 10 ) ).optional( ).custom( ( perPage ) => ( perPage >= 0 && perPage <= 10 ) ),
    body('perPage', VM.numeric( 'perPage' ) ).optional( ).isNumeric(),
    body('page', VM.between( 'pageFilter', 0, 10000 ) ).optional( ).custom( ( page ) => ( page >= 0 && page <= 10000 ) ),
    body('page', VM.numeric( 'pageFilter' ) ).optional( ).isNumeric(),
    body('contract', VM.zero_or_one( 'jobEmploymentContract', 'partTime', 'fullTime' ) ).optional( ).custom( ( contract ) => ( contract === 0 || contract === 1 ) ),
    body('temporary', VM.zero_or_one( 'jobEmploymentTime', 'permanent', 'temporary' ) ).optional( ).custom( ( temporary ) => ( temporary === 0 || temporary === 1 ) ),
    body('studentsAccepted', VM.zero_or_one( 'jobStudentsAccepted', 'notAccepted', 'accepted' ) ).optional( ).custom( ( studentsAccepted ) => ( studentsAccepted === 0 || studentsAccepted === 1 ) ),
    body('city', VM.alpha_and_spaces( 'city' ) ).optional( ).matches('^[a-zA-Z ]+$'), // If the city only contains letters
    body('city', VM.length( 'city', 3, 40 ) ).optional( ).isLength(3, 40), // If the city meets the length requirements

 ], ( req, res ) => { // When visiting /search
    
    var userID = req.decoded.id; // Create a variable for the user ID

    if ( req.decoded.type != 'user' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.user_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    if ( Object.keys(req.body).length === 0 ) { // If the body is empty
        res.status( 406 ); // Set the status code to 406 ( Unacceptable )
        res.send( MessageList.error.query.must_specify ); // Send the error to the client
        return; // Return to prevent further actions
    }

    var gte = req.body.gte; // Create a variable for the gte filter
    var lte = req.body.lte; // Create a variable for the lte filter
    var perPage = req.body.perPage; // Create a variable for the perPage filter
    var page = req.body.page; // Create a variable for the page filter
    var type = req.body.type; // Create a variable for the type filter
    var experience = req.body.experience; // Create a variable for the experience filter
    var contract = req.body.contract; // Create a variable for the contract filter
    var temporary = req.body.temporary; // Create a variable for the temporary filter
    var studentsAccepted = req.body.studentsAccepted; // Create a variable for the students accepted filter
    var city = req.body.city; // Create a variable for the city
	
    if ( perPage == "" || perPage == null ) perPage = 10; // Set a default per page number

    if ( page == "" || page == null ) page = 0; // Set a default page number

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.send( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    new Promise( ( resolve, reject ) => {
    
        if ( city ) { // If the city query has been specified
            Job.search( null, null, gte, lte, page, perPage, type, experience, contract, temporary, studentsAccepted, city ).then( search_result => resolve( search_result ) ).catch( e => reject( e ) );
        } else {
            var userLocation = global.cache.get( userID + '-location' ); // Get the user location from the cache
            if ( userLocation == null ) { // If the location isn't saved in the cache
                User.getUserInfo( 'UserLat, UserLong', 'UserID', userID ).then( ( userResult ) => { // Query the database for the cache

                    var lat = userResult[0].UserLat; // Set the lat of the search after splicing the location by ','
                    var lon = userResult[0].UserLong; // Set the lon of the search after splicing the location by ','
    
                    Job.search( lat, lon, gte, lte, page, perPage, type, experience, contract, temporary, studentsAccepted, null ).then( search_result => resolve( search_result ) ).catch( e => reject( e ) );
                    global.cache.set( userID + '-location', { lat: lat, lon: lon } ); // Set the user location in the cache
    
                } ).catch( ( error ) => { // If there was an error with getting the user from the database
                    reject( error ); // Reject the promise with the error
                } );
            } else { // If the user location is saved in the cache
                Job.search( userLocation.lat, userLocation.lon, gte, lte, page, perPage, type, experience, contract, temporary, studentsAccepted, null ).then( search_result => resolve( search_result ) ).catch( e => reject( e ) );
            }

        }

    } ).then( ( search_result ) => {
        
        res.status( 200 ); // Set the status code to 200 ( Okay )
        res.send( search_result ); // Send the result to the user

    } ).catch( ( error ) => {
        console.log( error );
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.send( MessageList.error.unknown ); // Send the error to the client
    } );

} );

module.exports = router;
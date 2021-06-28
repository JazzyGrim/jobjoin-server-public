var express = require('express'); // Get the express so that we can get the router
var { body, query, params, validationResult } = require('express-validator'); // Use the express validator to validate forms

var router = express.Router(); // We don't have the app variable so we use the Router class to route from here

var User = require( '../models/user.js' ); // Get the user model
var Report = require( '../models/report.js' ); // Get the report model

var MessageList = require( '../message_config' ); // Get the message list
var VM = require( '../verification_config' ); // Get the verification message list

router.post( '/new', [

    body('reason', VM.required( 'reportReason' ) ).not( ).isEmpty(), // If the report reason isn't empty
	body('reason', VM.length( 'reportReason', 8, 500 ) ).isLength(8, 500) // If the report reason meets the length requirements

], ( req, res ) => { // When posting to /new

    var id = req.decoded.id; // Create a variable for the user ID
    var type = req.decoded.type; // Create a variable for the user type

    var reportedID = req.body.reportedID; // Create a variable for the reported user's ID
    var reason = req.body.reason; // Create a variable for the report reason

    // Validation
    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    if ( type == 'user' ) { // If the report sender is a user

        User.getRecruiterInfo( 'RecruiterEmail, RecruiterBanned', 'RecruiterID', reportedID ).then( ( result ) => {
                
            if( result.length == 0 ) { // If the recruiter doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            if ( result[0].RecruiterBanned == 1 ) { // If the recruiter has been banned
                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                res.json( { message: MessageList.error.recruiter.banned } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            if ( result[0].RecruiterEmail == null ) { // If the recruiter deleted their account
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.recruiter.deleted } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            Report.getReport( id, reportedID ).then( ( reportResult ) => {

                if( reportResult.length != 0 ) { // If the user already submitted reports for the recruiter
                    res.status( 403 ); // Set the status code to 403 ( Forbidden )
                    res.json( { message: MessageList.error.recruiter.already_reported } ); // Send the errors back to the client
                    return; // Return to prevent further actions
                }

                var report = { // Create a variable for the new report
                    senderID: id, // Set the report sender ID
                    receiverID: reportedID, // Set the report receiver ID
                    reason: reason // Set the report reason
                }
    
                Report.newReport( report ).then( ( newReportResult ) => {
    
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( { message: MessageList.success.report.submitted } ); // Send back the message to the client
    
                } ).catch( ( error ) => {
                    console.log( error );
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                } );

            } ).catch( ( error ) => {
                console.log( error );
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
            } );

        } ).catch( ( error ) => {
            console.log( error );
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    } else if ( type == 'recruiter' ) {

        User.getUserInfo( 'UserEmail, UserBanned', 'UserID', reportedID ).then( ( result ) => {
                
            if( result.length == 0 ) { // If the user doesn't exist
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.user.doesnt_exist } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            if ( result[0].UserBanned == 1 ) { // If the user has been banned
                res.status( 403 ); // Set the status code to 403 ( Forbidden )
                res.json( { message: MessageList.error.user.banned } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            if ( result[0].UserEmail == null ) { // If the user deleted their account
                res.status( 404 ); // Set the status code to 404 ( Not Found )
                res.json( { message: MessageList.error.user.deleted } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            Report.getReport( id, reportedID ).then( ( reportResult ) => {

                if( reportResult.length != 0 ) { // If the recruiter already submitted reports for the user
                    res.status( 403 ); // Set the status code to 403 ( Forbidden )
                    res.json( { message: MessageList.error.user.already_reported } ); // Send the errors back to the client
                    return; // Return to prevent further actions
                }

                var report = { // Create a variable for the new report
                    senderID: id, // Set the report sender ID
                    receiverID: reportedID, // Set the report receiver ID
                    reason: reason // Set the report reason
                }
    
                Report.newReport( report ).then( ( newReportResult ) => {
    
                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( { message: MessageList.success.report.submitted } ); // Send back the message to the client
    
                } ).catch( ( error ) => {
                    console.log( error );
                    res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                    res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                } );

            } ).catch( ( error ) => {
                console.log( error );
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
            } );

        } ).catch( ( error ) => {
            console.log( error );
            res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
            res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
        } );

    }

} );

router.post( '/bug', [ 

    body('info', VM.required( 'bugInfo' ) ).not( ).isEmpty(), // If the bug info isn't empty
	body('info', VM.length( 'bugInfo', 8, 500 ) ).isLength(8, 500) // If the bug info meets the length requirements

 ], ( req, res ) => { // When posting to /bug

    var id = req.decoded.id; // Create a variable for the user ID
    var info = req.body.info; // Create a variable for the bug info

    // Validation
    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Report.newBugReport( info, id ).then( ( result ) => {

        res.status( 200 ); // Set the status code to 200 ( Okay )
        res.json( { message: MessageList.success.bug.submitted } ); // Send back the message to the client

    } ).catch( ( error ) => {
        console.log( error ); // Log the error
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

module.exports = router;
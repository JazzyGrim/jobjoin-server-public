var express = require('express'); // Get the express so that we can get the router
var { body, query, params, validationResult } = require('express-validator'); // Use the express validator to validate forms

var router = express.Router(); // We don't have the app variable so we use the Router class to route from here

var Job = require( '../models/job.js' ); // Get the job model
var Chat = require( '../models/chat.js' ); // Get the chat model
var User = require( '../models/user.js' ); // Get the user model

var socket = require('../socket.js'); // Get the socket IO server
var { sendNotification } = require('../notificationManager.js'); // Get the notification manager

var MessageList = require( '../message_config' ); // Get the message list

router.post( '/deny', ( req, res ) => { // When posting to /deny

    var applicationID = req.body.applicationID; // Create a variable for the application ID
    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getApplicationByRecruiter( 'ApplicationStatus, ApplicationUserID', applicationID, recruiterID ).then( ( result ) => {
        if( result.length == 0 ) { // If the application doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.application.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        if ( result[0].ApplicationStatus != 0 ) { // If the application status has already been set
            if ( result[0].ApplicationStatus == 2 ) {
                res.status( 409 ); // Set the status code to 409 ( Conflict )
                res.json( { message: MessageList.error.application.already_denied } ); // Send the errors back to the client
                return; // Return to prevent further actions
            }
        }

        var lastWeekTime = new Date(); // Create a new date object
        lastWeekTime.setDate( lastWeekTime.getDate() - 7 ); // Remove one day from the date
        if ( result[0].ApplicationIssued < lastWeekTime ) { // If the application is older than one day, it's expired
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.application.expired } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.setApplicationStatus( applicationID, 2 ).then( ( statusResult ) => {

            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( { message: MessageList.success.application.denied } ); // Send the message back to the recruiter

            let userID = result[ 0 ].ApplicationUserID;
            let message = 'Poslodavac je odbio vašu prijavu.';

            socket.io.in( userID ).clients( ( error, clients ) => {
                
                if ( error ) { // If there was an error
                    console.log( error ); // Print the error to the console
                    return; // Return to prevent further actions
                }

                if ( clients.length ) { // If the receiver is connected or was connected
                    io.to( userID ).emit( 'new-unlock', { message } ); // Send a 'new-unlock' socket to the client
                } else { // If the receiver is not connected, send a notification
    
                    sendNotification( userID, 'Prijava odbijena', message, null );
    
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

} );

router.post( '/shortlist', ( req, res ) => { // When posting to /shortlist

    var applicationID = req.body.applicationID; // Create a variable for the application ID
    var recruiterID = req.decoded.id; // Create a variable for the recruiter ID

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    Job.getApplicationByRecruiter( 'ApplicationStatus, ApplicationUserID', applicationID, recruiterID ).then( ( result ) => {
        if( result.length == 0 ) { // If the application doesn't exist
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.application.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        let newStatus = 1; // By default, set the application status to shortlisted

        if ( result[0].ApplicationStatus != 0 ) { // If the application status has already been set
            if ( result[0].ApplicationStatus == 2 ) {
                res.status( 409 ); // Set the status code to 409 ( Conflict )
                res.json( { message: MessageList.error.application.already_denied } ); // Send the errors back to the client
                return; // Return to prevent further actions
            } else { // It is shortlisted currently
                newStatus = 0; // Make the application un-shortlisted
            }
        }

        var lastWeekTime = new Date(); // Create a new date object
        lastWeekTime.setDate( lastWeekTime.getDate() - 7 ); // Remove one week from the date
        if ( result[0].ApplicationIssued < lastWeekTime ) { // If the application is older than one day, it's expired
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.application.expired } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        Job.setApplicationStatus( applicationID, newStatus ).then( ( statusResult ) => {

            res.status( 200 ); // Set the status code to 200 ( Okay )
            res.json( { message: newStatus ? MessageList.success.application.shortlisted : MessageList.success.application.un_shortlisted } ); // Send the message back to the recruiter

            let userID = result[ 0 ].ApplicationUserID;
            let message = newStatus ? 'Poslodavac vas je dodao u uži izbor!' : 'Poslodavac vas je maknuo iz užeg izbora!';

            socket.io.in( userID ).clients( ( error, clients ) => {
                
                if ( error ) { // If there was an error
                    console.log( error ); // Print the error to the console
                    return; // Return to prevent further actions
                }

                if ( clients.length ) { // If the receiver is connected or was connected
                    socket.io.to( userID ).emit( 'new-unlock', { message } ); // Send a 'new-unlock' socket to the client
                } else { // If the receiver is not connected, send a notification
    
                    sendNotification( userID, 'Prijava ažurirana', message, null );
    
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

} );

module.exports = router;
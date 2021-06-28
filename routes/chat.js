var fs = require('fs'); // Get the file system
var path = require('path'); // Core Module in Node JS

var express = require('express'); // Get the express so that we can get the router
var { check, body, query, params, validationResult } = require('express-validator'); // Use the express validator to validate forms

var router = express.Router(); // We don't have the app variable so we use the Router class to route from here

var User = require( '../models/user.js' ); // Get the user model
var Chat = require( '../models/chat.js' ); // Get the chat model

var MessageList = require( '../message_config' ); // Get the message list
var VM = require( '../verification_config' ); // Get the verification message list

router.get( '/chat-history', [

    check('page', VM.required( 'pageFilter' ) ).not().isEmpty(),
    check('page', VM.length( 'pageFilter', 0, 10000 ) ).custom( ( page ) => ( page >= 0 && page <= 10000 ) ),
    check('page', VM.numeric( 'pageFilter' ) ).isNumeric()
    
], ( req, res ) => { // When visiting /chat
    
    var senderID = req.decoded.id; // Create a variable for the senderID
    var type = req.decoded.type; // Create a variable for the user type
    var page = req.query.page; // Create a variable for the page

    var errors = validationResult( req ).array( { onlyFirstError: true } ); // Store all the errors inside the errors variable

    if ( errors.length ) { // If Express Validator finds errors in the given fields
        res.status( 449 ); // Set the status code to 449 ( Retry With )
        res.json( errors ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    var history = []; // Create an array for all the messages

    Chat.getHistoryBySender( senderID, page ).then( ( senderResult ) => {

        Chat.getHistoryByReceiver( senderID, page ).then( ( recieverResult ) => {
            
            
            if( senderResult.length == 0 && recieverResult.length == 0 ) { // If there are no chats
                res.status( 200 ); // Set the status code to 200 ( Okay )
                res.json( history ); // Send the errors back to the client
                return; // Return to prevent further actions
            }

            for (let i = 0; i < recieverResult.length; i++) { // For each receiver result
                if ( senderResult[ i ] != null ) { // If the sender array has an item at this position
                    if ( senderResult[ i ].MessageSenderID == recieverResult[ i ].MessageReceiverID && senderResult[ i ].MessageReceiverID == recieverResult[ i ].MessageSenderID ) { // Check if that message is from the same person
                        if ( senderResult[ i ].MessageID < recieverResult[ i ].MessageID ) { // If this message is newer than the sender one
                            senderResult[ i ] = recieverResult[ i ]; // Replace the message with the new one
                        }
                    }
                } else { // If the receiver result is longer than the sender result
                    senderResult.push( recieverResult[ i ] ); // Push the receiver result to the array
                }
            }

            for (let i = 0; i < senderResult.length; i++) { // For each sender result
                
                var queryID; // Create a variable for the recruiter ID

                if ( senderResult[ i ].MessageSenderID == senderID ) { // If the sender ID is equal to this sender's ID
                    queryID = senderResult[ i ].MessageReceiverID; // Set the recruiter ID to the receiver ID
                } else { // If the sender ID is not equal to the sender's ID ( this means that the sender is the recruiter )
                    queryID = senderResult[ i ].MessageSenderID; // Set the recruiter ID to the sender ID
                }

                if ( type == 'user' ) { // If the sender is a user

                    User.getRecruiterInfo( 'RecruiterFirstName, RecruiterLastName, RecruiterCompanyName, RecruiterImagePath', 'RecruiterID', queryID ).then( ( recruiterResult ) => {

                        history.push( { // Push the message to the history array
                            messageID: senderResult[ i ].MessageID, // Set the message ID
                            messageText: senderResult[ i ].MessageText, // Set the message text
                            messageTime: senderResult[ i ].MessageTime, // Set the message time
                            messageSenderID: senderResult[ i ].MessageSenderID, // Set the message sender ID
                            messageReceiverID: senderResult[ i ].MessageReceiverID, // Set the message receiver ID
                            recruiterID: queryID, // Set the recruiter ID
                            recruiterFirstName: recruiterResult[0].RecruiterFirstName, // Set the recruiter first name
                            recruiterLastName: recruiterResult[0].RecruiterLastName, // Set the recruiter last name
                            recruiterCompanyName: recruiterResult[0].RecruiterCompanyName, // Set the recruiter company name
                            recruiterImagePath: recruiterResult[0].RecruiterImagePath ? recruiterResult[0].RecruiterImagePath.replace(/\\/g,"/") : "" // Set the recruiter image path
                        } );
        
                        if ( i == ( senderResult.length - 1 ) ) { // If we are at the end of the loop ( last itteration )
        
                            res.status( 200 ); // Set the status code to 200 ( Okay )
                            res.json( history ); // Send back the chat history
        
                        }
        
                    } ).catch( ( error ) => {
                        console.log( error ); // Log the error
                        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                    } );

                } else if ( type == 'recruiter' ) { // If the sender is a receiver

                    User.getUserInfo( 'UserFirstName, UserLastName, UserImagePath', 'UserID', queryID ).then( ( userResult ) => {

                        history.push( { // Push the message to the history array
                            messageID: senderResult[ i ].MessageID, // Set the message ID
                            messageText: senderResult[ i ].MessageText, // Set the message text
                            messageTime: senderResult[ i ].MessageTime, // Set the message time
                            messageSenderID: senderResult[ i ].MessageSenderID, // Set the message sender ID
                            messageReceiverID: senderResult[ i ].MessageReceiverID, // Set the message receiver ID
                            userID: queryID, // Set the user ID
                            userFirstName: userResult[0].UserFirstName, // Set the user first name
                            userLastName: userResult[0].UserLastName, // Set the user last name
                            userImagePath: userResult[0].UserImagePath ? userResult[0].UserImagePath.replace(/\\/g,"/") : "" // Set the user image path
                        } );
        
                        if ( i == ( senderResult.length - 1 ) ) { // If we are at the end of the loop ( last itteration )
        
                            res.status( 200 ); // Set the status code to 200 ( Okay )
                            res.json( history ); // Send back the chat history
        
                        }
        
                    } ).catch( ( error ) => {
                        console.log( error ); // Log the error
                        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
                    } );

                } else {
                    res.status( 404 ); // Set the status code to 404 ( Not Found )
                    res.json( { message: MessageList.error.user_type.unknown } ); // Send the errors back to the client
                }

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
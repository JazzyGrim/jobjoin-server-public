/*
*
*   Upravljanje primljenim web socketima te odgovaranje na te zahtjeve
*
*/

var User = require( './models/user.js' ); // Get the user model
var Job = require( './models/job.js' ); // Get the job model
var Chat = require( './models/chat.js' ); // Get the chat model
var jwt = require('jsonwebtoken'); // Use the JWT ( JSON WEB TOKEN )
var socket = require('socket.io'); // Use SocketIO

const config = require('./config.js'); // Get the config
var { sendNotification } = require('./notificationManager.js'); // Get the notification manager

var MessageList = require( './message_config' ); // Get the message list

module.exports.create = ( server ) => {

    // Set up the chat
    var io = socket( server, { pingInterval: 25000, pingTimeout: 30000 } );

    module.exports.io = io;

    io.use( ( socket, next ) => {

        // check header or url parameters or post parameters for token
        var token = socket.request._query['token'];
        // If the token was provided
        if ( token ) {
            // Verifies secret and checks EXP
            jwt.verify(token, config.jwt.secret, function( err, decoded ) { // Verify the provided token
                if ( err ) { // If there was an error
                    let error = new Error( 'Authentication Error' ); // Create a new Error instance
                    error.data = { type: 'authentication_error_verify' }; // Set the error type
                    next( error ); // Go to the next middleware with an error
                    return; // Return to prevent further actions
                } else {
                    // if everything is good, save to request for use in other routes
                    socket.token = token; // Set the request variable token
                    socket.decoded = decoded; // Set the request variale decoded
                    next(); // Go to the next middleware
                }
            } );
        } else {
            // If a token isn't provided, restrict access
            let error = new Error( 'Authentication Error' ); // Create a new Error instance
            error.data = { type: 'authentication_error_specify' }; // Set the error type
            next( error ); // Go to the next middleware with an error
            return; // Return to prevent further actions
        }
    } );

    io.on( 'connection', ( client ) => { // When a client connects with a socket
        console.log( 'Made socket connection. | ', client.id, ' | ', client.decoded.id ); // Print a notification to the console
        
        client.join( client.decoded.id ); // Join the room for that user
        client.emit( 'connected' ); // Send a connection confirmation

        client.on( 'get-chat', ( data, callback ) => { // When a client emits 'get-chat'
            
            let userID = client.decoded.type == 'user' ? client.decoded.id : data.receiverID;
            let recruiterID = client.decoded.type == 'recruiter' ? client.decoded.id : data.receiverID;

            console.log( userID + recruiterID );
            let allowChat = global.cache.get( userID + recruiterID ); // Get the current value of allowChat from the cache
            
            if ( allowChat == 1 ) { // If chat is allowed between the user and recruiter

                Chat.getChat( client.decoded.id, data.receiverID, data.offset, data.page ).then( ( result ) => { // Get the chat logs per page
                    
                    client.emit( 'get-chat', { // Emit the chat log to the client
                        page: data.page, // Set the page of the chat log
                        chat: result // Set the chat log
                    } );
                    // callback(); // Call the callback function ( to let the user know that the server received the message )

                } ).catch( ( error ) => {
                    console.log( error ); // Log the error
                } );

            } else if ( allowChat == 0 ) { // If chat is NOT allowed between the user and recruiter

                client.emit( 'chat', { name: 'Server', message: MessageList.error.chat.no_permission, error: 403 } ); // Send back an error message

            } else { // If allowChat hasn't been set yet

                User.checkChatUnlock( 'UnlockID', client.decoded.id, data.receiverID ).then( ( chatResult ) => {

                    if( chatResult.length == 0 ) { // If there was no chat unlock
                        global.cache.set( userID + recruiterID, 0 ); // Cache the result as 0
                        client.emit( 'chat', { name: 'Server', message: MessageList.error.chat.no_permission, error: 403 } ); // Send back an error message
                        return; // Return to prevent further actions
                    }
                    
                    global.cache.set( userID + recruiterID, 1 ); // Cache the result as 1

                    Chat.getChat( client.decoded.id, data.receiverID, data.offset, data.page ).then( ( result ) => { // Get the chat logs per page
                        
                        client.emit( 'get-chat', { // Emit the chat log to the client
                            page: data.page, // Set the page of the chat log
                            chat: result // Set the chat log
                        } );
                        // callback(); // Call the callback function ( to let the user know that the server received the message )
        
                    } ).catch( ( error ) => {
                        console.log( error ); // Log the error
                    } );

                } );
                
            }


        } );

        client.on( 'chat', ( data, callback ) => { // When a client emits 'chat'
        
            let userID = client.decoded.type == 'user' ? client.decoded.id : data.receiverID;
            let recruiterID = client.decoded.type == 'recruiter' ? client.decoded.id : data.receiverID;
            
            let allowChat = global.cache.get( userID + recruiterID ); // Get the current value of allowChat from the cache
            
            if ( allowChat == 1 ) { // If chat is allowed between the user and recruiter

                message = { // Create a variable for the message
                    message: data.message, // Set the message text
                    senderID: client.decoded.id, // Set the message sender ID
                    receiverID: data.receiverID // Set the message receiver ID
                };
                
                Chat.newMessage( message ).then( ( result ) => { // Add the new message to the database

                    io.to( client.decoded.id ).emit( 'chat', message );
                    
                    io.in( data.receiverID ).clients( ( error, clients ) => {

                        if ( clients.length ) { // If the receiver is connected
                            io.to( data.receiverID ).emit( 'chat', message ); // Emit the chat to the receiver
                        } else { // If the receiver is not connected, send a notification
                            
                            User.getRecruiterInfo( 'RecruiterFirstName, RecruiterLastName', 'RecruiteriD', recruiterID ).then( recruiter_result => {
                                const name = recruiter_result[0].RecruiterFirstName + ' ' + recruiter_result[0].RecruiterLastName;
                                sendNotification( data.receiverID, name, data.message, null );
                            } ).catch( error => {
                                console.log( error );
                                sendNotification( data.receiverID, 'Nova poruka', data.message, null );
                            } );
    
                        }

                    } );
                    
                    // callback(); // Call the callback function ( to let the user know that the server received the message )

                } ).catch( ( error ) => {
                    console.log( error ); // Log the error
                } );

            } else if ( allowChat == 0 ) { // If chat is NOT allowed between the user and recruiter

                client.emit( 'chat', { name: 'Server', message: MessageList.error.chat.no_permission } );

            } else { // If allowChat hasn't been set yet

                User.checkChatUnlock( 'UnlockID', client.decoded.id, data.receiverID ).then( ( chatResult ) => {
                
                    if( chatResult.length == 0 ) { // If there was no chat unlock
                        global.cache.set( userID + recruiterID, 0 ); // Cache the result as 0
                        client.emit( 'chat', { name: 'Server', message: MessageList.error.chat.no_permission } );
                        return; // Return to prevent further actions
                    }
                    
                    global.cache.set( userID + recruiterID, 1 ); // Cache the result as 1

                    message = { // Create a variable for the message
                        message: data.message, // Set the message text
                        senderID: client.decoded.id, // Set the message sender ID
                        receiverID: data.receiverID // Set the message receiver ID
                    };
                    Chat.newMessage( message ).then( ( result ) => { // Add the new message to the database
                        
                        io.to( client.decoded.id ).emit( 'chat', message );
                        
                        io.in( data.receiverID ).clients( ( error, clients ) => {

                            if ( clients.length ) { // If the receiver is connected
                                io.to( data.receiverID ).emit( 'chat', message ); // Emit the chat to the receiver
                            } else { // If the receiver is not connected, send a notification
                                
                                User.getRecruiterInfo( 'RecruiterFirstName, RecruiterLastName', 'RecruiteriD', recruiterID ).then( recruiter_result => {
                                    const name = recruiter_result[0].RecruiterFirstName + ' ' + recruiter_result[0].RecruiterLastName;
                                    sendNotification( data.receiverID, name, data.message, null );
                                } ).catch( error => {
                                    console.log( error );
                                    sendNotification( data.receiverID, 'Nova poruka', data.message, null );
                                } );
        
                            }
    
                        } );

                        // callback(); // Call the callback function ( to let the user know that the server received the message )
        
                    } ).catch( ( error ) => {
                        console.log( error ); // Log the error
                    } );
                } );
                
            }


        } );

        client.on( 'disconnect', ( ) => {
            console.log( 'Socket disconnected. | ', client.id, ' | ', client.decoded.id ); // Print a notification to the console
        } );

    } );

}
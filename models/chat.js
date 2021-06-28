var mysql = require( "mysql" );
var ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId();

var connection = require( './database.js' ).connect();

module.exports.newMessage = ( message ) => { // Create a new job
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO messages ( MessageText, MessageSenderID, MessageReceiverID, MessageTime ) VALUES (" + mysql.escape( message.message ) + ", " + mysql.escape( message.senderID ) + ", " + mysql.escape( message.receiverID ) + ", " + mysql.escape( new Date() ) + ");" // Set the query to add a message
        connection.query( query, function( error, result ) { // Query the database
            if ( error ) { // If there was an error when querying the database
                reject( error ); // Reject the promise with the error
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }
            
            resolve(  ); // Resolve the promise without any values
        } );

    } );
}


module.exports.getChat = ( senderID, receiverID, offset = 0, page = 0 ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT * FROM messages WHERE ( MessageSenderID = " + mysql.escape( senderID ) + " AND MessageReceiverID = " + mysql.escape( receiverID ) + " ) OR ( MessageSenderID = " + mysql.escape( receiverID ) +" AND MessageReceiverID = " + mysql.escape( senderID ) + " ) ORDER BY MessageID DESC, MessageTime desc LIMIT " + ( ( page * 10 ) + offset ) + ",15"; // Define the query
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value
        } );
    } );
}

module.exports.getHistoryBySender = ( senderID, page ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT * FROM messages WHERE MessageTime IN ( SELECT MAX( MessageTime ) FROM messages GROUP BY MessageReceiverID ) AND ( MessageSenderID = " + mysql.escape( senderID ) + " )  LIMIT " + ( page * 10 ) + ",10"; // Define the query
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value
        } );
    } );
}

module.exports.getHistoryByReceiver = ( receiverID, page ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT * FROM messages WHERE MessageTime IN ( SELECT MAX( MessageTime ) FROM messages GROUP BY MessageReceiverID ) AND ( MessageReceiverID = " + mysql.escape( receiverID ) + " )  LIMIT " + ( page * 10 ) + ",10"; // Define the query
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value
        } );
    } );
}
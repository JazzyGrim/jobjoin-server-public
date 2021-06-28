var mysql = require( "mysql" );
var ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId();

var connection = require( './database.js' ).connect();

module.exports.newReport = ( report ) => { // Create a new report
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO reports ( ReportID, ReportSenderID, ReportReceiverID, ReportReason, ReportTime ) VALUES (" + mysql.escape( ID ) + ", " + mysql.escape( report.senderID ) + ", " + mysql.escape( report.receiverID ) + ", " + mysql.escape( report.reason ) + ", " + mysql.escape( new Date( ) ) + ");" // Set the query to add a message
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


module.exports.getReport = ( senderID, receiverID ) => { // Get report info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT * FROM reports WHERE ReportSenderID = " + mysql.escape( senderID ) + " AND ReportReceiverID = " + mysql.escape( receiverID ); // Define the query
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

module.exports.newBugReport = ( info, id ) => { // Create a new bug report
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO bugreports ( BugID, BugSenderID, BugInfo, BugTime ) VALUES (" + mysql.escape( ID ) + ", " + mysql.escape( id ) + ", " + mysql.escape( info ) + ", " + mysql.escape( new Date( ) ) + ");" // Set the query to add a message
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

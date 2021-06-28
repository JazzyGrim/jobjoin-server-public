var mysql = require('mysql'); // Require MySQL
var config = require( '../config' ); // Require the config
var database; // Make a global DataBase var

module.exports.connect = function() {
    if ( !database ) { // If the database isn't initialized
        database = mysql.createConnection( { // Create a connection to the database
            host: config.mysql.host,
            user: config.mysql.user,
            port: config.mysql.port,
            password: config.mysql.password,
            database: config.mysql.database,
            charset : 'utf8mb4'
        } );

        database.connect( function( err ) { // Connect to the database
            if ( err ) {
                console.log( err ); // Log the error message
                return; // Return to prevent further actions
            };
            console.log( "| MySQL Connected |" );
        } );
    }
    return database;
}
/*
*
*   Slanje i postavljanje postavki notifikacija za mobilne uređaje
*   Automatsko brisanje tokena iz SQL baze podataka ukoliko je došlo do pogreške pri slanju notifikacije
*
*/

var { Expo } = require('expo-server-sdk'); // Require expo server SDK for push notifications

let expo = new Expo( ); // Create a new expo client

var User = require( './models/user.js' ); // Get the user model

const getPushToken = ( userID ) => {

    return new Promise( ( resolve, reject ) => { // Create a new promise

        var regKey = global.cache.get( 'key-' + userID ); // Get the push token from cache

        if ( regKey == null ) { // If the push token is null ( it's not in the cache )

            User.getUserInfo( 'UserPushToken', 'UserID', userID ).then( ( result ) => { // Get info about the user ( since the recruiter can only send messages to users )

                regKey = result[0].UserPushToken; // Set the push token based on the database

                if ( regKey == null ) { // If the push token is null
                return; // Return to prevent further actions
                }

                resolve( regKey ); // Resolve the promise with the push token

            } ).catch( ( error ) => { // If there was an error
                reject( error ); // Reject the promise with the error
            } );

      } else { // If the registraion key isn't null and was in the cache
          resolve( regKey ); // Resolve the promise with the push token
      }

    } ).then( ( result ) => {
        global.cache.set( ( 'key-' + userID ), result ); // Store the push token in the cache
        return result; // Continue onto the next .then()
    } );

}

module.exports.sendNotification = ( userID, title, body, data ) => {

    getPushToken( userID ).then( pushToken => {

        if ( !Expo.isExpoPushToken( pushToken ) ) {
            console.error( `Push token ${ pushToken } is not a valid Expo push token` );
            return;
        }

        let message = [ {
            to: pushToken,
            sound: 'default',
            title: title,
            body: body
        } ]
        
        if ( data ) message[0].data = data;

        expo.sendPushNotificationsAsync( message ).then( ticket => {

            if ( ticket.id ) {
                // Check the ticket after an hour
                setTimeout( ( ) => {
                    expo.getPushNotificationReceiptsAsync( ticket ).then( receipt => {

                        if ( receipt.status === 'error' ) {
    
                            // Remove the push token from the database,
                            // if we send more requests we might get blacklisted
                            User.setPushToken( userID, null ).then( ( ) => {
                                global.cache.del( 'key-' + userID ); // Remove the push token from cache
                            } ).catch( ( error ) => {
                                console.log( error ); // Log the error
                            } );
    
                            console.error( `There was an error sending a notification: ${ receipt.message }` );
                            if ( receipt.details && receipt.details.error ) console.error( `The error code is ${ receipt.details.error }` );
                        }
    
                    } ).catch( error => {
                        console.error( error );
                    } );
                }, 3600000 );
            }

        } ).catch( error => {
            console.error( error );
        } );

    } ).catch( error => {
        console.error( error );
    } );

}

module.exports.sendNotificationInBulk = ( tokens, title, body, data ) => {

    let messages = [ ];
    for ( let token of tokens ) {

        if ( !Expo.isExpoPushToken( token ) ) {
            console.error( `Push token ${ token } is not a valid Expo push token` );
            continue;
        }

        let message = {
            to: token,
            sound: 'default',
            title: title,
            body: body
        };
        
        if ( data ) message.data = data;

        messages.push( message );
    }

    let chunks = expo.chunkPushNotifications( messages );

    let tickets = [ ];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        expo.sendPushNotificationsAsync( chunk ).then( ticketChunk => {

            tickets.push( ...ticketChunk );

            // If we sent everything, handle all the receipts
            if ( i == chunks.length - 1 ) setTimeout( ( ) => {
                handleChunkReceipts( tickets, messages );
            }, 3600000 );
    
        } ).catch( error => {
            console.error( error );
        } );

    }

}

const handleChunkReceipts = ( tickets, messages ) => {
    let receiptIds = [];
    for ( let ticket of tickets ) {
        if ( ticket.id ) receiptIds.push( ticket.id );
    }

    let receiptIdChunks = expo.chunkPushNotificationReceiptIds( receiptIds );

    for (let i = 0; i < receiptIdChunks.length; i++) {
        const receiptIdCunk = receiptIdChunks[i];

        expo.getPushNotificationReceiptsAsync( receiptIdCunk ).then( receipts => {

            for ( let receipt in receipts ) {
                if ( receipt.status === 'error' ) {
                    console.error( `There was an error sending a notification: ${ receipt.message }` );
                    if ( receipt.details && receipt.details.error ) console.error( `The error code is ${ receipt.details.error }` );

                    for (let i = 0; i < tickets.length; i++) {
                        const ticket = tickets[i];
                        if ( ticket.id == receipt.id ) {

                            
                            User.getUserInfo( 'UserID', 'UserPushToken', messages[ i ].to ).then( userResult => {

                                 // Remove the push token from the database,
                                // if we send more requests we might get blacklisted
                                User.setPushToken( userResult[0].UserID, null ).then( ( ) => {
                                    global.cache.del( 'key-' + userResult[0].UserID ); // Remove the push token from cache
                                } ).catch( ( error ) => {
                                    console.log( error ); // Log the error
                                } );

                            } ).catch( error => {
                                console.log( error ); // Log the error
                            } );

                            break;
                        }
                    }
                }
            }

        } ).catch( error => {
            console.error( error );
        } );

    }
}
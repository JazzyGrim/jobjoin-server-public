var express = require('express'); // Get the express so that we can get the router

var router = express.Router(); // We don't have the app variable so we use the Router class to route from here

var User = require( '../models/user.js' ); // Get the user model

var ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId();

var Twocheckout = require('2checkout-node');

var tco = new Twocheckout({
    apiUser: "GrimReaper",                              // Admin API Username, required for Admin API bindings
    apiPass: "vsuuDR67",                              // Admin API Password, required for Admin API bindings
    sellerId: "901419159",                                    // Seller ID, required for all non Admin API bindings 
    privateKey: "86D0EFA4-D0C8-4D12-9F84-C6B8A5F1C8F2",     // Payment API private key, required for checkout.authorize binding
    // secretWord: "tango",                                    // Secret Word, required for response and notification checks
    // demo: true,                                             // Set to true if testing response with demo sales
    sandbox: true                                          // Uses 2Checkout sandbox URL for all bindings
});

var MessageList = require( '../message_config' ); // Get the message list

router.post( '/buy', ( req, res ) => {
    
    var recruiterID = req.decoded.id; // Create a variable for the recruiter's ID
    const { name, address, city, state, zip, country, email, phone, cardToken, product } = req.body;

    if ( req.decoded.type != 'recruiter' ) {
        res.status( 403 ); // Set the status code to 403 ( Forbidden )
        res.json( { message: MessageList.error.access.recruiter_only } ); // Send the errors back to the client
        return; // Return to prevent further actions
    }

    User.getRecruiterInfo( 'RecruiterEmail, RecruiterCreditCount, RecruiterCustomerID', 'RecruiterID', recruiterID ).then( ( result ) => {

        if ( result.length == 0 ) {
            res.status( 404 ); // Set the status code to 404 ( Not Found )
            res.json( { message: MessageList.error.recruiter.doesnt_exist } ); // Send the errors back to the client
            return; // Return to prevent further actions
        }

        let itemName, itemPrice, tokenCount;

        if ( product == 0 ) {
            itemName = "5 Tokena";
            itemPrice = "20.00";
            tokenCount = 5;
        } else if ( product == 1 ) {
            itemName = "20 Tokena";
            itemPrice = "60.00";
            tokenCount = 20;
        } else if ( product == 2 ) {
            itemName = "30 Tokena";
            itemPrice = "80.00";
            tokenCount = 30;
        } else {
            res.status( 403 ); // Set the status code to 403 ( Forbidden )
            res.json( { message: MessageList.error.product.unknown } ); // Send the errors back to the client
            return;
        }

        const orderID = uid.randomUUID( 11 );

        var params = {
            "sellerId": "901419159",
            "privateKey": "86D0EFA4-D0C8-4D12-9F84-C6B8A5F1C8F2",
            "merchantOrderId": orderID,
            "token": cardToken,
            "currency": "USD",
            "lineItems": [
                {
                    "type": "product",
                    "name": itemName,
                    "price": itemPrice
                }
            ],
            "billingAddr": {
                "name": name,
                "addrLine1": address,
                "city": city,
                "state": state,
                "zipCode": zip,
                "country": country,
                "email": email,
                "phoneNumber": phone
            }
        };

        tco.checkout.authorize( params, ( e, data ) => {

            if ( e ) {
                res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
                res.json( { message: e.message } ); // Send the message back to the client with the order ID
            } else {
                const { response } = data;

                const newCredits = result[0].RecruiterCreditCount + tokenCount;

                User.updateCreditCount( newCredits, recruiterID ).then( ( updateResult ) => {

                    res.status( 200 ); // Set the status code to 200 ( Okay )
                    res.json( { message: MessageList.success.purchase.successful, orderID: response.orderNumber } ); // Send the message back to the client with the order ID

                    User.createPurchase( orderID, recruiterID, response.orderNumber, response.transactionId, response.total, response.lineItems[0].name, response.currencyCode ).then( ( newPurchaseResult ) => {

                        console.log( 'Purchase successful!' );

                    } ).catch( ( error ) => {
                        console.log( error ); // Log the error
                    } );

                } ).catch( ( error ) => {
                    console.log( error ); // Log the error
                } );
            }

        } );

    } ).catch( e => {
        console.log( e );
        res.status( 500 ); // Set the status code to 500 ( Internal Server Error )
        res.json( { message: MessageList.error.unknown } ); // Send the message back to the client
    } );

} );

module.exports = router;
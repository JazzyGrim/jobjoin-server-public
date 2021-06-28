var mysql = require( "mysql" );
var bcrypt = require( 'bcryptjs' );
var ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId();

var connection = require( './database.js' ).connect();

module.exports.createUser = ( user ) => { // Create a user
    return new Promise( ( resolve, reject ) => { // Return a new promise
        bcrypt.genSalt( 10, ( error, salt ) => { // Generate salt
            if ( error ) { // If there was an error with generating salt
                reject( error ); // Reject the promise with the error
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }
            bcrypt.hash( user.password, salt, ( err, hash ) => { // Hash the password with the previously generated salt
                if ( err ) { // If there was an error with hashing the password
                    reject( err ); // Reject the promise with the error
                    console.log( err ); // Log the error to the console
                    return; // Return to prevent further actions
                }
                module.exports.getRecruiterInfo( "RecruiterEmail", "RecruiterEmail", user.email ).then( ( result ) => { // Check to see if that email was already registered
                    if ( result.length != 0 ) { // If a recruiter exists with that email
                        reject( "Email Exists" ); // Reject the promise with the error
                        return; // Return to prevent further actions
                    }

                    var ID = uid.randomUUID( 11 ); // Generate a unique ID

                    var query = "INSERT INTO users ( UserID, UserFirstName, UserLastName, UserEmail, UserPassword, UserVerificationCode, UserPushToken, UserAddress, UserCity, UserState, UserZip, UserCountry, UserLat, UserLong, UserImagePath, UserFacebookID ) VALUES (" + mysql.escape( ID ) + ", " + mysql.escape( user.firstName ) + ", " + mysql.escape( user.lastName ) + ", " + mysql.escape( user.email ) + ", " + mysql.escape( hash ) + ", " + mysql.escape( user.hash ) + ", " + mysql.escape( user.pushToken ) + ", " + mysql.escape( user.address ) + ", " + mysql.escape( user.city ) + ", " + mysql.escape( user.state ) + ", " + mysql.escape( user.zip ) + ", " + mysql.escape( user.country ) + ", " + mysql.escape( user.lat ) + ", " + mysql.escape( user.long ) + ", " + mysql.escape( user.imagePath ) + ", " + mysql.escape( user.facebookID ) + ");" // Set the query to add a new user
                    connection.query( query, function( queryErr, result ) { // Query the database
                        if ( queryErr ) { // If there was an error when querying the database
                            reject( queryErr ); // Reject the promise with the error
                            return; // Return to prevent further actions
                        }
                        
                        resolve( ID ); // Resolve the promise with the user ID

                    } );

                } );
            } );
        } );
    } );
}

module.exports.createUserWithoutPassword = ( user ) => { // Create a user without a password
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO users ( UserID, UserFirstName, UserLastName, UserBirthday, UserEmail, UserVerificationCode, UserPushToken, UserAddress, UserCity, UserState, UserZip, UserCountry, UserLat, UserLong, UserImagePath, UserFacebookID ) VALUES (" + mysql.escape( ID ) + ", " + mysql.escape( user.firstName ) + ", " + mysql.escape( user.lastName ) + ", " + mysql.escape( user.birthday ) + ", " + mysql.escape( user.email ) + ", " + mysql.escape( user.hash ) + ", " + mysql.escape( user.pushToken ) + ", " + mysql.escape( user.address ) + ", " + mysql.escape( user.city ) + ", " + mysql.escape( user.state ) + ", " + mysql.escape( user.zip ) + ", " + mysql.escape( user.country ) + ", " + mysql.escape( user.lat ) + ", " + mysql.escape( user.long ) + ", " + mysql.escape( user.imagePath ) + ", " + mysql.escape( user.facebookID ) + ");" // Set the query to add a new user
        connection.query( query, function( queryErr, result ) { // Query the database
            if ( queryErr ) { // If there was an error when querying the database
                reject( queryErr ); // Reject the promise with the error
                return; // Return to prevent further actions
            }

            resolve( ID ); // Resolve the promise with the user ID
            
        } );

    } );
}

module.exports.createRecruiter = ( recruiter ) => { // Create a recruiter
    return new Promise( ( resolve, reject ) => { // Return a new promise
        bcrypt.genSalt( 10, ( error, salt ) => { // Generate salt
            if ( error ) { // If there was an error with generating salt
                reject( error ); // Reject the promise with the error
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }
            bcrypt.hash( recruiter.password, salt, ( err, hash ) => { // Hash the password with the previously generated salt
                if ( err ) { // If there was an error with hashing the password
                    reject( err ); // Reject the promise with the error
                    console.log( err ); // Log the error to the console
                    return; // Return to prevent further actions
                }
                module.exports.getUserInfo( "UserEmail", "UserEmail", recruiter.email ).then( ( result ) => { // Check to see if that email was already registered
                    if ( result.length != 0 ) { // If a user exists with that email
                        reject( "Email Exists" ); // Reject the promise with the error
                        return; // Return to prevent further actions
                    }

                    var ID = uid.randomUUID( 11 ); // Generate a unique ID

                    var query = "INSERT INTO recruiters ( RecruiterID, RecruiterFirstName, RecruiterLastName, RecruiterCompanyName, RecruiterEmail, RecruiterPassword, RecruiterVerificationCode, RecruiterImagePath, RecruiterFacebookID ) VALUES (" + mysql.escape( ID ) + ", " + mysql.escape( recruiter.firstName ) + ", " + mysql.escape( recruiter.lastName ) + ", " + mysql.escape( recruiter.companyName )  + ", " + mysql.escape( recruiter.email ) + ", " + mysql.escape( hash ) + ", " + mysql.escape( recruiter.hash ) + ", " + mysql.escape( recruiter.imagePath ) + ", " + mysql.escape( recruiter.facebookID ) + ");" // Set the query to add a new recruiter
                    connection.query( query, function( queryErr, result ) { // Query the database
                        if ( queryErr ) { // If there was an error when querying the database
                            reject( queryErr ); // Reject the promise with the error
                            return; // Return to prevent further actions
                        }

                        resolve( ID ); // Resolve the promise with the recruiter ID
                        
                    } );

                } );
            } );
        } );
    } );
}

module.exports.createRecruiterWithoutPassword = ( recruiter ) => { // Create a recruiter without a password
    return new Promise( ( resolve, reject ) => { // Return a new promise
        // Possible check missing here for email duplicates?        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO recruiters ( RecruiterID, RecruiterFirstName, RecruiterLastName, RecruiterCompanyName, RecruiterEmail, RecruiterVerificationCode, RecruiterImagePath, RecruiterFacebookID ) VALUES (" + mysql.escape( ID ) + ", " + mysql.escape( recruiter.firstName ) + ", " + mysql.escape( recruiter.lastName ) + ", " + mysql.escape( recruiter.companyName )  + ", " + mysql.escape( recruiter.email ) + ", " + mysql.escape( recruiter.hash ) + ", " + mysql.escape( recruiter.imagePath ) + ", " + mysql.escape( recruiter.facebookID ) + ");" // Set the query to add a new recruiter
        connection.query( query, function( queryErr, result ) { // Query the database
            if ( queryErr ) { // If there was an error when querying the database
                reject( queryErr ); // Reject the promise with the error
                return; // Return to prevent further actions
            }
            
            resolve( ID ); // Resolve the promise with the recruiter ID

        } );

    } );
}

module.exports.updateUser = ( id, user ) => { // Update user info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserFirstName = " + mysql.escape( user.firstName ) // Define the query
          + ", UserLastName = " + mysql.escape( user.lastName )
          + ", UserBirthday = " + mysql.escape( user.birthday )
          + ", UserAbout = " + mysql.escape( user.about )
          + " WHERE UserID = " + mysql.escape( id );
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

module.exports.createLoginToken = ( id, token ) => { // Update user info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserLoginKey = " + mysql.escape( token ) // Define the query
          + " WHERE UserID = " + mysql.escape( id );
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ); // Resolve the promise

        } );
    } );
}

module.exports.updateUserFacebookID = ( id, facebookID ) => { // Update user info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserFacebookID = " + mysql.escape( facebookID ) // Define the query
          + " WHERE UserID = " + mysql.escape( id );
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ); // Resolve the promise

        } );
    } );
}

module.exports.setPushToken = ( id, token ) => { // Update user info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserPushToken = " + mysql.escape( token ) // Define the query
          + " WHERE UserID = " + mysql.escape( id );
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ); // Resolve the promise

        } );
    } );
}

module.exports.createRecruiterLoginToken = ( id, token ) => { // Update recruiter info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE recruiters SET RecruiterLoginKey = " + mysql.escape( token ) // Define the query
          + " WHERE RecruiterID = " + mysql.escape( id );
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ); // Resolve the promise

        } );
    } );
}

module.exports.updateRecruiterFacebookID = ( id, facebookID ) => { // Update recruiter info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE recruiters SET RecruiterFacebookID = " + mysql.escape( facebookID ) // Define the query
          + " WHERE RecruiterID = " + mysql.escape( id );
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ); // Resolve the promise

        } );
    } );
}

module.exports.updateRecruiter = ( id, recruiter ) => { // Update recruiter info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE recruiters SET RecruiterFirstName = " + mysql.escape( recruiter.firstName ) // Define the query
          + ", RecruiterLastName = " + mysql.escape( recruiter.lastName )
          + ", RecruiterCompanyName = " + mysql.escape( recruiter.companyName )
          + " WHERE RecruiterID = " + mysql.escape( id );
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

module.exports.updateAbout = ( userID, about ) => { // Update user info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserAbout = " + mysql.escape( about ) // Define the query
          + " WHERE UserID = " + mysql.escape( userID );
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ); // Resolve the promise

        } );
    } );
}

module.exports.updateJobTypeID = ( userID, jobTypeID ) => { // Update user info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserJobTypeID = " + mysql.escape( jobTypeID ) // Define the query
          + " WHERE UserID = " + mysql.escape( userID );
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ); // Resolve the promise

        } );
    } );
}

module.exports.updateAddress = ( userID, info ) => { // Update user info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserAddress = " + mysql.escape( info.address ) // Define the query
        + ", UserCity = " + mysql.escape( info.city )
        + ", UserState = " + mysql.escape( info.state )
        + ", UserZip = " + mysql.escape( info.zip )
        + ", UserCountry = " + mysql.escape( info.country )
        + ", UserLat = " + mysql.escape( info.lat )
        + ", UserLong = " + mysql.escape( info.long )
        + " WHERE UserID = " + mysql.escape( userID );
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ); // Resolve the promise

        } );
    } );
}

module.exports.getUserInfo = ( select, where, valueOfWhere ) => { // Get user info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM users WHERE " + where + " = " + mysql.escape( valueOfWhere ); // Define the query
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

module.exports.getRecruiterInfo = ( select, where, valueOfWhere ) => { // Get recruiter info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM recruiters WHERE " + where + " = " + mysql.escape( valueOfWhere ); // Define the query
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

module.exports.getUserExperienceInfo = ( select, where, valueOfWhere ) => { // Get user experience info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM userexperience WHERE " + where + " = " + mysql.escape( valueOfWhere ) + " ORDER BY ExperienceNumber ASC"; // Define the query
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

module.exports.getUserEducationInfo = ( select, where, valueOfWhere ) => { // Get user education info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM usereducation WHERE " + where + " = " + mysql.escape( valueOfWhere ) + " ORDER BY EducationNumber ASC"; // Define the query
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

module.exports.getUserLanguageInfo = ( select, where, valueOfWhere ) => { // Get user language info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM userlanguages WHERE " + where + " = " + mysql.escape( valueOfWhere ) + " ORDER BY LanguageNumber ASC"; // Define the query
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

module.exports.verifyUser = function( email ) { // Verify a user
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = `UPDATE users SET UserEmailVerified = 1` + ` WHERE UserEmail = ` + mysql.escape( email ); // Update the user data to make the user verified
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value

        } );
    } );
}

module.exports.verifyRecruiter = function( email ) { // Verify a recruiter
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = `UPDATE recruiters SET RecruiterEmailVerified = 1` + ` WHERE RecruiterEmail = ` + mysql.escape( email ); // Update the recruiter data to make the recruiter verified
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value

        } );
    } );
}

module.exports.findUser = ( email ) => { // Find a user by their email
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT UserID, UserPassword, UserBanned, UserEmailVerified, UserFacebookID FROM users WHERE UserEmail = " + mysql.escape( email ); // Set the query to search for matching emails
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( "User query error: " + err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            if ( result.length == 0 ) { // If no user was found with the provided email

                var query = "SELECT RecruiterID, RecruiterPassword, RecruiterBanned, RecruiterEmailVerified, RecruiterFacebookID FROM recruiters WHERE RecruiterEmail = " + mysql.escape( email ); // Set the query to search for matching emails
                connection.query( query, function( error, recruiterResult ) { // Query the database
                    if ( error ) { // If there was an error performing the query
                        reject( error ); // Reject the promise with the error
                        console.log( "Recruiter query error: " + error ); // Log the error to the console
                        return; // Return to prevent further actions
                    }

                    if ( recruiterResult.length == 0 ) { // If no recruiter was found with the provided email
                        resolve( null ); // Resolve the promise with null
                        return; // Return to prevent further actions
                    }

                    resolve( { // Resolve the promise with a value
                        id: recruiterResult[0].RecruiterID, // Set the ID of the found recruiter
                        password: recruiterResult[0].RecruiterPassword, // Set the password of the found recruiter
                        banned: recruiterResult[0].RecruiterBanned, // Set the banned status of the found recruiter
                        verified: recruiterResult[0].RecruiterEmailVerified, // Set the verification level of the found recruiter
                        facebookID: recruiterResult[0].RecruiterFacebookID, // Set the Facebook ID of the found recruiter
                        type: 'recruiter' // Set the type of the found recruiter
                    } );

                } );

                return; // Return to prevent further actions ( don't call the 'resolve' function below )
            }

            resolve( { // Resolve the promise with a value
                id: result[0].UserID, // Set the ID of the found user
                password: result[0].UserPassword, // Set the password of the found user
                banned: result[0].UserBanned, // Set the banned status of the found user
                verified: result[0].UserEmailVerified, // Set the verification level of the found user
                facebookID: result[0].UserFacebookID, // Set the Facebook ID of the found user
                type: 'user' // Set the type of the found user
            } );
        } );
    } );
}

module.exports.findUserFacebook = ( id ) => { // Find a user by their facebook ID
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT UserID, UserPassword, UserBanned, UserEmailVerified, UserFacebookID FROM users WHERE UserFacebookID = " + mysql.escape( id ); // Set the query to search for matching emails
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( "User query error: " + err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            if ( result.length == 0 ) { // If no user was found with the provided email

                var query = "SELECT RecruiterID, RecruiterPassword, RecruiterBanned, RecruiterEmailVerified, RecruiterFacebookID FROM recruiters WHERE RecruiterFacebookID = " + mysql.escape( id ); // Set the query to search for matching emails
                connection.query( query, function( error, recruiterResult ) { // Query the database
                    if ( error ) { // If there was an error performing the query
                        reject( error ); // Reject the promise with the error
                        console.log( "Recruiter query error: " + error ); // Log the error to the console
                        return; // Return to prevent further actions
                    }

                    if ( recruiterResult.length == 0 ) { // If no recruiter was found with the provided email
                        resolve( null ); // Resolve the promise with null
                        return; // Return to prevent further actions
                    }

                    resolve( { // Resolve the promise with a value
                        id: recruiterResult[0].RecruiterID, // Set the ID of the found recruiter
                        password: recruiterResult[0].RecruiterPassword, // Set the password of the found recruiter
                        banned: recruiterResult[0].RecruiterBanned, // Set the banned status of the found recruiter
                        verified: recruiterResult[0].RecruiterEmailVerified, // Set the verification level of the found recruiter
                        facebookID: recruiterResult[0].RecruiterFacebookID, // Set the Facebook ID of the found recruiter
                        type: 'recruiter' // Set the type of the found recruiter
                    } );

                } );

                return; // Return to prevent further actions ( don't call the 'resolve' function below )
            }

            resolve( { // Resolve the promise with a value
                id: result[0].UserID, // Set the ID of the found user
                password: result[0].UserPassword, // Set the password of the found user
                banned: result[0].UserBanned, // Set the banned status of the found user
                verified: result[0].UserEmailVerified, // Set the verification level of the found user
                facebookID: result[0].UserFacebookID, // Set the Facebook ID of the found user
                type: 'user' // Set the type of the found user
            } );
        } );
    } );
}

// Resetting the password ------------------------------

module.exports.findUserForReset = ( email ) => { // Find a user by their email
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT UserID, UserFirstName, UserPassword, UserRegistrationDate, UserFacebookID FROM users WHERE UserEmail = " + mysql.escape( email ); // Set the query to search for matching emails
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( "User query error: " + err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            if ( result.length == 0 ) { // If no user was found with the provided email

                var query = "SELECT RecruiterID, RecruiterFirstName, RecruiterPassword, RecruiterRegistrationDate, RecruiterFacebookID FROM recruiters WHERE RecruiterEmail = " + mysql.escape( email ); // Set the query to search for matching emails
                connection.query( query, function( error, recruiterResult ) { // Query the database
                    if ( error ) { // If there was an error performing the query
                        reject( error ); // Reject the promise with the error
                        console.log( "Recruiter query error: " + error ); // Log the error to the console
                        return; // Return to prevent further actions
                    }

                    if ( recruiterResult.length == 0 ) { // If no recruiter was found with the provided email
                        resolve( null ); // Resolve the promise with null
                        return; // Return to prevent further actions
                    }

                    resolve( { // Resolve the promise with a value
                        id: recruiterResult[0].RecruiterID, // Set the ID of the found recruiter
                        firstName: recruiterResult[0].RecruiterFirstName, // Set the first name of the found recruiter
                        password: recruiterResult[0].RecruiterPassword, // Set the password of the found recruiter
                        registrationDate: recruiterResult[0].RecruiterRegistrationDate, // Set the registration date of the found recruiter
                        facebookID: recruiterResult[0].RecruiterFacebookID, // Set the Facebook ID of the found recruiter
                        type: 'recruiter' // Set the type of the found recruiter
                    } );

                } );

                return; // Return to prevent further actions ( don't call the 'resolve' function below )
            }

            resolve( { // Resolve the promise with a value
                id: result[0].UserID, // Set the ID of the found user
                firstName: result[0].UserFirstName, // Set the first name of the found user
                password: result[0].UserPassword, // Set the password of the found user
                registrationDate: result[0].UserRegistrationDate, // Set the registration date of the found user
                facebookID: result[0].UserFacebookID, // Set the Facebook ID of the found user
                type: 'user' // Set the type of the found user
            } );
        } );
    } );
}

module.exports.resetUserPassword = ( id, password ) => { // Reset a user's password
    return new Promise( ( resolve, reject ) => { // Return a new promise
        bcrypt.genSalt( 10, ( error, salt ) => { // Generate salt
            if ( error ) { // If there was an error with generating salt
                reject( error ); // Reject the promise with the error
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }
            bcrypt.hash( password, salt, ( err, hash ) => { // Hash the password with the previously generated salt
                if ( err ) { // If there was an error with hashing the password
                    reject( err ); // Reject the promise with the error
                    console.log( err ); // Log the error to the console
                    return; // Return to prevent further actions
                }
                var query = "UPDATE users SET UserPassword = " + mysql.escape( hash ) // Define the query
                + " WHERE UserID = " + mysql.escape( id );
                connection.query( query, function( queryErr, result ) { // Query the database
                    if ( queryErr ) { // If there was an error when querying the database
                        reject( queryErr ); // Reject the promise with the error
                        console.log( queryErr ); // Log the error to the console
                        return; // Return to prevent further actions
                    }

                    es.updateIndex( 'users', userID, {
                        UserPassword: hash
                    } ).then( ( ) => {
        
                        resolve( result ); // Resolve the promise with a value
        
                    } ).catch( error => {
                        console.log( error );
                        reject( error );
                    } );
                    
                } );
            } );
        } );
    } );
}

module.exports.resetRecruiterPassword = ( id, password ) => { // Reset a recruiter's password
    return new Promise( ( resolve, reject ) => { // Return a new promise
        bcrypt.genSalt( 10, ( error, salt ) => { // Generate salt
            if ( error ) { // If there was an error with generating salt
                reject( error ); // Reject the promise with the error
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }
            bcrypt.hash( password, salt, ( err, hash ) => { // Hash the password with the previously generated salt
                if ( err ) { // If there was an error with hashing the password
                    reject( err ); // Reject the promise with the error
                    console.log( err ); // Log the error to the console
                    return; // Return to prevent further actions
                }
                var query = "UPDATE recruiters SET RecruiterPassword = " + mysql.escape( hash ) // Define the query
                + " WHERE RecruiterID = " + mysql.escape( id );
                connection.query( query, function( queryErr, result ) { // Query the database
                    if ( queryErr ) { // If there was an error when querying the database
                        reject( queryErr ); // Reject the promise with the error
                        console.log( queryErr ); // Log the error to the console
                        return; // Return to prevent further actions
                    }

                    resolve( result ); // Resolve the promise with a value
                    
                } );
            } );
        } );
    } );
}

// Deleting account
module.exports.findUserById = ( id, type ) => { // Find a user by their ID
    return new Promise( ( resolve, reject ) => { // Return a new promise
        if ( type == 'user' ) {
        
            var query = "SELECT UserFirstName, UserEmail, UserPassword, UserRegistrationDate FROM users WHERE UserID = " + mysql.escape( id ); // Set the query to search for matching ids
            connection.query( query, function( err, result ) { // Query the database
                if ( err ) { // If there was an error performing the query
                    reject( err ); // Reject the promise with the error
                    console.log( "User query error: " + err ); // Log the error to the console
                    return; // Return to prevent further actions
                }
                
                if ( result.length == 0 ) { // If the user doesn't exist
                    resolve( null ); // Resolve the promise with null
                    return; // Return to prevent further actions
                }
                
                resolve( { // Resolve the promise with a value
                    email: result[0].UserEmail, // Set the email of the found user
                    firstName: result[0].UserFirstName, // Set the first name of the found user
                    password: result[0].UserPassword, // Set the password of the found user
                    registrationDate: result[0].UserRegistrationDate // Set the registration date of the found user
                } );
                
            } );

        } else if ( type == 'recruiter' ) {
        
            var query = "SELECT RecruiterFirstName, RecruiterEmail, RecruiterPassword, RecruiterRegistrationDate FROM recruiters WHERE RecruiterID = " + mysql.escape( id ); // Set the query to search for matching ids
            connection.query( query, function( error, recruiterResult ) { // Query the database
                if ( error ) { // If there was an error performing the query
                    reject( error ); // Reject the promise with the error
                    console.log( "Recruiter query error: " + error ); // Log the error to the console
                    return; // Return to prevent further actions
                }
                
                if ( recruiterResult.length == 0 ) { // If the recruiter doesn't exist
                    resolve( null ); // Resolve the promise with null
                    return; // Return to prevent further actions
                }
                
                if ( recruiterResult.length == 0 ) { // If no recruiter was found with the provided email
                    resolve( null ); // Resolve the promise with null
                    return; // Return to prevent further actions
                }

                resolve( { // Resolve the promise with a value
                    email: recruiterResult[0].RecruiterEmail, // Set the email of the found recruiter
                    firstName: recruiterResult[0].RecruiterFirstName, // Set the first name of the found recruiter
                    password: recruiterResult[0].RecruiterPassword, // Set the password of the found recruiter
                    registrationDate: recruiterResult[0].RecruiterRegistrationDate // Set the registration date of the found recruiter
                } );

            } );
            
        }
        
    } );
}


// Updating User Experience ------------------------------
module.exports.updateUserExperience = function( id, experience ) { // Update the user experience list
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        module.exports.deleteUserExperience( id ).then( ( result ) => { // Delete all the experience a user has
            
            if ( experience.length == 0 ) { // If the experience array is empy
                resolve( null ); // Resolve the promise with a value
                return; // Return to prevent further actions
            }

            for ( let i = 0, x = experience.length; i < x; i++ ) { // For each experience listed
                
                module.exports.addUserExperience( id, experience[i].company, experience[i].amount, experience[i].title, experience[i].description, experience[i].typeID, i + 1 ).then( ( addResult ) => { // Add new user experience
                    
                    if ( i == ( x - 1 ) ) { // If it's the last itteration
                        resolve( null ); // Resolve the promise with a value
                    }
                    
                } ).catch( ( error ) => {
                    console.log( error ); // Log the error to the console
                    reject( error ); // Reject the promise with the error
                } );

            }

        } ).catch( ( error ) => {
            reject( error ); // Reject the promise with the error
        } );

    } );
}

module.exports.deleteUserExperience = function( id ) { // Delete all the experience a user has
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = `DELETE FROM userexperience WHERE ExperienceUserID = ` + mysql.escape( id ); // Delete all the experience a user has
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value

        } );
    } );
}

module.exports.addUserExperience = function( id, company, amount, title, description, typeID, number ) { // Add new user experience
    return new Promise( ( resolve, reject ) => { // Return a new promise

        var experienceID = uid.randomUUID( 11 ); // Generate a unique ID
        
        amount = parseInt( amount ); // Turn the amount into an integer

        var query = "INSERT INTO userexperience ( ExperienceID, ExperienceUserID, ExperienceCompany, ExperienceAmount, ExperienceTitle, ExperienceDescription, ExperienceTypeID, ExperienceNumber ) VALUES (" + mysql.escape( experienceID ) + ", " + mysql.escape( id ) + ", " + mysql.escape( company ) + ", " + mysql.escape( amount ) + ", " + mysql.escape( title ) + ", " + mysql.escape( description ) + ", " + mysql.escape( typeID ) + ", " + mysql.escape( number ) + ");" // Add new user experience
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value

        } );
    } );
}

// Updating User Education ------------------------------
module.exports.updateUserEducation = function( id, education ) { // Update the user education list
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        module.exports.deleteUserEducation( id ).then( ( result ) => { // Delete all the education a user has
            
            if ( education.length == 0 ) { // If the education array is empy
                resolve( null ); // Resolve the promise with a value
                return; // Return to prevent further actions
            }

            for ( let i = 0, x = education.length; i < x; i++ ) { // For each education listed
                
                module.exports.addUserEducation( id, education[i].country, education[i].school, education[i].title, education[i].major, education[i].graduationYear, i + 1 ).then( ( addResult ) => { // Add new user education
                    
                    if ( i == ( x - 1 ) ) { // If it's the last itteration
                        resolve( null ); // Resolve the promise with a value
                    }
                    
                } ).catch( ( error ) => {
                    console.log( error ); // Log the error to the console
                    reject( error ); // Reject the promise with the error
                } );

            }

        } ).catch( ( error ) => {
            reject( error ); // Reject the promise with the error
        } );

    } );
}

module.exports.deleteUserEducation = function( id ) { // Delete all the education a user has
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = `DELETE FROM usereducation WHERE EducationUserID = ` + mysql.escape( id ); // Delete all the education a user has
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value

        } );
    } );
}

module.exports.addUserEducation = function( id, country, school, title, major, graduationYear, number ) { // Add new user education
    return new Promise( ( resolve, reject ) => { // Return a new promise

        var educationID = uid.randomUUID( 11 ); // Generate a unique ID

        title = parseInt( title );
        graduationYear = parseInt( graduationYear );

        var query = "INSERT INTO usereducation ( EducationID, EducationUserID, EducationCountry, EducationSchool, EducationTitle, EducationMajor, EducationGraduationYear, EducationNumber ) VALUES (" + mysql.escape( educationID ) + ", " + mysql.escape( id ) + ", " + mysql.escape( country ) + ", " + mysql.escape( school ) + ", " + mysql.escape( title ) + ", " + mysql.escape( major ) + ", " + mysql.escape( graduationYear ) + ", " + mysql.escape( number ) + ");" // Add new user education
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value

        } );
    } );
}

// Updating User Languages ------------------------------
module.exports.updateUserLanguages = function( id, languages ) { // Update the user language list
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        module.exports.deleteUserLanguages( id ).then( ( result ) => { // Delete all the language a user has
            
            if ( languages.length == 0 ) { // If the languages array is empy
                resolve( null ); // Resolve the promise with a value
                return; // Return to prevent further actions
            }

            for ( let i = 0, x = languages.length; i < x; i++ ) { // For each language listed
                
                module.exports.addUserLanguages( id, languages[i].name, languages[i].level, i + 1 ).then( ( addResult ) => { // Add new user languages
                    
                    if ( i == ( x - 1 ) ) { // If it's the last itteration
                        resolve( null ); // Resolve the promise with a value
                    }
                    
                } ).catch( ( error ) => {
                    console.log( error ); // Log the error to the console
                    reject( error ); // Reject the promise with the error
                } );

            }

        } ).catch( ( error ) => {
            reject( error ); // Reject the promise with the error
        } );

    } );
}

module.exports.deleteUserLanguages = function( id ) { // Delete all the languages a user has
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = `DELETE FROM userlanguages WHERE LanguageUserID = ` + mysql.escape( id ); // Delete all the languages a user has
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value

        } );
    } );
}

module.exports.addUserLanguages = function( id, name, level, number ) { // Add new user language
    return new Promise( ( resolve, reject ) => { // Return a new promise

        var languageID = uid.randomUUID( 11 ); // Generate a unique ID
        level = parseInt( level );

        var query = "INSERT INTO userlanguages ( LanguageID, LanguageUserID, LanguageName, LanguageLevel, LanguageNumber ) VALUES (" + mysql.escape( languageID ) + ", " + mysql.escape( id ) + ", " + mysql.escape( name ) + ", " + mysql.escape( level ) + ", " + mysql.escape( number ) + ");" // Add new user language
        connection.query( query, function( err, result ) { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( result ); // Resolve the promise with a value

        } );
    } );
}

// Image handling -----

module.exports.updateUserPicture = function( path, id ) { // Update the user picture
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserImagePath  = " + mysql.escape( path ) // Define the query
          + " WHERE UserID = " + mysql.escape( id );
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

module.exports.updateRecruiterPicture = function( path, id ) { // Update the recruiter picture
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE recruiters SET RecruiterImagePath  = " + mysql.escape( path ) // Define the query
          + " WHERE RecruiterID = " + mysql.escape( id );
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

// Chat Unlocks

module.exports.newChatUnlock = ( userID, recruiterID ) => { // Create a new chat unlock
    return new Promise( ( resolve, reject ) => { // Return a new promise

        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO chatunlocks ( UnlockID, UnlockUserID, UnlockRecruiterID, UnlockIssued ) VALUES (" + mysql.escape( ID ) + ", " + mysql.escape( userID ) + ", " + mysql.escape( recruiterID ) + ", " + mysql.escape( new Date() ) + ");" // Set the query to add a chat unlock
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

module.exports.getChatUnlockInfo = ( select, userID, recruiterID ) => { // Get chat unlock info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM chatunlocks WHERE UnlockUserID = " + mysql.escape( userID ) + " AND UnlockRecruiterID = " + mysql.escape( recruiterID ); // Define the query
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

module.exports.getChatUnlockByUser = ( select, unlockID, userID ) => { // Get chat unlock info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM chatunlocks WHERE UnlockID = " + mysql.escape( unlockID ) + " AND UnlockUserID = " + mysql.escape( userID ); // Define the query
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

module.exports.checkChatUnlock = ( select, userID, recruiterID ) => { // Check if a chat unlock has been accepted
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM chatunlocks WHERE ( UnlockUserID = " + mysql.escape( userID ) + " AND UnlockRecruiterID = " + mysql.escape( recruiterID ) + " ) OR ( UnlockUserID = " + mysql.escape( recruiterID ) + " AND UnlockRecruiterID = " + mysql.escape( userID ) + " )"; // Define the query
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

module.exports.createPurchase = ( id, recruiterID, orderID, transactionID, total, name, currency ) => { // Create a new purchase
    return new Promise( ( resolve, reject ) => { // Return a new promise

        var query = "INSERT INTO purchasehistory ( PurchaseID, PurchaseRecruiterID, PurchaseOrderID, PurchaseTransactionID, PurchaseTotal, PurchaseProduct, PurchaseCurrency ) VALUES (" + mysql.escape( id ) + ", " + mysql.escape( recruiterID ) + ", " + mysql.escape( orderID ) + ", " + mysql.escape( transactionID ) + ", " + mysql.escape( total ) + ", " + mysql.escape( name ) + ", " + mysql.escape( currency ) + ");" // Set the query to add a new purchase
        connection.query( query, function( queryErr, result ) { // Query the database
            if ( queryErr ) { // If there was an error when querying the database
                reject( queryErr ); // Reject the promise with the error
                console.log( queryErr ); // Log the error to the console
                return; // Return to prevent further actions
            }
            
            resolve( ); // Resolve the promise
        } );

    } );
}

module.exports.setRecruiterCustomerID = ( customer_id, id ) => { // Update the recruiter credit count
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE recruiters SET RecruiterCustomerID = " + mysql.escape( customer_id ) // Define the query
          + " WHERE RecruiterID = " + mysql.escape( id );
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

module.exports.updateCreditCount = ( count, id ) => { // Update the recruiter credit count
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE recruiters SET RecruiterCreditCount = " + mysql.escape( count ) // Define the query
          + " WHERE RecruiterID = " + mysql.escape( id );
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

module.exports.setVerificationCode = ( code, id ) => { // Update the user verification code
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserVerificationCode = " + mysql.escape( code ) // Define the query
          + " WHERE UserID = " + mysql.escape( id );
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

module.exports.setRecruiterVerificationCode = ( code, id ) => { // Update the recruiter verification code
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE recruiters SET RecruiterVerificationCode = " + mysql.escape( code ) // Define the query
          + " WHERE RecruiterID = " + mysql.escape( id );
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

module.exports.banUser = ( id ) => { // Ban a user
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserBanned = 1 WHERE UserID = " + mysql.escape( id ); // Define the query
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

module.exports.banRecruiter = ( id ) => { // Ban a recruiter
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE recruiters SET RecruiterBanned = 1 WHERE RecruiterID = " + mysql.escape( id ); // Define the query
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

module.exports.comparePassword = ( password, hash ) => { // Compare the given password to the user's ( or recruiter's ) password
    return new Promise( ( resolve, reject ) => { // Return a new promise
        bcrypt.compare( password, hash, ( err, match ) => { // Use bcrypt to compare the two passwords and call the new function
            if ( err ) { // If there was an error performing the query
                console.log( err ); // Output the error
                reject( err ); // Reject the promise with the error
                return; // Return to prevent further actions
            }

            resolve( match ); // Resolve the promise with the 'match; variable ( true if the passwords match )
        } );
    } );
}

module.exports.deleteUser = ( id ) => { // Delete a user
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE users SET UserFirstName = " + mysql.escape( null ) // Define the query
          + ", UserLastName = " + mysql.escape( null )
          + ", UserEmail = " + mysql.escape( null )
          + ", UserPassword = " + mysql.escape( null )
          + ", UserEmailVerified = " + mysql.escape( null )
          + ", UserRegistrationDate = " + mysql.escape( null )
          + ", UserVerificationCode = " + mysql.escape( null )
          + ", UserRegistrationKey = " + mysql.escape( null )
          + ", UserLoginKey = " + mysql.escape( null )
          + ", UserImagePath = " + mysql.escape( null )
          + ", UserFacebookID = " + mysql.escape( null )
          + ", UserAbout = " + mysql.escape( null )
          + ", UserJobTypeID = " + mysql.escape( null )
          + ", UserAddress = " + mysql.escape( null )
          + ", UserCity = " + mysql.escape( null )
          + ", UserState = " + mysql.escape( null )
          + ", UserZip = " + mysql.escape( null )
          + ", UserCountry = " + mysql.escape( null )
          + ", UserLat = " + mysql.escape( null )
          + ", UserLong = " + mysql.escape( null )
          + " WHERE UserID = " + mysql.escape( id );
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

module.exports.deleteUserInfo = ( id ) => { // Delete all user info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "DELETE FROM userexperience WHERE ExperienceUserID = " + mysql.escape( id ); // Define the query
        connection.query( query, ( err, result ) => { // Query the database
            if ( err ) { // If there was an error performing the query
                reject( err ); // Reject the promise with the error
                console.log( err ); // Log the error to the console
                return; // Return to prevent further actions
            }
            
            var query = "DELETE FROM userlanguages WHERE LanguageUserID = " + mysql.escape( id ); // Define the query
            connection.query( query, ( err, result ) => { // Query the database
                if ( err ) { // If there was an error performing the query
                    reject( err ); // Reject the promise with the error
                    console.log( err ); // Log the error to the console
                    return; // Return to prevent further actions
                }
            
                var query = "DELETE FROM usereducation WHERE EducationUserID = " + mysql.escape( id ); // Define the query
                connection.query( query, ( err, result ) => { // Query the database
                    if ( err ) { // If there was an error performing the query
                        reject( err ); // Reject the promise with the error
                        console.log( err ); // Log the error to the console
                        return; // Return to prevent further actions
                    }
            
                    var query = "DELETE FROM savedjobs WHERE SavedUserID = " + mysql.escape( id ); // Define the query
                    connection.query( query, ( err, result ) => { // Query the database
                        if ( err ) { // If there was an error performing the query
                            reject( err ); // Reject the promise with the error
                            console.log( err ); // Log the error to the console
                            return; // Return to prevent further actions
                        }

                        resolve( ); // Resolve the promise
            
                    } );
            
                } );
            
            } );
            
        } );
    } );
}

module.exports.deleteRecruiter = ( id ) => { // Delete a recruiter
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE recruiters SET RecruiterFirstName = " + mysql.escape( null ) // Define the query
          + ", RecruiterLastName = " + mysql.escape( null )
          + ", RecruiterEmail = " + mysql.escape( null )
          + ", RecruiterPassword = " + mysql.escape( null )
          + ", RecruiterCompanyName = " + mysql.escape( null )
          + ", RecruiterEmailVerified = " + mysql.escape( null )
          + ", RecruiterRegistrationDate = " + mysql.escape( null )
          + ", RecruiterVerificationCode = " + mysql.escape( null )
          + ", RecruiterRegistrationKey = " + mysql.escape( null )
          + ", RecruiterLoginKey = " + mysql.escape( null )
          + ", RecruiterCreditCount = " + mysql.escape( null )
          + ", RecruiterImagePath = " + mysql.escape( null )
          + ", RecruiterFacebookID = " + mysql.escape( null )
          + " WHERE RecruiterID = " + mysql.escape( id );
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

module.exports.getRandomUsers = ( city, jobTypeID, seed, page, perPage ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise

        var query = `SELECT
        users.UserID, users.UserFirstName, users.UserLastName, users.UserBirthday, users.UserCity, users.UserState, users.UserImagePath, users.UserJobTypeID, jobtypes.JobTypeName
        FROM users LEFT JOIN jobtypes ON jobtypes.JobTypeID = users.UserJobTypeID
        WHERE users.UserCity = ${ mysql.escape( city ) } ${ jobTypeID ? 'AND UserJobTypeID = ' + mysql.escape( jobTypeID ) : "" } ORDER BY RAND(${ mysql.escape( seed ) }) LIMIT ${ parseInt( page ) *  parseInt( perPage ) },${ parseInt( perPage ) };`

        console.log( query )

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
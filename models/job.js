var mysql = require( "mysql" );
var ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId();

var connection = require( './database.js' ).connect();

module.exports.newJob = ( job ) => { // Create a new job
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO jobs ( JobID, JobTitle, JobDescription, JobDefaultResponse, JobTypeID, JobRecruiterID, JobSalary, JobSalaryType, JobExperience, JobEmploymentContract, JobEmploymentTime, JobStudentsAccepted, JobCreated, JobStartingDate, JobAddress, JobCity, JobState, JobZip, JobCountry, JobLat, JobLong ) VALUES (" + mysql.escape( ID ) + ", " + mysql.escape( job.title ) + ", " + mysql.escape( job.description ) + ", " + mysql.escape( job.defaultResponse ) + ", " + mysql.escape( job.typeID ) + ", " + mysql.escape( job.recruiterID ) + ", " + mysql.escape( job.salary ) + ", " + mysql.escape( job.salaryType ) + ", " + mysql.escape( job.experience ) + ", " + mysql.escape( job.employmentContract ) + ", " + mysql.escape( job.employmentTime ) + ", " + mysql.escape( job.studentsAccepted ) + ", " + mysql.escape( new Date() ) + ", " + mysql.escape( job.startingDate ) + ", " + mysql.escape( job.address ) + ", " + mysql.escape( job.city ) + ", " + mysql.escape( job.state ) + ", " + mysql.escape( job.zip ) + ", " + mysql.escape( job.country ) + ", " + mysql.escape( job.lat ) + ", " + mysql.escape( job.long ) + ");" // Set the query to add a job
        connection.query( query, function( error, result ) { // Query the database
            if ( error ) { // If there was an error when querying the database
                reject( error ); // Reject the promise with the error
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ID ); // Resolve the promise with the job ID

        } );

    } );
}

module.exports.newJobApplication = ( userID, recruiterID, jobID, response, score ) => { // Create a new job application
    return new Promise( ( resolve, reject ) => { // Return a new promise

        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO applications ( ApplicationID, ApplicationUserID, ApplicationRecruiterID, ApplicationJobID, ApplicationResponse, ApplicationQuizScore, ApplicationIssued ) VALUES (" + mysql.escape( ID ) + ", " + mysql.escape( userID ) + ", " + mysql.escape( recruiterID ) + ", " + mysql.escape( jobID ) + ", " + mysql.escape( response ) + ", " + mysql.escape( score ) + ", " + mysql.escape( new Date() ) + ");" // Set the query to add a job application
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

module.exports.getJobInfo = ( select, where, valueOfWhere ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM jobs WHERE " + where + " = " + mysql.escape( valueOfWhere ); // Define the query
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

module.exports.getJobsByFilter = ( recruiterID, page, inactive ) => { // Get all the applications by a user
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT * FROM jobs WHERE JobRecruiterID = " + mysql.escape( recruiterID ); // Define the query
        query += !inactive ? " AND JobCancelled = 0 AND JobHired = 0" : " AND ( JobCancelled != 0 OR JobHired != 0 )";
        query += " ORDER BY JobCreated DESC LIMIT " + ( page * 10 ) + ",10";
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

module.exports.getRecruiterJobs = ( recruiterID, page ) => { // Get all the applications by a user
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT * FROM jobs WHERE JobRecruiterID = " + mysql.escape( recruiterID ) + " AND JobCancelled = 0 AND JobHired = 0 ORDER BY JobCreated DESC LIMIT " + ( page * 10 ) + ",10"; // Define the query
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

module.exports.getJobTypeInfo = ( select, where, valueOfWhere ) => { // Get job type info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM jobtypes WHERE " + where + " = " + mysql.escape( valueOfWhere ); // Define the query
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

module.exports.getAllUsersWithJobType = ( jobTypeID ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT UserPushToken FROM users WHERE UserJobTypeID = " + mysql.escape( jobTypeID ); // Define the query
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

module.exports.getApplication = ( select, where, valueOfWhere ) => { // Get job type info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM applications WHERE " + where + " = " + mysql.escape( valueOfWhere ); // Define the query
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

module.exports.getApplicationInfo = ( select, jobID, userID ) => { // Get application info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM applications WHERE ApplicationJobID = " + mysql.escape( jobID ) + " AND ApplicationUserID = " + mysql.escape( userID ); // Define the query
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

module.exports.getApplicationByRecruiter = ( select, applicationID, recruiterID ) => { // Get application info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM applications WHERE ApplicationID = " + mysql.escape( applicationID ) + " AND ApplicationRecruiterID = " + mysql.escape( recruiterID ); // Define the query
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

module.exports.getApplicationCount = ( jobID ) => { // Get application info - only applications that are not denied
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var lastWeekTime = new Date(); // Create a new date object
        lastWeekTime.setDate( lastWeekTime.getDate() - 7 ); // Remove 7 days from the date
        var query = "SELECT COUNT(*) as ApplicationCount FROM applications WHERE ApplicationJobID = " + mysql.escape( jobID ) + " AND ApplicationStatus != 2 AND ApplicationIssued > " + mysql.escape( lastWeekTime ); // Define the query
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

module.exports.getTodaysApplications = ( recruiterID ) => { // Get application info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var lastWeekTime = new Date(); // Create a new date object
        lastWeekTime.setDate( lastWeekTime.getDate() - 7 ); // Remove 7 days from the date
        var query = "SELECT COUNT(*) as ApplicationCount FROM applications WHERE ApplicationRecruiterID = " + mysql.escape( recruiterID ) + " AND ApplicationStatus = 1 AND ApplicationIssued > " + mysql.escape( lastWeekTime ); // Define the query
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

module.exports.getJobApplicationCount = ( jobID ) => { // Get application info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var lastWeekTime = new Date(); // Create a new date object
        lastWeekTime.setDate( lastWeekTime.getDate() - 7 ); // Remove 7 days from the date
        var query = "SELECT ApplicationID, SUM( ApplicationStatus = '0' ) AS Pending, SUM( ApplicationStatus = '1' ) AS Shortlisted, SUM( ApplicationStatus = '2' ) AS Denied FROM applications WHERE ApplicationJobID = " + mysql.escape( jobID ) + " AND ApplicationIssued > " + mysql.escape( lastWeekTime ); // Define the query
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

module.exports.getExpiredApplicationCount = ( jobID ) => { // Get application info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var lastWeekTime = new Date(); // Create a new date object
        lastWeekTime.setDate( lastWeekTime.getDate() - 7 ); // Remove 7 days from the date
        var query = "SELECT COUNT(*) as Expired FROM applications WHERE ApplicationJobID = " + mysql.escape( jobID ) + " AND ApplicationStatus = 0 AND ApplicationIssued < " + mysql.escape( lastWeekTime ); // Define the query
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

module.exports.checkApplication = ( select, jobID, userID ) => { // Check if an application has been accepted
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM applications WHERE ( ApplicationUserID = " + mysql.escape( userID ) + " OR ApplicationRecruiterID = " + mysql.escape( userID ) + " ) AND ApplicationJobID = " + mysql.escape( jobID ); // Define the query
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

module.exports.getAllApplications = ( select, page, id ) => { // Get all the applications by a user
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM applications WHERE ApplicationUserID = " + mysql.escape( id ) + " OR ApplicationRecruiterID = " + mysql.escape( id ) + " ORDER BY ApplicationIssued DESC LIMIT " + ( page * 10 ) + ",10"; // Define the query
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

module.exports.setApplicationStatus = ( id, status ) => { // Update job info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE applications SET ApplicationStatus = " + mysql.escape( status ) // Define the query
          + " WHERE ApplicationID = " + mysql.escape( id );
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

module.exports.saveJob = ( userID, jobID ) => { // Save a new job
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO savedjobs ( SavedID, SavedUserID, SavedJobID, SavedTime ) VALUES (" + mysql.escape( ID ) + ", " + mysql.escape( userID ) + ", " + mysql.escape( jobID ) + ", " + mysql.escape( new Date() ) + ");" // Set the query to save a new job
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

module.exports.getSavedJobInfo = ( select, jobID, userID ) => { // Get saved job info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM savedjobs WHERE SavedJobID = " + mysql.escape( jobID ) + " AND SavedUserID = " + mysql.escape( userID ); // Define the query
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

module.exports.getAllSavedJobs = ( userID, page ) => { // Get all the applications by a user
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT SavedID, SavedJobID, SavedTime FROM savedjobs WHERE SavedUserID = " + mysql.escape( userID ) + " ORDER BY SavedTime DESC LIMIT " + ( page * 10 ) + ",10"; // Define the query
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

module.exports.deleteSavedJob = function( jobID, userID ) { // Delete a saved job
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = `DELETE FROM savedjobs WHERE SavedJobID = ` + mysql.escape( jobID ) + " AND SavedUserID = " + mysql.escape( userID ); // Delete a svaed job
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

module.exports.setJobHired = ( id ) => { // Set the job status to hired
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE jobs SET JobHired = 1 WHERE JobID = " + mysql.escape( id ); // Define the query
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

module.exports.cancelJob = ( id ) => { // Update job info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE jobs SET JobCancelled = 1" // Define the query
          + " WHERE JobID = " + mysql.escape( id );
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

module.exports.updateJobQuiz = function( id, quizID, quizRequired ) { // Update the job quiz
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE jobs SET JobQuizID  = " + mysql.escape( quizID )
          + ', JobQuizRequired = ' + mysql.escape( quizRequired )
          + " WHERE JobID = " + mysql.escape( id );
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

module.exports.updateDefaultResponse = ( defaultResponse, id ) => { // Update the job default app response
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE jobs SET JobDefaultResponse = " + mysql.escape( defaultResponse ) + " WHERE JobID = " + mysql.escape( id ); // Define the query
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

module.exports.setApplicationQuizScore = ( appID, score ) => { // Update the application quiz score for the user
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE applications SET ApplicationQuizScore = " + mysql.escape( score ) + " WHERE ApplicationID = " + mysql.escape( appID );
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

// Image handling -----

module.exports.updateJobPicture = function( path, id ) { // Update the job picture
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "UPDATE jobs SET JobImagePath  = " + mysql.escape( path ) // Define the query
          + " WHERE JobID = " + mysql.escape( id );
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

module.exports.search = ( lat, long, gte, lte, page, perPage, type, experience, contract, temporary, studentsAccepted, city ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise

        lat = mysql.escape( lat );
        long = mysql.escape( long );
        gte = mysql.escape( gte );
        lte = mysql.escape( lte );
        page = mysql.escape( page );
        perPage = mysql.escape( perPage );
        type = mysql.escape( type );

        var query = `SELECT jobs.*, ${ !city ? `(
            6371 * acos (
              cos ( radians(${ lat }) )
              * cos( radians( jobs.JobLat ) )
              * cos( radians( jobs.JobLong ) - radians(${ long }) )
              + sin ( radians(${ lat }) )
              * sin( radians( jobs.JobLat ) )
            )
          ) AS distance,` : '' } recruiters.RecruiterCompanyName AS JobCompanyName FROM jobs INNER JOIN recruiters on jobs.JobRecruiterID = recruiters.RecruiterID WHERE ( ( JobSalaryType = 0 AND JobSalary * 173 >= ${ gte } AND JobSalary * 173 <= ${ lte } ) OR ( JobSalaryType = 1 AND JobSalary >= ${ gte } AND JobSalary <= ${ lte } ) ) AND JobTypeID = ${ type }`;

          if ( experience != null ) query += ` AND jobs.JobExperience = ${ experience ? 1 : 0 }`;
          if ( contract != null ) query += ` AND jobs.JobEmploymentContract = ${ contract ? 1 : 0 }`;
          if ( temporary != null ) query += ` AND jobs.JobEmploymentTime = ${ temporary ? 1 : 0 }`;
          if ( studentsAccepted != null ) query += ` AND jobs.JobStudentsAccepted = ${ studentsAccepted ? 1 : 0 }`;
          
          if ( city ) query += ` AND JobCity = ${ mysql.escape( city ) }`;
          if ( !city ) query += ' ORDER BY distance ASC';

        query += ` LIMIT ${ page * perPage },${ perPage }`;
        
        console.log( query );

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

module.exports.getRecruiterApplications = ( recruiterID, jobID, page, status ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise

        recruiterID = mysql.escape( recruiterID );
        jobID = mysql.escape( jobID );

        var query = `SELECT
                    applications.*, UserFirstName, UserLastName, UserBirthday, UserAbout, UserCity, UserState, UserJobTypeID, UserImagePath
                    FROM applications INNER JOIN users ON applications.ApplicationUserID = users.UserID
                    WHERE ApplicationRecruiterID = ${ recruiterID }
                    AND ApplicationJobID = ${ jobID }`;
        console.log( status );
        if( status != null && status != "" ) {
            query += ` AND ApplicationStatus = ${ mysql.escape( status ) }`;
            if ( status == 0 ) {
                const lastWeekTime = new Date( ); // Create a new date object
                lastWeekTime.setDate( lastWeekTime.getDate() - 7 ); // Remove one day from the date  
                query += ` AND ApplicationIssued >= "${ lastWeekTime.toISOString().slice(0, 19).replace('T', ' ') }"`;
            }
        } else {
                const lastWeekTime = new Date( ); // Create a new date object
                lastWeekTime.setDate( lastWeekTime.getDate() - 7 ); // Remove one day from the date  
                query += ` AND ApplicationIssued <= "${ lastWeekTime.toISOString().slice(0, 19).replace('T', ' ') }"`;
        }

          
        query += ' ORDER BY ApplicationIssued ASC';
        
        query += ` LIMIT ${ parseInt( page ) * 10 },10`;

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

module.exports.getUserApplications = ( userID, page, status, expired ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise

        userID = mysql.escape( userID );

        var query = `SELECT
                    applications.*, jobs.JobTitle, jobs.JobDescription, jobs.JobCreated, jobs.JobSalary, jobs.JobSalaryType,
                    jobs.JobEmploymentContract, jobs.JobExperience, jobs.JobTypeID, jobs.JobHired, jobs.JobCity, jobs.JobState, jobtypes.JobTypeName, recruiters.RecruiterCompanyName
                    FROM ( ( applications INNER JOIN jobs ON applications.ApplicationJobID = jobs.JobID )
                    INNER JOIN jobtypes ON jobs.JobTypeID = jobtypes.JobTypeID )
                    INNER JOIN recruiters ON applications.ApplicationRecruiterID = recruiters.RecruiterID
                    WHERE applications.ApplicationUserID = ${ userID }`;
        
        let lastWeekTime = new Date( ); // Create a new date object
        lastWeekTime.setDate( lastWeekTime.getDate() - 7 ); // Remove one day from the date
        lastWeekTime = lastWeekTime.toISOString().slice(0, 19).replace('T', ' ');
        
        if( status != null && status != "" ) {
            query += ` AND applications.ApplicationStatus = ${ mysql.escape( status ) }`;
            if ( status == 0 ) {
                query += ` AND applications.ApplicationIssued >= "${ lastWeekTime }"`;
            }
        } else {
            if ( expired ) {
                query += ` AND applications.ApplicationIssued <= "${ lastWeekTime }"`;
            } else {
                query += ` AND applications.ApplicationIssued >= "${ lastWeekTime }"`;
            }
        }

          
        query += ' ORDER BY applications.ApplicationIssued ASC';
        
        query += ` LIMIT ${ parseInt( page ) * 10 },10`;

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
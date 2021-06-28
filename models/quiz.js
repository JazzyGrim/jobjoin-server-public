var mysql = require( "mysql" );
var ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId();

var connection = require( './database.js' ).connect();

module.exports.createQuiz = ( quiz, jobID ) => { // Create a new quiz
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO quiz ( QuizID, QuizJobID ) VALUES (" + mysql.escape( ID ) + ', ' + mysql.escape( jobID ) + ");" // Set the query to add a quiz
        connection.query( query, function( error, result ) { // Query the database
            if ( error ) { // If there was an error when querying the database
                reject( error ); // Reject the promise with the error
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }

            quiz.forEach( ( question, index ) => {
                
                createQuestion( question, index, ID ).then( questionID => {
                    
                    if ( question.answers == null ) resolve( ID );

                    question.answers.forEach( ( answer, answerIndex )  => {
                        
                        createQuestionAnswer( answer, answerIndex, questionID ).then( answerResult => {

                            // If we added everything
                            if ( answerIndex == ( question.answers.length - 1 ) && index == ( quiz.length - 1 ) ) resolve( ID );

                        } );

                    } );

                } );
            
            } );

        } );

    } );
}

const createQuestion = ( question, index, quizID ) => {
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO question ( QuestionID, QuestionQuizID, QuestionNumber, QuestionType, QuestionText, QuestionTimeLimit, QuestionPoints ) VALUES (" + mysql.escape( ID ) + ', ' + mysql.escape( quizID ) + ', ' + mysql.escape( index ) + ', ' + mysql.escape( question.type ) + ', ' + mysql.escape( question.text ) + ', ' + mysql.escape( question.timeLimit ) + ', ' + mysql.escape( question.points ) + ");" // Set the query to add a question
        connection.query( query, function( error, result ) { // Query the database
            if ( error ) { // If there was an error when querying the database
                reject( error ); // Reject the promise with the error
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ID );

        } );

    } );
}

const createQuestionAnswer = ( answer, index, questionID ) => {
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO questionanswers ( QuestionAnswerID, QuestionID, QuestionAnswerNumber, QuestionAnswerValue, QuestionAnswerCorrect ) VALUES (" + mysql.escape( ID ) + ', ' + mysql.escape( questionID ) + ', ' + mysql.escape( index ) + ', ' + mysql.escape( answer.value ) + ', ' + mysql.escape( answer.correct ) + ");" // Set the query to add a answer
        connection.query( query, function( error, result ) { // Query the database
            if ( error ) { // If there was an error when querying the database
                reject( error ); // Reject the promise with the error
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( );

        } );

    } );
}

module.exports.getQuizInfo = ( select, where, valueOfWhere ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT " + select + " FROM quiz WHERE " + where + " = " + mysql.escape( valueOfWhere ); // Define the query
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

module.exports.getQuestions = ( quizID ) => { // Get quiz questions
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT * FROM question WHERE QuestionQuizID = " + mysql.escape( quizID ) + ' ORDER BY QuestionNumber ASC'; // Define the query
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

module.exports.getQuestionAnswers = ( questionID ) => { // Get quiz questions
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT * FROM questionanswers WHERE QuestionID = " + mysql.escape( questionID ) + ' ORDER BY QuestionAnswerNumber ASC'; // Define the query
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

module.exports.getCorrectAnswers = ( questionID ) => { // Get correct answers
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT QuestionAnswerID, QuestionAnswerValue FROM questionanswers WHERE QuestionID = " + mysql.escape( questionID ) + ' AND QuestionAnswerCorrect = 1'; // Define the query
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

module.exports.createAnswer = ( questionID, userID, answerID, value, points ) => {
    return new Promise( ( resolve, reject ) => { // Return a new promise
        
        var ID = uid.randomUUID( 11 ); // Generate a unique ID

        var query = "INSERT INTO answer VALUES (" + mysql.escape( ID ) + ', ' + mysql.escape( questionID ) + ', ' + mysql.escape( userID ) + ', ' + mysql.escape( answerID ) + ', ' + mysql.escape( value ) + ', ' + mysql.escape( points ) + ");" // Set the query to add an answer
        connection.query( query, function( error, result ) { // Query the database
            if ( error ) { // If there was an error when querying the database
                reject( error ); // Reject the promise with the error
                console.log( error ); // Log the error to the console
                return; // Return to prevent further actions
            }

            resolve( ID );

        } );

    } );
}

module.exports.getQuizAnswersFromUser = ( userID, jobID ) => { // Get job info
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = `SELECT 
                    question.QuestionText, question.QuestionNumber, question.QuestionType, answer.AnswerAnswerID, answer.AnswerValue, answer.AnswerPoints, quiz.QuizID, quiz.QuizCreated
                    FROM answer
                    INNER JOIN question ON answer.AnswerQuestionID = question.QuestionID
                    INNER JOIN quiz ON question.QuestionQuizID = quiz.QuizID
                    WHERE QuizJobID = ${ mysql.escape( jobID ) }
                    AND AnswerUserID = ${ mysql.escape( userID ) } ORDER BY QuestionNumber ASC;`; // Define the query
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

module.exports.getAnswer = ( answerID ) => { // Get quiz questions
    return new Promise( ( resolve, reject ) => { // Return a new promise
        var query = "SELECT QuestionAnswerValue FROM questionanswers WHERE QuestionAnswerID = " + mysql.escape( answerID ); // Define the query
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
/*
*
*   Procesira slike i rotira ih po potrebi
*
*/

const jo = require('jpeg-autorotate');
var fs = require('fs'); // Require the file system
var piexif = require( 'piexifjs' );


// Rotiraj sliku ako potrebno
module.exports.rotateImage = ( url, inputBuffer ) => {

    jo.rotate( inputBuffer || url, { } ) .then( ( { buffer } ) => {

        fs.writeFile( url, buffer, null, ( err ) => {
            if ( err ) {
                console.log( error );
                return;
            }

        } )

    } ).catch( error => {
        if ( error.code == jo.errors.correct_orientation ) return;

        if ( error.message == 'Given thumbnail is too large. max 64kB' ) {
            try {
                fs.readFile( url, 'binary', ( readError, data ) => {
                    if ( readError ) {
                        console.log( readError );
                        return;
                    }
                    
                    const newData = deleteThumbnailFromExif( data );
                    
                    module.exports.rotateImage( url, newData );
    
                } );        
            } catch (error) {
                console.log( error );
            }
        
        }
    } )

}

function deleteThumbnailFromExif( imageBuffer ) {
    const imageString = imageBuffer.toString('binary')
    const exifObj = piexif.load(imageString)
    delete exifObj.thumbnail
    delete exifObj['1st']
    const exifBytes = piexif.dump(exifObj)
    const newImageString = piexif.insert(exifBytes, imageString)
    return Buffer.from(newImageString, 'binary' )
  }
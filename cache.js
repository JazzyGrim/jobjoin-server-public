/*
*
*   Univerzalne funkcije za pohranu i čitanje podataka iz predmemorije
*
*/

var NodeCache = require( 'node-cache' ); // Require the node-cache module

class Cache {

  constructor( ttlSeconds ) {
    this.cache = new NodeCache( { stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false } );
  }

  get( key ) {
    return this.cache.get( key );
  }

  set( key, value ) {
    this.cache.set( key, value );
  }

  del( keys ) {
    this.cache.del( keys );
  }

  flush( ) {
    this.cache.flushAll( );
  }
}


module.exports = Cache;
var request = require('request'),
  async = require('async'),
  fs = require('fs');

var Census = function( koop ){

  var census = {};
  census.__proto__ = koop.BaseModel( koop );

  //var variables = JSON.parse(fs.readFileSync(__dirname + '/../lib/variables.json').toString());
  var variables = {};

  // generates a key used to lookup data in the cache
  census.genKey = function(params){
    return [params['year'], params['state'], params['for'], params['variable']].join('::');
  };

  var geomDB;
  // figure out if we have a PostGIS based cache
  if ( koop.Cache.db && koop.Cache.db.type && koop.Cache.db.type === 'elasticsearch' ){
    // require koop-pgcache 
    geomDB = require('koop-pgcache').connect(koop.config.db.pg, koop);
  } else {
    geomDB = koop.Cache.db;
  }

  // looks at the cache and checks for data
  // requests it from the API if not found in cache 
  census.find = function( qtype, params, options, callback ){
    var k = 0;
    var q = async.queue(function (task, cb) {
      geomDB._query(task.query, function(err, result) {
        if (err || !result || !result.rows.length){
          return callback(err, null);
        }
        task.feature.geometry = JSON.parse( result.rows[0].geom );
        for (var p in task.feature.properties){
          if (variables[p]){
            task.feature.properties[p] = {
              label: variables[p].label,
              concept: variables[p].concept,
              value: task.feature.properties[p] 
            };
            //task.feature.properties[p+'_'+label] = variables[p].label;
            //task.feature.properties[p+'_'+concept] = variables[p].concept;
          }
          task.feature.properties.source = type;
        }
        cb( task.feature );
      });
    }, 4);

    q.drain = function(){
      // insert data
      koop.Cache.insert( type, key, geojson, 0, function( err, success){
        if ( success ) {
          callback( null, [geojson] );
        }
      });
      
    };

    var type = 'census', 
      key, 
      headers, 
      url, 
      query, 
      feature, 
      geojson = { type:'FeatureCollection', features:[] };

    if ( qtype == 'state' ){
      key = [params.year, params.state, params.variable].join('-');
    } else if (qtype == 'county'){
      key = [params.year, params.state, params.county, params.variable].join('-');
    } else if ( qtype == 'tract'){
      key = [params.year, params.state, params.county, params.tract, params.variable].join('-');
    }

    // for large datasets ingore koop's large data limit 
    options.bypass_limit = true;
 
    // check the cache for data with this type & key
    koop.Cache.get( type, key, options, function(err, entry ){
      if ( err){
        // if we get an err then get the data and insert it 
        var base = 'http://api.census.gov/data/'+params['year']+'/sf1?get='+params['variable'];
        switch ( qtype ){
          case 'county':
            url = base + '&for=county:'+params['county']+'&in=state:'+params['state'];
            break;
          case 'state': 
            url = base + '&for=state:'+params['state'];
            break;
          case 'tract':
            url = base + '&for=tract:'+params['tract']+'&in=state:'+params['state']+'+county:'+params['county']; 
            break;
        }
        url += '&key=d80e5c2e05560a421dfe2ada590d843b259e8dcb';

        request.get(url, function(e, res){
          try {
            var json = JSON.parse(res.body);
            json.forEach(function(row,i){
              if (i == 0){
                headers = row;
              } else {
                feature = {type:'Feature', properties:{}};
                row.forEach(function(col,j){
                  feature.properties[headers[j]] = (!isNaN(parseInt(col)) && !( headers[j] == 'county' || headers[j] == 'state' || headers[j] == 'tract')) ? parseInt(col) : col;
                });
                switch ( qtype ){
                  case 'county':
                    query = "select st_asgeojson(geom) as geom from us_counties where countyfp = '"+feature.properties.county+"' AND statefp = '"+feature. properties.state+"'";
                    break;
                  case 'state':
                    query = "select st_asgeojson(geom) as geom from us_states where statefp = '"+feature. properties.state+"'";
                    break;
                  case 'tract':
                    query = "select st_asgeojson(geom) as geom from tracts where tractce = '"+feature.properties.tract+"' AND statefp = '"+feature.properties.state+"' AND countyfp = '"+feature.properties.county+"'";
                    break;
                }
                q.push({query: query, feature: feature}, function(f){
                  geojson.features.push( f );
                });
              }
            });
          
          } catch(e){
            console.log(e);
            callback(res.body, null);
          }
        });
      } else {
        // We have data already, send it back
        callback( null, entry );
      }
    });
    
  }; 

  // drops from the cache
  census.drop = function( key, options, callback ){
     // drops the item from the cache
    var dir = [ 'census', key, 0].join(':');
    koop.Cache.remove('census', key, options, function(err, res){
      koop.files.removeDir( 'files/' + dir, function(err, res){
        koop.files.removeDir( 'tiles/'+ dir, function(err, res){
          koop.files.removeDir( 'thumbs/'+ dir, function(err, res){
            callback(err, true);
          });
        });
      });
    });
  };

  // searches across all census data in the cache
  census.search = function( options, callback ){
    // drops the item from the cache
    //options.type = 'census';
    koop.Cache.db.select('all', options, function(err, res){
      callback(null, res);
    });
  };

  return census;
}

module.exports = Census;

var crypto = require('crypto'),
  fs = require('fs');

// inherit from base controller (global via koop-server)
var Controller = function( census, BaseController ){
  var controller = BaseController();

  // general helper for not found repos
  controller.notFound = function(req, res){
    res.send('A useful error for missing data', 404);
  };
  
  // general helper for error'd requests
  controller.Error = function(req, res, code, message){
    res.send(message, code);
  };
  
  controller.index = function(req, res){
   res.json({'Census API': 'http://api.census.gov/data/'} );
  };

  controller.search = function(req, res){
    census.search(req.query, function(err, data){
      res.json(data);
    });
  };
  
  // Pass the params and query to the model  
  controller.get = function(req, res){

    var send = function(err, data){
      if (err) {
        res.send(err, 500);
      } else {
        res.json( data );
      }
    };
   

    var params = req.params;
    if (req.params.state && req.params.county && params.tract){
      census.find('tract', req.params, req.query, send);
    } else if (req.params.state && req.params.county){
      census.find('county', req.params, req.query, send);
    } else if ( req.params.state ){
      census.find('state', req.params, req.query, send);
    } else {
      res.send('Malformed query. Must provide at least a state value', 500);
    }

  };
  
  controller.featureservice = function(req, res){
      var callback = req.query.callback, self = this;
      delete req.query.callback;

      var send = function(err, data){
        if (err) {
          res.send(err, 500);
        } else {
          delete req.query.geometry;
          controller.processFeatureServer( req, res, err, data, callback);
        }
      };
    
      var params = req.params, type;
      if (req.params.state && req.params.county && params.tract){
        type = 'tract';
      } else if (req.params.state && req.params.county){
        type = 'county';
      } else if ( req.params.state ){
        type = 'state';
      }
      census.find(type, req.params, req.query, send);
  };
  
  
  // drops the cache
  controller.drop = function(req, res){
    var params = req.params, key;

    if (req.params.state && req.params.county && params.tract){
      key = [params.year, params.state, params.county, params.tract, params.variable].join('-');
    } else if (req.params.state && req.params.county){
      key = [params.year, params.state, params.county, params.variable].join('-');
    } else if ( req.params.state ){
      key = [params.year, params.state, params.variable].join('-');
    }

    census.drop( key, req.query, function(error, result){
      if (error) {
        res.send( error, 500);
      } else {
        res.json( result );
      }
    });
  };

  return controller;
};

module.exports = Controller;

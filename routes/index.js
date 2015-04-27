// Defines the routes and params name that will be passed in req.params 
module.exports = {
  'get /census/': 'index',
  'get /census': 'index',
  'get /census/search': 'search',
  'get /census/:year/state/:state/:variable/FeatureServer/:layer/:method': 'featureservice',
  'get /census/:year/state/:state/:variable/FeatureServer/:layer': 'featureservice',
  'get /census/:year/state/:state/:variable/FeatureServer': 'featureservice',
  'get /census/:year/state/:state/:variable': 'get',
  'get /census/:year/state/:state/county/:county/:variable/FeatureServer/:layer/:method': 'featureservice',
  'get /census/:year/state/:state/county/:county/:variable/FeatureServer/:layer': 'featureservice',
  'get /census/:year/state/:state/county/:county/:variable/FeatureServer': 'featureservice',
  'get /census/:year/state/:state/county/:county/:variable': 'get',
  'get /census/:year/state/:state/county/:county/tract/:tract/:variable/FeatureServer/:layer/:method': 'featureservice',
  'get /census/:year/state/:state/county/:county/tract/:tract/:variable/FeatureServer/:layer': 'featureservice',
  'get /census/:year/state/:state/county/:county/tract/:tract/:variable/FeatureServer': 'featureservice',
  'get /census/:year/state/:state/county/:county/tract/:tract/:variable': 'get',
  'get /census/:year/state/:state/county/:county/tract/:tract/:variable/drop': 'drop',
  'get /census/:year/state/:state/county/:county/:variable/drop': 'drop',
  'get /census/:year/state/:state/:variable/drop': 'drop'
}

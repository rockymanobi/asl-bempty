var log4js = require("log4js");
var config = require("config");
module.exports = (function( category ){
  var category = category || "system";
  log4js.configure( config.log4js.configure );
  var logger = log4js.getLogger( category );
  return logger;
})();


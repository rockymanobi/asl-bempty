var config = require('config');
var EventEmitter = require("events").EventEmitter
var util = require('util');
var _ = require('underscore');
var request = require('request');
var logger = require('./log.js');

module.exports = (function(){
  var Stall = function( options ){
    this.uuid = options.uuid;
    this.prevStatus = 0;    // unknown
    this.currentStatus = 0;  // unknown

    this.timer = void(0);
  };

  util.inherits( Stall, EventEmitter );

  _.extend( Stall.prototype, {
    startMonitoring: function(){
      var _this = this;
      this.timer = setInterval(function(){
        _this.getStatus();
      }, 2000);
    },
    getStatus: function(){
      var _this = this;
      var options = {
        uri:  config.bemptyUrl + '/cli_api/v1/stalls/' + this.uuid,
        form: {  },
        json: true
      };
      request.get(options, function(error, response, body){
        if (!error && response.statusCode == 200) {
          _this.onSync(body);
        } else {
          // TODO: ERROR HANDLING
          logger.error('error: '+ response);
        }
      });
    },
    onSync: function( data ){
      this.prevStatus = this.currentStatus;
      this.currentStatus = data.status;
      if( this.prevStatus !== this.currentStatus ){
        this.emit("stall-status-changed", this);
      }
    },
  });
  return Stall;



})();

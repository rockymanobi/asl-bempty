var config = require('config');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ECT = require('ect');
var path = require('path');
var Stall = require("./src/stall.js");
var request = require("request");

var logger = require('./src/log.js');

var ectRenderer = ECT({ watch: true, root: __dirname , ext : '.html' });
app.engine('html', ectRenderer.render);
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname));
app.set('view engine', 'html');

logger.info("App START!");

process.on('uncaughtException', function(err) {
    logger.fatal(err);
});

function lpad2(num, length){
  return ("0"+ num ).slice( -1 * length );
}


app.get('/', function(req, res){
  var options = {};
  options.stall1 = { uuid: stall1.uuid, status: stall1.currentStatus };
  options.stall2 = { uuid: stall2.uuid, status: stall2.currentStatus };
  options.sensor = {
    uuid: sensor.uuid,
    status: sensor.status,
    runningFrom: lpad2( sensor.sensor_conf.monitor_start_time_h,2 ) + ":" + lpad2( sensor.sensor_conf.monitor_start_time_m, 2),
    runningTo: lpad2( sensor.sensor_conf.monitor_stop_time_h,2 ) + ":" + lpad2( sensor.sensor_conf.monitor_stop_time_m, 2),
  };

  res.render('door',options);
});


io.on('connection', function(socket){
  logger.info('a user connected : ' + socket.id );
  socket.on('disconnect', function(){
    logger.info('user disconnected : ' + socket.id );
  });
});


var port = Number(process.env.PORT || 4000);
http.listen(port, function(){
  logger.info('listening on *:4000');
});



// ############################################
// 
// ############################################
var stall1 = new Stall({uuid: "asl-stall1"});
var stall2 = new Stall({uuid: "asl-stall2"});
stall1.startMonitoring();
stall2.startMonitoring();

function onStatusChanged( stall ){
  logger.info( 'status changed : ' + stall.uuid + ":" + stall.currentStatus);
  io.emit('change-status', { uuid: stall.uuid, status: stall.currentStatus });
}

stall1.on('stall-status-changed', onStatusChanged);
stall2.on('stall-status-changed', onStatusChanged);


// ############################################
// 
// ############################################
var sensor = {
  "uuid": "asl1",
  "status": 1,
  sensor_conf: {
    monitor_start_time_h: 8,
    monitor_start_time_m: 0,
    monitor_stop_time_h: 20,
    monitor_stop_time_m: 0,
  }
};

setInterval( function(){

  var getOptions = {
    uri:  config.bemptyUrl + '/cli_api/v1/sensors/asl1', 
    form: {  },
    json: true
  };

  request.get( getOptions, function( error, response, body){
    if (!error && response.statusCode == 200) {
      if( body.status !== sensor.status ){
        logger.info('sensor-status-changed-to: ' + body.status);
        io.emit('sensor-status-changed',{
          uuid: body.uuid,
          status: body.status,
          runningFrom: lpad2( body.sensor_conf.monitor_start_time_h, 2 ) + ":" + lpad2( body.sensor_conf.monitor_start_time_m, 2),
          runningTo: lpad2( body.sensor_conf.monitor_stop_time_h, 2 ) + ":" + lpad2( body.sensor_conf.monitor_stop_time_m, 2),
        });
      } 
      sensor = body;
    } else {
      // TODO: ERROR HANDLING
      logger.error('error: '+ response);
    }
  }); 
}, 10000);


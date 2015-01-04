var stallTemplate = "<div id='<%= uuid %>' class='stall <%= statusClassName %>'> <span class='stall-box'><%=  name %>:<span class='vacant-text status-text'>空</span><span class='occupied-text status-text'>閉</span><span class='unknown-text status-text'>???</span> </span></div>";

var Bempty = (function(){
  var Bempty = function(){
    this.isWaiting = false;
    this.stalls = [
      initial.stall1, initial.stall2
    ];
    this.sensor = initial.sensor;

    this.template = _.template( stallTemplate);
  };
  Bempty.prototype = {
    setSensorStatus: function(data){
      this.sensor.status = data.status;
      this.sensor.runningFrom = data.runningFrom;
      this.sensor.runningTo = data.runningTo;
    },
    renderSensorStatus: function(){
      var className = Bempty.sensorStatusToClassName( this.sensor.status );
      $('#sensor').removeClass('running').removeClass('sleeping').removeClass('error').removeClass('dead');
      $('#sensor').addClass(className);

      $('#running-time').html( this.sensor.runningFrom + "〜" + this.sensor.runningTo );
    },
    startWaiting: function(){
      this.isWaiting = true;
      $('body').addClass('waiting');
    },
    stopWaiting: function(){
      this.isWaiting = false;
      $('body').removeClass('waiting');
    },

    renderStatus: function(){
      var _this = this;

      //
      if( this.bothOccupied() ){
        $('body').addClass('both-occupied');
      }else{
        $('body').removeClass('both-occupied');
      }

      _.each(this.stalls, function(v){
        var $stall = $('#' + v.uuid );
        $stall.removeClass('vacant').removeClass('occupied').removeClass('unknown');
        $stall.addClass(Bempty.statusToClassName( v.status ));
      });

    },
    initialRender: function(){
      var $target = $('.container');
      var _this = this;
      $target.children().remove();
      // トイレの状態を描画
      _.each(this.stalls, function(v){
        $target.append(  _this.template({
          name: Bempty.uuid2Name( v.uuid ),
          uuid: v.uuid ,
          statusClassName: Bempty.statusToClassName( v.status )
        }) )
      });
      this.renderStatus();
    },
    setStallStatus: function( uuid, status ){
      var stall = this.stalls.filter(
        function(s){
          return s.uuid === uuid; }
      )[0];
      stall.status = status;
    },
    bothOccupied: function(){
      var openStalls = this.stalls.filter(function(s){
        return s.status === 2;
      });
      return openStalls.length === this.stalls.length;
    },
    notify: function(){
      this.stopWaiting();
      notifyMe();
      notif({
        type: "success",
        msg: moment().format("h時 m分") + "&nbsp;に空いたよ！！もう閉まったかもしれないけど...",
        width: "all",
        position: "center",
        autohide: false
      });
      
    },
  };

  Bempty.statusToClassName = function(status){
    return {
      0: "unknown",
      1: "vacant",
      2: "occupied",
    }[status];
  };
  Bempty.sensorStatusToClassName = function(status){
    return {
      "0": "sleeping",
      "1": "running",
      "-1": "error",
      "-2": "dead",
    }[status + ""];
  };
  Bempty.uuid2Name = function(status){
    return {
      "asl-stall1": "奥のトイレ",
      "asl-stall2": "手前のトイレ",
    }[status + ""];
  };


  return Bempty;
})();



function notifyMe( options ) {

  var current = moment().format("MM/DD HH:mm:ss");
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("トイレが空いたよ空いたよ!\n速くしないと閉まっちゃう");
  }

  // Let's check if the user is okay to get some notification
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    
    var options = {
      body: current + "\nはやくしないと閉まってしまうかも",
      icon: "/images/notify_icon.png"
    } 
    var notification = new Notification("空いたよ!!空いたよ!!", options);
  }

  // Otherwise, we need to ask the user for permission
  // Note, Chrome does not implement the permission static property
  // So we have to check for NOT 'denied' instead of 'default'
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {

      // Whatever the user answers, we make sure we store the information
      if(!('permission' in Notification)) {
        Notification.permission = permission;
      }

      // If the user is okay, let's create a notification
      if (permission === "granted") {
        var notification = new Notification("Hi there!");
      }
    });
  }

}




$(document).on('ready',function(){

  var bempty = new Bempty();
  bempty.initialRender();
  bempty.renderSensorStatus();
  var socket = io();
  socket.on('change-status', function(data){
    bempty.setStallStatus( data.uuid, data.status );
    bempty.renderStatus();
    if( data.status === 1 && bempty.isWaiting ){
      bempty.notify();
    }
  });

  socket.on('sensor-status-changed', function(data){
    bempty.setSensorStatus( data );
    bempty.renderSensorStatus(  );
  });

  socket.on('disconnect', function(){
    $('body').addClass('disconnect');
  });
  socket.on('connect', function(){
    $('body').removeClass('disconnect');
  });

  


  $('#tell-me-btn').on('click', function(){

    var notifyWaiting = function(){
      notif({
        type: "info",
        msg: "空いたら教えるよ！でも、ページをリロードしたら教えてあげないよ",
        width: "all",
        position: "center",
        autohide: false
      });
    };

    if (!("Notification" in window)) {
      alert("このブラウザはDesktopNotificationに対応していないよ！\nだからブラウザのalertで通知するね");
      bempty.startWaiting();
      notifyWaiting();
    } else if (window.Notification.permission !== 'denied') {

      if( window.Notification.permission !== 'granted'  ){ alert("ブラウザからの通知を許可しよう！\n許可しないと教えてくれないよ！"); }

      window.Notification.requestPermission(function (permission) {

        // Whatever the user answers, we make sure we store the information
        if(!('permission' in window.Notification)) {
          window.Notification.permission = permission;
        }

        // If the user is okay, let's create a notification
        if (permission === "granted") {
          bempty.startWaiting();
          notifyWaiting();
        }else{
          alert("通知許可してくれないと通知されないよ！\n拒否しちゃった人は通知設定を初期化しましょう。");
        }
      });
    }else{
      alert("通知許可してくれないと通知されないよ！\n拒否しちゃった人は通知設定を初期化しましょう。");
    }

  });

});



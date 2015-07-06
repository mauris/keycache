var ipc = require('ipc');

(function($){

  $(function() {
    var requestPasswordsTimer;

    ipc.on('request-passwords-ready', function(arg) {
      if (requestPasswordsTimer) {
        window.clearInterval(requestPasswordsTimer);
        requestPasswordsTimer = null;
      }

      console.log(arg);
    });

    ipc.on('create-password-success', function() {

    });

    $("#btnAddPassword").click(function(){
      ipc.send('create-password', {
        "domain": $("#txtDomainName").val()
      });
      return false;
    });

    requestPasswordsTimer = window.setInterval(function(){
      ipc.send('request-passwords');
    }, 500);
  });

})(jQuery);

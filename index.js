var ipc = require('ipc');

(function($){

  $(function() {
    ipc.send('request-passwords');

    $("#btnAddPassword").click(function(){
      ipc.send('create-password', {
        "domain": $("#txtDomainName").val()
      });
      return false;
    });
  });

})(jQuery);

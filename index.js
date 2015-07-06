var ipc = require('ipc');

(function($){

  $(function() {
    $("#btnAddPassword").click(function(){
      ipc.send('create-password', {
        "domain": $("#txtDomainName").val()
      });
      return false;
    });
  });

})(jQuery);

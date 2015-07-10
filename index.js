var ipc = require('ipc');
var nodeCrypto = require('crypto');
var fs = require('fs');
var mustache = require('mustache');

(function($){
  var createDefaultCache = function () {
    return {
      "passwords": []
    };
  }

  var CryptoService = function (algorithm, password) {
    this.encrypt = function (text) {
      var cipher = nodeCrypto.createCipher(algorithm, password);
      var crypted = cipher.update(text, 'utf8', 'base64');
      crypted += cipher.final('base64');
      console.log(crypted);
      return crypted;
    };
    this.decrypt = function (crypted) {
      var decipher = nodeCrypto.createDecipher(algorithm, password);
      var text = decipher.update(crypted, 'base64', 'utf8');
      text += decipher.final('utf8');
      return text;
    };
  }

  var readCache = function(file, cryptoService, callback) {
    callback = callback || function(){};
    fs.access(file, fs.F_OK | fs.R_OK, function(err) {
      if (err) {
        // file does not existing or unreadable. try creating default cache
        return callback(null, createDefaultCache());
      } else {
        fs.readFile(file, {"encoding": "utf8"}, function(err, data){
          if (err) {
            return callback(err);
          }

          var decrypted = cryptoService.decrypt(data);
          var result = JSON.parse(decrypted);
          return callback(null, result);
        });
      }
    });
  };

  var writeCache = function(file, cryptoService, data, callback) {
    callback = callback || function() {};
    var crypted = cryptoService.encrypt(JSON.stringify(data));
    fs.writeFile(file, crypted, {"encoding": "utf8"} , callback);
  };

  var generateRandomToken = function(length) {
    var rnd = nodeCrypto.randomBytes(length);
    var chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    var len = chars.length;
    var value = [];
    for (var i = 0; i < length; ++i) {
        value.push(chars[rnd[i] % len])
    }
    return value.join('');
  };

  var randomRange = function (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
  };

  var createPassword = function(domain, minLength, maxLength) {
    var length = randomRange(minLength, maxLength);
    var password = generateRandomToken(length);
    appData.passwords.push({
      "domain": domain,
      "password": password,
      "created": Date.now
    });
  };

  var algorithm = 'aes-256-cbc';
  var masterPassword = 'testpassword';
  var dataFile = __dirname + '/../keycache.dat';
  var appData;
  var cryptoService = new CryptoService(algorithm, masterPassword);

  $(function() {

    $("#btnAddPassword").click(function(){
      var domain = $("#txtDomainName").val().trim();
      createPassword(domain, 14, 26);
      writeCache(dataFile, cryptoService, appData);
      return false;
    });

    var addShowPassword = function(password, index, template) {
      $("#mainView").append(mustache.render(template, {
        password: password,
        index: index
      }));
    }

    readCache(dataFile, cryptoService, function(err, data) {
      appData = data;

      var template = $("#passwordRowTemplate").html();
      mustache.parse(template);
      appData.passwords.forEach(function(password, index) {
        addShowPassword(password, index, template);
      });


    });



  });

})(jQuery);

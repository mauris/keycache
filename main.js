var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var ipc = require('ipc');
var crypto = require('crypto');
var fs = require('fs');

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1280, height: 800});

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  // Open the devtools.
  mainWindow.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});

(function(){

  var createDefaultCache = function () {
    return {
      "passwords": []
    };
  }

  var CryptoService = function (algorithm, password) {
    this.encrypt = function (text) {
      var cipher = crypto.createCipher(algorithm, password);
      var crypted = cipher.update(text, 'utf8', 'hex');
      crypted += cipher.final('hex');
      return crypted;
    };
    this.decrypt = function (crypted) {
      var decipher = crypto.createDecipher(algorithm, password);
      var text = decipher.update(crypted, 'hex', 'utf8');
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
        fs.readFile(file, function(err, data){
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
    fs.access(file, fs.W_OK, function(err){
      if (err) {
        // file not writable
        return callback(err);
      } else {
        var crypted = cryptoService.encrypt(data);
        fs.writeFile(file, crypted, callback);
      }
    });
  };

  var generateRandomToken = function(length) {
    var rnd = crypto.randomBytes(length);
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
    console.log(password);
    appData.passwords.push({
      "domain": domain,
      "password": password,
      "created": Date.now
    });
  };


  var algorithm = 'aes-256-ctr';
  var masterPassword = 'testpassword';
  var dataFile = '../keycache.dat';
  var appData;
  var cryptoService = new CryptoService(algorithm);

  readCache(dataFile, cryptoService, function(err, data) {
    appData = data;
  });

  ipc.on('create-password', function(event, arg){
    var domain = arg.domain;
    console.log(domain);
    createPassword(domain, 14, 26);
  });

})();

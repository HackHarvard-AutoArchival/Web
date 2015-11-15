/**
 * Module dependencies.
 */
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var favicon = require('serve-favicon');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var methodOverride = require('method-override');
var FindFiles = require("node-find-files");
var JSZip = require("jszip");
var fs = require("fs");
//var JSZipUtils = require("JSZip-Utils");


var _ = require('lodash');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var sass = require('node-sass-middleware');

var multer = require('multer');
var upload = multer({ dest: 'autoTool/uploads/' })

/**
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');
var archiveController = require('./controllers/archival');
/**
 * API keys and Passport configuration.
 */
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Create Express server.
 */
var app = express();
var childProcess = require('child_process').exec;
var collector = null;
/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  debug: true,
  outputStyle: 'expanded'
}));
app.use(logger('dev'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({ url: secrets.db, autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca({
  csrf: false,
  xframe: 'SAMEORIGIN',
  xssProtection: true
}));
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  if (/api/i.test(req.path)) req.session.returnTo = req.path;
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
* Multer configuration
*/
/*
*/

/**
* Archival Tool route
*/

app.get('/autoTool', archiveController.index);
app.post('/autoTool/uploads', upload.array('jsonInput'), function (req, res) {
  if(collector !== null){
    res.end('Collector is already running');
    return;
  }

  var getFileNames = function(jsonArr) {
    var ret = [];
    for(var i = 0; i < jsonArr.length; i++){
      ret.push(jsonArr[i]['filename']);
    }
    return ret;
  }

  var getOriginalFileName = function(jsonArr, filename) {
    for(var i = 0; i < jsonArr.length; i++){
      if(jsonArr[i]['filename'] === filename){
        console.log("filename", filename);
        var mimetype = jsonArr[i]['mimetype'];
        console.log("mimetype", mimetype);
        return jsonArr[i]['originalname'];
        //return mimetype.substring(12,mimetype.length);
      }
    }
    return "";
  }

  var configPermaName = function(oldName) {
    var jsonE = oldName.substring(oldName.length - 5, oldName.length);
    var pdfE = oldName.substring(oldName.length - 4, oldName.length);
    var ret = "";
    if(pdfE == ".pdf"){
      ret = oldName.substring(0, oldName.length-5);
      ret += ".txt";
      return ret;
    }
    else if(jsonE == ".json"){
      ret = oldName.substring(0,oldName.length - 5);
      ret += "_perma";
      ret += jsonE;
      return ret;
    }
    return "";
  }


  var binaryPath = path.join(__dirname, 'autoTool/uploads/./web2perma'); 
  var fileNames = [];
  var argArr = getFileNames(req.files);
  for(var i = 0; i < argArr.length; i++) {
    var filePath = path.join(__dirname , 'autoTool/uploads/' + argArr[i]);
    var origFilePath = path.join(__dirname , 'autoTool/uploads/');
    var fileExt = getOriginalFileName(req.files,argArr[i]);
    fileNames.push(configPermaName(fileExt));
    console.log(req.files);
    childProcess('mv ' + filePath + ' ' + origFilePath + fileExt, function(error, stdout, stderr){
      if (error !== null) {
          console.log('exec error: ', error);
      }
    });
    
    origFilePath += fileExt;
    console.log(origFilePath);
    childProcess('' + binaryPath + ' ' + origFilePath, function(error, stdout, stderr) {
      console.log('stdout: ', stdout);
      console.log('stderr: ', stderr);
      if (error !== null) {
          console.log('exec error: ', error);
      }
    });  
  }

  //var zip = new JSZip();
  /*for(var x = 0; x < argArr.length; x ++)
  {
        var error;
        fs.readFile(__dirname+"/autoTool/uploads/"+argArr[x]+"_perma.json", 'utf8', function (err,data) {
            if (err) {
              console.log(err);
              error = true;
            }
            else
              zip.file(argArr[x], data, {binary:true});
        });
        if(error)
        {
          fs.readFile(__dirname+"/autoTool/uploads/"+argArr[x]+".txt", 'utf8', function (err,data) {
            if (err) {
              console.log(err);
            }
            else
              zip.file(argArr[x], data, {binary:true});
          });
        }

      
   /*     // loading a file and add it in a zip file
    JSZipUtils.getBinaryContent("./autoTool/uploads/03cf2534221187268dc4c165d6889a09.txt", function (err, data) {
       if(err) {
          throw err; // or handle the error
       }
       zip.file(argArr[x]+"_perma", data, {binary:true});
    });*/
  //}
  /*
  fs.readFile("hi.txt", 'utf8', function (err,data) {
    if (err) {
      console.log(err);
    }
    else
      zip.file("hi.txt", data, {binary:true});
      console.log("Zip: "+zip);
  });

  while(zip === 'undefined' || zip === 'null')
  {
    console.log("Blob " +blob);
  }
  var blob = zip.generate({type:"arraybuffer"});

  fs.writeFile("test.zip", blob, function(err) {
    if (err) throw err;
  });
  */
  res.render('myFiles', {
    title: 'Archival Tool',
    files: fileNames
  });
});

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postTwitter);
app.get('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getVenmo);
app.post('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postVenmo);
app.get('/api/linkedin', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getInstagram);
app.get('/api/yahoo', apiController.getYahoo);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
app.get('/api/bitgo', apiController.getBitGo);
app.post('/api/bitgo', apiController.postBitGo);
app.get('/api/bitcore', apiController.getBitcore);
app.post('/api/bitcore', apiController.postBitcore);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/tumblr');
});
app.get('/auth/venmo', passport.authorize('venmo', { scope: 'make_payments access_profile access_balance access_email access_phone' }));
app.get('/auth/venmo/callback', passport.authorize('venmo', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/venmo');
});


/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
const sqlite3 = require('sqlite3').verbose();
var expressValidator = require('express-validator');

var request = require('request');
var promise = require('promise');

var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);

var passport = require('passport');//hash setup
var LocalStrategy = require('passport-local');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var bcrypt = require('bcrypt');

var app = express();

// view engine setup
app.engine('hbs', hbs({extname:'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//secret key r stringandom
app.use(session({
  store: new SQLiteStore,
  secret: 'ershthtsjy',
  resave: false,
  saveUninitialized: false
}));

//passport authentication
app.use(passport.initialize());
app.use(passport.session());
app.use('/', indexRouter);
app.use('/users', usersRouter);

let db = new sqlite3.Database('./db/users.db');


passport.use(new LocalStrategy(
  function(username,password,done) {
    console.log(username);
    console.log(password);

    db.all(`SELECT password FROM userData WHERE username =?`, [username], function(err,results,fields){
      if(err){reject(err);}

      //if (results.length() == 0){
      //  done(null,false);
      //}
      var hash;
      console.log(results[0]);
      //if password vvalue doesnt exists catch the error
      try {
        hash = results[0].password;
      } catch(err) {
        console.log("o no");
      }
      console.log(password);

      //compare the password to the encryopted passwprd
      bcrypt.compare(password, hash, function(err, response){
        console.log(response);
        if(!response){
          return done(null,false);
        }
        return done(null, {user_id: 43});
      });
    })
    
    /*console.log(checkUser(username));
    if (checkUser(username)){
      done(null, 'sedg');
    } else{
      done(null, false);
    }*/

}));


db.getAsync = function (sql) {
  var that = this;
  return new Promise(function (resolve, reject) {
      that.get(sql, function (err, row) {
          if (err)
              reject(err);
          else
              resolve(row);
      });
  });
};

function checkUser(username) {
  var val = -1;
  var getStmt = `SELECT password FROM userData WHERE username="${username}"`;
  console.log(getStmt);
  return db.getAsync(getStmt).then((row) => {
      if (!row) {
        console.log("USER NOT FOUND");
        //var insertSql = `INSERT INTO Voters (Name, Count) VALUES ("${voter}", 1)`;
        //val = -1;
        //return db.runAsync(insertSql);
      }
      else {
        val = 1;
        console.log(row);
        console.log("USER FOUND");
      }
  }).then(() => {
      console.log(val);
      return val;
  });
}


module.exports = app;


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


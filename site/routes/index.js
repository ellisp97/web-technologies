var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var passport = require('passport');

const saltRounds = 10;

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/users.db');

//initialise table
//db.run('CREATE TABLE userData(user_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,username TEXT, email TEXT, password TEXT)');// --- INITIAL TABLE HAS BEEN MADE

//output names to server
db.serialize(function() {
  db.each(`SELECT Name as name,
                  Username as username,
                  Email as email
              FROM userData`, (err, row) => {
      if (err) {
          console.error(err.message);
      }
      console.log( row.name + "\t" + row.username + "\t" + row.email);
  });
});


/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.user);
  console.log(req.isAuthenticated());
  res.render('index', { title: 'Form Valiadtion'});
});

/* GET Logged In page ? */
router.get('/login', authenticationMiddleware(),
  function(req, res, next) {
  res.render('loggedin', { title: 'LOGGED IN'});
});


router.get('/logout', function(req,res) {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});


router.post('/logout', function(req,res) {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/login',
  failureRedirect: '/'
}));


router.post('/sumbit', function(req,res,next){

  req.check('name', 'Name too short').isLength({min:2}); //validation requirements
  req.check('username', 'Username must be more than 4 characters').isLength({min:4});
  req.check('email', 'Invalid email').isEmail();
  req.check('password', 'Password must be more than 4 characters').isLength({min:4}).equals(req.body.password2);

  var name = req.body.name;
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;

  var errors = req.validationErrors();
  if(errors){
    req.session.errors = errors;
    req.session.success = false;
    console.log('FAIL');
    res.render('index', { title: 'Form Validation', success: req.session.success, errors:req.session.errors});
  } else{
    //req.session.success =true;
    console.log('SUCCESS');
    bcrypt.hash(password, saltRounds, function(err,hash){ //hash password
      db.run(`INSERT INTO userData (name,username,email,password) VALUES(?,?,?,?)`, [name,username,email,hash], function(err) {
        if (err) {
          return console.log(err.message);
        } else {
          const user_id = `${this.lastID}`;
          req.login(user_id, function(err){
            console.log(user_id);
            res.redirect('/');
          });
        }
      });
    });
  }
});


passport.serializeUser(function(user_id, done){
  done(null, user_id);
});

passport.deserializeUser(function(user_id, done){
  done(null, user_id);
});


function authenticationMiddleware(){
  return (req,res,next) => {
    console.log(`
      req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

    if (req.isAuthenticated()) return next (
      );
    
    res.redirect('/');
  }
}


/*router.get('/test/:id', function(req,res,next){
  res.render('test', {output: req.params.id});
});

router.post('/test/submit', function(req,res,next){
  var id = req.body.id;
  res.redirect('/test/' + id);
;})*/


module.exports = router;

var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var passport = require('passport');
var cheerio = require('cheerio');
var request = require('request');
var util = require('util');
var fail = false;


const saltRounds = 10;

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/users.db');

//initialise table
//db.run('CREATE TABLE userData(user_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,username TEXT, email TEXT, password TEXT)');// --- INITIAL TABLE HAS BEEN MADE
//db.run('CREATE TABLE productData(product_id INTEGER PRIMARY KEY AUTOINCREMENT, prod_name TEXT, prod_price PRICE, prod_url TEXT, user_id INTEGER');// --- INITIAL PRODUCT TABLE HAS BEEN MADE

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
  if(req.isAuthenticated()){
    res.redirect('/login');
  }else{
    console.log("you are in the get /request");
    res.render('index', { title: 'Home Screen', fail:fail});
  }

});


function authenticationMiddleware(){
  return (req,res,next) => {
    console.log(`
      req.session.passport.user: ${JSON.stringify(req.session.passport)}`);
    console.log("authenticationmiddleware");
    if (req.isAuthenticated()) return next (
      );
    // console.log("you are not allowed here");
    res.redirect('/');
  }
}

/* GET home page. */
// router.get('/#fail', function(req, res, next) {
//   console.log(req.user);
//   console.log(req.isAuthenticated());
//   if(req.isAuthenticated()){
//     res.redirect('/login');
//   }else{
//     console.log("you are in the fail get /request");
//     res.render('index', { title: 'Home Screen', fail:true});
//   }
// });



/* GET Logged In page ? */
router.get('/login', authenticationMiddleware(),
  function(req, res, next) {
  var userid = req.session.passport.user.user_id;

    console.log('hello')
    console.log(userid);
    db.all(`SELECT username, email FROM userData WHERE user_id =?`, [userid], function(err,results,fields){
      var username = results[0].username;
      var email = results[0].email;
      console.log(email);
      console.log(username);
      res.render('loggedin', { title: 'LOGGED IN',userid: userid, username: username, email:email});
    });
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

// router.post('/login', passport.authenticate('local', {
//   successRedirect: '/login',
//   failureRedirect: '/#fail'
// }));

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if(err) {
      console.error(err);
      return next(err);
    }
    if(!user){
      //DO SOMETHING COOL
      console.log("here")
      fail = true;
      return res.redirect('/');
    }
    req.logIn(user, function(err) {
      fail = false;
      if(err){
        console.error(err);
        return next(err);
      }
      return res.redirect('/login');
    });
    return res.redirect('/');
  })(req, res, next);
});


router.get('/profile', authenticationMiddleware(),
  function(req, res, next) {
  var userid = req.session.passport.user.user_id;

  db.all(`SELECT username, email FROM userData WHERE user_id =?`, [userid], function(err,results,fields){
    var username = results[0].username;
    var email = results[0].email;
    console.log(email);
    console.log(username);
    res.render('profile', { title: 'LOGGED IN',userid: userid, username: username, email:email});
  });
});



router.post('/sumbit', function(req,res,next){

  req.check('email', 'Invalid email').isEmail();

  var name = req.body.name;
  var username = req.body.usernameR;
  var email = req.body.email;
  var password = req.body.passwordR;

  // db.serialize(()=> {
    let userExists = "SELECT * FROM userData WHERE username = ?";
    console.log(username);
    db.all(userExists,[username], function(err,rows){
      if (err){throw(err);}
      console.log(rows);
      if(!Array.isArray(rows)||!rows.length||rows==undefined){
        var errors = req.validationErrors();
        if(errors){
          // req.session.errors = errors;
          req.session.success = false;
          console.log('FAIL');
          res.render('index', { title: 'Form Validation', success: req.session.success});// errors:req.session.errors});
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
                   res.redirect('/login');
                 });
              }
            });
          });
        } 
      } else{
        console.log('username already exists');  
      }
    // });
  });
});

router.post('/sell', function(req,res,next){

    var url = 'https://www.amazon.co.uk/AKORD-Metal-Binder-Clip-Clamp/dp/B0082JFX1M';

    const sqlite3 = require('sqlite3').verbose();
    let db = new sqlite3.Database('./db/prices.db');

    db.run('CREATE TABLE productData(prod_id TEXT, prod_name TEXT,prod_currency TEXT, prod_price REAL, prod_url TEXT, user_id INTEGER)');// --- INITIAL PRODUCT TABLE HAS BEEN MADE

    var userid = req.user.user_id;
    var title_text = req.body.prod_name;
    var price = req.body.prod_price;
    var price_num;
    var currency = '£';
    var title_text;

    db.run(`INSERT INTO productData(prod_name,prod_currency, prod_price, prod_url, user_id) VALUES(?,?,?,?,?)`, [title_text,currency,price_num,url,userid], function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log('SUCCESS');
      res.redirect('/login');
    });
  
});


passport.serializeUser(function(user_id, done){
  done(null, user_id);
});

passport.deserializeUser(function(user_id, done){
  done(null, user_id);
});


module.exports = router;

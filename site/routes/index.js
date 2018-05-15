var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var passport = require('passport');
var cheerio = require('cheerio');
var request = require('request');


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
    res.render('loggedin', {title: 'Youre logged in'});
  }else{
    res.render('index', { title: 'Home Screen'});
  }
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



router.get('/profile', authenticationMiddleware(),
  function(req, res, next) {
    console.log(req.session);
  var userid = req.user.user_id;

  console.log(req.user.user_id);
  console.log(userid);
  db.all(`SELECT username, email FROM userData WHERE user_id =?`, [userid], function(err,results,fields){
    if(err){reject(err);}

    var username = results[0].username;
    var email = results[0].email;
    res.render('profile', { title: 'YOUR PROFILE', userid: userid, username: username, email:email});

  });
});


router.post('/sumbit', function(req,res,next){

  // req.check('name', 'Name too short').isLength({min:2}); //validation requirements
  // req.check('username', 'Username must be more than 4 characters').isLength({min:4});
  // req.check('email', 'Invalid email').isEmail();
  // req.check('password', 'Password must be more than 4 characters').isLength({min:4}).equals(req.body.password2);

  var name = req.body.name;
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;

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

    // if (!error && response.statusCode == 200) {
    //   var $ = cheerio.load(html);
    //   $('span#priceblock_ourprice').each(function(i, element) {
    //     var el = $(this);
    //     var price_text = el.text();
    //     //TODO: add error checking for the database and currency type
    //     if(price_text[0] == "£"){
    //       price = price_text.split("£")[1];
    //       currency = "£";
    //     }
    //     if(price_text[0] == "$"){
    //       price = price_text.split("$")[1];
    //       currency = "$";
    //     }
    //     if(price_text[0] == "€"){
    //       price = price_text.split("€")[1];
    //       currency = "€";
    //     }
    //     price_num = Number(price);
    //     console.log(price_num);
    //   });
  
    //   $('span#productTitle').each(function(i, element) {
    //     var el = $(this);
    //     title_text = el.text();
    //   });

    // is this in the database
    // get id from link
    // check if its in database 
      //if is output link to user 
      //take to home login page with carousel and graph price history
      //need sumbit for them to register buying to store in prfile
    // else 
    db.run(`INSERT INTO productData(prod_name,prod_currency, prod_price, prod_url, user_id) VALUES(?,?,?,?,?)`, [title_text,currency,price_num,url,userid], function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log('SUCCESS');
      res.redirect('/login');
    });
  
  // if(errors){
  //   req.session.errors = errors;
  //   req.session.success = false;
  //   console.log('FAIL');
  //   res.render('index', { title: 'Form Validation', success: req.session.success, errors:req.session.errors});
  // } else{
  //   //req.session.success =true;
  //   console.log('SUCCESS');
  //     db.run(`INSERT INTO productData (name,username,email,password) VALUES(?,?,?,?)`, [name,username,email,hash], function(err) {
  //       if (err) {
  //         return console.log(err.message);
  //       } else {
  //         const user_id = `${this.lastID}`;
  //         req.login(user_id, function(err){
  //            console.log(user_id);
  //            res.redirect('/login');
  //          });
  //       }
  //     });
  //   });
  // }
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

/* ASYNCHRONOUS REAL TIME USERNAME CHECKER
async function getSimilarUser(username) {
	let response = await fetch(`https://happy-css.com/api/users?limit=1&name=${username}`)
	return response.json()
}

async function isUserValid(target) {
	let username = target.value
	let users = await getSimilarUser(username)
	if (users.length) {
		let existingUsername = users[0].name
		if (existingUsername == username) {
			target.setCustomValidity(`The user "${username}" already exists`)
			return false
		}
	}
	target.setCustomValidity('')
	return true
}*/


module.exports = router;

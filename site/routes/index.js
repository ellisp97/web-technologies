var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var passport = require('passport');
var cheerio = require('cheerio');
var request = require('request');
var util = require('util');


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
    res.render('index', { title: 'Home Screen'});
  }
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


/* GET Logged In page ? */
router.get('/login', authenticationMiddleware(),
  function(req, res, next) {
    console.log('hello')
    var userid = req.session.passport.user;
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

router.post('/login', passport.authenticate('local', {
  successRedirect: '/login',
  failureRedirect: '/'
}));



router.get('/profile', authenticationMiddleware(),
  function(req, res, next) {
  var userid = req.session.passport.user;

  console.log('this is user id');
  console.log(req.user.user_id);
  console.log(userid);

  var get_user_data = function(userid, cb) {
    var query = `SELECT username, email, watched_product_ids FROM userData WHERE user_id =?`;
    db.get(query, [userid], function(err, row) {
      if(err){
        console.error(err);
        cb("error", null);
      } else{
        var user_data = {userid:userid, username:row.username, email:row.email, watched_ids:row.watched_product_ids};
        cb(null, user_data);
      }
    });
  };

  var get_pd_array = function(id, cb){
    var query = `SELECT prod_name, prod_price_history, date_update_history FROM productData where prod_id =?`;
    db.get(query, [id], function(err, row) {
      console.log(row);
      if(err){
        console.error(err);
        cb("error", null);
      }else{
        cb(null, row);
      }
    });
  };



  var get_product_data_async = async function(prod_ids, cb){
    var product_data_array = [];
    var watched_id_string = prod_ids;
    var watched_ids = watched_id_string.split(",");
    for (id of watched_ids){
      var pd_row = await get_pd_array_async(id);
      product_data_array.push(pd_row);
    };
    console.log(product_data_array);
    return product_data_array;
  };

  const get_user_data_async = util.promisify(get_user_data);
  const get_pd_array_async = util.promisify(get_pd_array);

  (async() => {
    let user_data, product_data_array;
    try {
      user_data = await get_user_data_async(userid);
      product_data_array = await get_product_data_async(user_data.watched_ids);
    }
    catch (err) {
      return console.error(err);
    }
    // return res.send(product_data_array);
    return res.render('profile', {title: 'YOUR PROFILE', userid:user_data.userid, username:user_data.username, email:user_data.email});
  })();

  // db.get(`SELECT username, email, watched_product_ids FROM userData WHERE user_id =?`, [userid], function(err,result) {
  //   if(err){
  //     console.error(err);
  //   }
  //
  //   var username = result.username;
  //   var email = result.email;
  //   var watched_id_string = result.watched_product_ids;
  //   var watched_ids = watched_id_string.split(",");
  //   console.log(watched_ids);
  //   var query = `SELECT prod_name, prod_price_history, date_update_history FROM productData where prod_id =?`;
  //   console.log(query);
  //   db.get(query, [watched_ids], function(error, rows) {
  //     if(error){
  //       console.error(err);
  //     }
  //     console.log("rows");
  //     console.log(rows);
  //   })
  //   res.render('profile', { title: 'YOUR PROFILE', userid: userid, username: username, email:email});
  //
  // });
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

var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var passport = require('passport');
var cheerio = require('cheerio');
var request = require('request');
var util = require('util');
var scraper = require('../neaterscraper');
// var img_scraper = require('../imagescraper');
var scraperupdater = require('../scraperdatabaseupdater');

var fail = false;
var URLcode = 1;

const saltRounds = 10;

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/users.db');


//initialise table
//db.run('CREATE TABLE userData(user_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,username TEXT, email TEXT, password TEXT)');// --- INITIAL TABLE HAS BEEN MADE
//db.run('CREATE TABLE productData(product_id INTEGER PRIMARY KEY AUTOINCREMENT, prod_name TEXT, prod_price PRICE, prod_url TEXT, user_id INTEGER');// --- INITIAL PRODUCT TABLE HAS BEEN MADE

db.allAsync = function (sql, params) {
    console.log(params);
    var that = this;
    return new Promise(function(resolve, reject) {
        that.all(sql, params, function(err, rows){
            if(err){
                reject(err);
            }else{
                resolve(rows);
            }
        });
    });
};

var get_user_data = function(userid, query, cb) {
    db.get(query, [userid], function(err, row) {
        if(err){
            console.error(err);
            cb("error", null);
        } else{
            cb(null, row);
        }
    });
};

var get_pd_row = function(id, query, cb){
    db.get(query, [id], function(err, row) {
        if(err){
            console.error(err);
            cb("error", null);
        }else{
            cb(null, row);
        }
    });
};

var get_product_data_async = async function(prod_ids, query, cb){
  var product_data_array = [];
  var watched_id_string = prod_ids;
  var watched_ids;
  if (watched_id_string!= null){
    watched_ids = watched_id_string.split(",");
  }else{
    watched_ids = null;
    return product_data_array;
  }
  for (let id of watched_ids){
    var pd_row = await get_pd_row_async(id, query);
    product_data_array.push(pd_row);
  };
  // console.log(product_data_array);
  return product_data_array;
};

var get_image_urls = async function(url_rows, cb){
    var img_urls = [];
    for (let url of url_rows){
        console.log(url.prod_link);
        var imgCode = await img_scraper.callImgScraper(url.prod_link);
        console.log("image link", imgCode);
        img_urls.push(imgCode);
    }
    return img_urls;
}

const get_user_data_async = util.promisify(get_user_data);
const get_pd_row_async = util.promisify(get_pd_row);

//output names to server
db.serialize(function() {
    db.each(`SELECT Name as name, Username as username, Email as email
              FROM userData`, (err, row) => {
        if (err) {
            console.error(err.message);
        }
      // console.log( row.name + "\t" + row.username + "\t" + row.email);
    });
});

/* GET home page. */
router.get('/', function(req, res, next) {
    if(req.isAuthenticated()){
        res.redirect('/login');
    }else{
        res.render('index', {title: 'HOMEPAGE', URLcode: URLcode, flop:fail});
        fail=false;
    }
});


function authenticationMiddleware(){
    return (req,res,next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);
        // console.log("authenticationmiddleware");
        if(req.isAuthenticated()){
            return next();
        }else {
            return res.redirect('/');
        }
    }
}

/* GET Logged In page ? */
router.get('/login', authenticationMiddleware(), async function(req, res, next) {
    var userid = req.session.passport.user;
    if(isNaN(userid)){ userid = req.session.passport.user.user_id;}
    let id_rows, url_rows, watched_ids;
    let watched_imgs = [];
    var user_query = `SELECT username, email, watched_product_ids FROM userData WHERE user_id =?`;
    var pd_query = `SELECT * FROM productData where prod_id =?`;
    id_row = await get_user_data_async(userid, user_query);
    console.log("id row", id_row);
    let url_image_rows = await get_product_data_async(id_row.watched_product_ids, pd_query);
    console.log("image urls", url_image_rows);
    var username = id_row.username;
    var email = id_row.email;
    old_url_code = URLcode;
    URLcode = 1;
    url_rows = JSON.stringify(url_image_rows);
    return res.render('loggedin',  {title:'LOGGED IN', userid:userid, username:username, email:email, URLcode:old_url_code, image_rows:url_rows});
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

router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if(err) {
            console.error(err);
            return next(err);
        }
        if(!user){
            fail = true;
            return res.redirect('/');
        }
        req.logIn(user, function(err) {
            // console.log("logging in");
            fail = false;
            if(err){
                console.error(err);
                return next(err);
            }
            return res.redirect('/login');
        });
    })(req, res, next);
});


// router.get('/profile', authenticationMiddleware(), function(req, res, next) {
//   var userid = req.user.user_id;

//   (async() => {
//     let user_data, product_data_array;
//     try {
//       var user_query = `SELECT username, email, watched_product_ids FROM userData WHERE user_id =?`;
//       var pd_query = `SELECT * FROM productData where prod_id =?`;
//       user_data = await get_user_data_async(userid, user_query);
//       product_data_array = await get_product_data_async(user_data.watched_ids, pd_query);
//     }
//     catch (err) {
//       return console.error(err);
//     }
//     // return res.send(product_data_array);
//     // res.cookie('data', JSON.stringify(product_data_array));
//     // console.log(product_data_array);
//     // console.log("^ pd aray");
//     var pd_array_json = JSON.stringify(product_data_array);
//     return res.render('profile', {title: 'YOUR PROFILE', userid:user_data.userid, username:user_data.username, email:user_data.email, prod_data:pd_array_json});
//   })();
// });

function cleanArray(actual) {
  var newArray = new Array();
  for (var i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}

router.get('/profile', authenticationMiddleware(), function(req, res, next) {
  var userid = req.session.passport.user;
  if(isNaN(userid)){ userid = req.session.passport.user.user_id;}
  // console.log(req.user.user_id);
  console.log(userid);


  (async() => {
    let user_data, product_data_array;
    try {
      var user_query = `SELECT username, email, watched_product_ids FROM userData WHERE user_id =?`;
      var pd_query = `SELECT * FROM productData where prod_id =?`;
      user_data = await get_user_data_async(userid, user_query);
      console.log(user_data);
      var watched_lengths;
      var watched_prices;
      var current_price;
      var watched_currency;
      var savings_made;
      var current_saving;
      var saving_if_null;
      var current_max;
      var saving_diff;
      var total_saving;
      var max_saving;
      var product_max_saving;
      watched_prices = 0;
      total_saving = 0;
      max_saving = 0;
      watched_lengths = 0;
      if (user_data.watched_product_ids){
        product_data_array = await get_product_data_async(user_data.watched_product_ids, pd_query);

        for(var prod of product_data_array){
          if(prod!=null){
            watched_lengths += 1;
            // console.log("THIS IS CURRENT PRICE  ==============", prod.prod_price_current);
            current_price = prod.prod_price_current;
            current_saving = prod.prod_price_history;
            // console.log("CURRRENT SAVING IS         ",current_saving.split(","))
            saving_if_null = current_saving.split(",");
            var saving_if =[];
            for(var saving of saving_if_null){
              if(!isNaN(saving)){
                saving_if.push(parseInt(saving));
              }
            }
            // console.log("OLD ARRAY", saving_if_null);
            // console.log("NEW ARRAY", saving_if);

            current_max = Math.max.apply(null,saving_if);
            // console.log("THIS IS NEW CURRENT MIN", current_max);

            saving_diff = (current_max - current_price);
            if(max_saving<saving_diff){
              max_saving = saving_diff;
              product_max_saving = prod.prod_name;
            }
            // console.log("SACING DIFF", saving_diff);

            total_saving += saving_diff;
            // console.log("TOTAAL SAVING", total_saving);


            if(!isNaN(current_price)||current_price==null){
              watched_prices += current_price;
            }
            // console.log("THIS IS TOTAL PRICE  ==============",watched_prices);
          }
          watched_currency = product_data_array[0].prod_currency.charAt(0);
        }
        total_saving = (total_saving/100).toFixed(2);
        watched_prices = (watched_prices/100).toFixed(2);
        max_saving = (max_saving/100).toFixed(2);
      }else{
        watched_ids = null;
      }
    }
    catch (err) {
      return console.error(err);
    }
    // return res.send(product_data_array);
    // res.cookie('data', JSON.stringify(product_data_array));
    console.log(product_data_array);
    console.log("^ pd aray");
    var pd_array_json = JSON.stringify(product_data_array);
    return res.render('profile', {title: 'YOUR PROFILE', userid:user_data.userid, username:user_data.username, email:user_data.email, prod_data:pd_array_json,watched_lengths:watched_lengths,watched_prices:watched_prices,watched_currency:watched_currency,total_saving:total_saving,product_max_saving:product_max_saving,max_saving:max_saving, URLcode : 1 });
  })();
});


router.post('/submit', function(req,res,next){
    var name = req.body.name;
    var username = req.body.usernameR;
    var email = req.body.email;
    var password = req.body.passwordR;

  // db.serialize(()=> {
    let userExists = "SELECT * FROM userData WHERE username = ?";
    db.all(userExists,[username], function(err,rows){
        if (err){throw(err);}
        if(!Array.isArray(rows)||!rows.length||rows==undefined){
            var errors = req.validationErrors();
            if(errors){
                // req.session.errors = errors;
                req.session.success = false;
                // console.log('FAIL');
                res.render('index', { title: 'Form Validation', success: req.session.success});// errors:req.session.errors});
            } else{
                //req.session.success =true;
                // console.log('SUCCESS');
                bcrypt.hash(password, saltRounds, function(err,hash){ //hash password
                    db.run(`INSERT INTO userData (name,username,email,password) VALUES(?,?,?,?)`, [name,username,email,hash], function(err) {
                        if (err) {
                            return // console.log(err.message);
                        } else {
                            const user_id = `${this.lastID}`;
                            req.login(user_id, function(err){
                                res.redirect('/login');
                            });
                        }
                    });
                });
            }
        } else{
        // console.log('username already exists');
        }
    // });
    });
});

router.post('/add', async function(req,res,next){
    var userid = req.session.passport.user;
    if(isNaN(userid)){ userid = req.session.passport.user.user_id;}

    var url = req.body.prod_link;//'https://www.amazon.co.uk/AKORD-Metal-Binder-Clip-Clamp/dp/B0082JFX1M';
    console.log("the given url is", url);
    // console.log(url);
    var scraper_returner = await scraper.callScraper(url);
    console.log("==============SCRAPER-RETURNER====================",scraper_returner);
    URLcode = scraper_returner[0];
    var prod_id = scraper_returner[1];
    var user_data = await get_user_data_async(userid, `SELECT watched_product_ids FROM userData WHERE user_id =?`);
    console.log(user_data);
    var watched_ids;
    var check_if_in_watched_ids;
    if(user_data.watched_product_ids){
      watched_ids = user_data.watched_product_ids;
      check_if_in_watched_ids = watched_ids.split(',');
      console.log(check_if_in_watched_ids);
      // $.inArray(prod_id,check_if_in_watched_ids);
      console.log(check_if_in_watched_ids.includes(prod_id));
      if(!check_if_in_watched_ids.includes(prod_id) && URLcode==0){
        URLcode = 1;
      }
    }else if(URLcode==0){
      URLcode = 1;
    }

    // console.log(URLcode);
    if(URLcode!=1){
      res.redirect('/login');
    }else{
      console.log("product id is", prod_id);
      if(watched_ids){
        watched_ids = watched_ids + "," + prod_id;
      }else{
        watched_ids = prod_id;
      }
      db.run(`UPDATE userData SET watched_product_ids = ? WHERE user_id=?`, [watched_ids,userid], function(err) {
        if (err) {
          return // console.log(err.message);
        }
        // console.log('SUCCESS');
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

//get ids from user
//get product urls from ids
//get image links from them
//display in carousel

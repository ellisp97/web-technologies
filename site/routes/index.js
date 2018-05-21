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
    if(watched_id_string!= null){
        watched_ids = watched_id_string.split(",");
    } else{
        watched_ids = null;
    }
    for (let id of watched_ids){
        var pd_row = await get_pd_row_async(id, query);
        product_data_array.push(pd_row);
    };
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

router.get('/profile', authenticationMiddleware(), function(req, res, next) {
    console.log(req.session);
    var userid = req.user.user_id;
    console.log(req.user.user_id);
    console.log(userid);

    (async() => {
        let user_data, product_data_array;
        try {
            var user_query = `SELECT username, email, watched_product_ids FROM userData WHERE user_id =?`;
            var pd_query = `SELECT * FROM productData where prod_id =?`;
            user_data = await get_user_data_async(userid, user_query);
            product_data_array = await get_product_data_async(user_data.watched_product_ids, pd_query);
        }
        catch (err) {
            return console.error(err);
        }
        console.log(product_data_array);
        console.log("^ pd array");
        var pd_array_json = JSON.stringify(product_data_array);
        return res.render('profile', {title: 'YOUR PROFILE', userid:user_data.userid, username:user_data.username, email:user_data.email, prod_data:pd_array_json});
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
    var userid = req.user.user_id;
    var url = req.body.prod_link;//'https://www.amazon.co.uk/AKORD-Metal-Binder-Clip-Clamp/dp/B0082JFX1M';
    console.log("the given url is", url);
    // console.log(url);
    var scraper_returner = await scraper.callScraper(url);
    URLcode = scraper_returner[0];
    var prod_id = scraper_returner[1];
    var user_data = await get_user_data_async(userid, `SELECT watched_product_ids FROM userData WHERE user_id =?`);
    var watched_ids = user_data.watched_product_ids;
    // console.log(URLcode);
    if(URLcode!=1){
        res.redirect('/login');
    }else{
        console.log("product id is", prod_id);
        watched_ids = watched_ids + "," + prod_id;
        db.run(`UPDATE userData SET watched_product_ids = ? WHERE user_id=?`, [watched_ids,userid], function(err) {
            if (err) {
                return // console.log(err.message);
            }
            // console.log('SUCCESS');
            res.redirect('/login');
        });
    }
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

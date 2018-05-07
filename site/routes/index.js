var express = require('express');
var router = express.Router();

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/users.db');

//initialise table
//db.run('CREATE TABLE userData(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,username TEXT, email TEXT, password TEXT)');// --- INITIAL TABLE HAS BEEN MADE

//output names to server
db.serialize(function() {
  db.each(`SELECT Name as name,
                  Username as username,
                  Email as email
              FROM userData`, (err, row) => {
      if (err) {
          console.error(err.message);
      }
      console.log(row.id + "\t" + row.name + "\t" + row.username + "\t" + row.email);
  });
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Form Validation', success: req.session.success, errors:req.session.errors});
  req.session.errors=null;
  req.session.success=null;
});

router.post('/sumbit', function(req,res,next){
  req.check('name', 'Name too short').isLength({min:2});
  req.check('username', 'Username must be more than 4 characters').isLength({min:4});
  req.check('email', 'Invalid email').isEmail();
  req.check('password', 'Password must be more than 4 characters').isLength({min:4}).equals(req.body.password2);

  var errors = req.validationErrors();
  if(errors){
    req.session.errors = errors;
    req.session.success = false;
    console.log('FAIL');

  } else{
    req.session.success =true;
    console.log('SUCCESS');
    console.log(req.body.username);
    db.run(`INSERT INTO userData(name,username,email,password) VALUES(?,?,?,?)`, [req.body.name],[req.body.username],[req.body.email],[req.body.password], function(err) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id
      console.log(`A row has been inserted with rowid ${this.lastID}`);
      db.close();
    });
  }
  res.redirect('/');
});




/*router.get('/test/:id', function(req,res,next){
  res.render('test', {output: req.params.id});
});

router.post('/test/submit', function(req,res,next){
  var id = req.body.id;
  res.redirect('/test/' + id);
;})*/


module.exports = router;

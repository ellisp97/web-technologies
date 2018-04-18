

//-----------------------------------------me------------------------------------------------------


var fs = require('fs');
var path    = require("path");
var data = fs.readFileSync('products.json');
var products = JSON.parse(data);


//-----------sample sqlite 3 creation-------------------

//------------DELETING-DATA----------------
/*let db = new sqlite3.Database('./db/sample.db', (err) => {
    if (err) {
        console.error(err.message);
    }
});

let id = 1;

db.run(`DELETE FROM langs WHERE rowid=?`, id, function(err){
    if(err){
        return console.error(err.message);
    }
    console.log(`Row(s) deleted ${this.changes}`);
});*/
//------------------------------------------
             

//---------UPDATING-DATA----------------
/*let tabdata = ['Ansi C', 'C'];
let sql  = `UPDATE langs
                SET name = ?
                WHERE name = ?`;

db.run(sql,tabdata,function(err){
    if(err){
        return console.error(err.message);
    }
    console.log(`Row(s) updated: ${this.changes}`);
});*/
//------------------------------------------

//---------INSERTING-ROWS----------------
/*let languages = ['C', 'C++', 'C#', 'Haskell', 'Python'];
let placeholders = languages.map((language) => '(?)').join(',');
let sql = 'INSERT INTO langs(name) VALUES' +placeholders;

console.log(sql);

db.run(sql,languages, function(err){
    if(err){
        return console.log(err.message);
    }
    console.log(`Rows inserted ${this.changes}`);
});*/
//------------------------------------------

//---------LOGGING-DATA-FROM-TABLE----------------
/*let sql = `SELECT FirstName firstName,
                  LastName lastName,
                  Email email
            FROM customers
            WHERE Country = ?
            ORDER BY FirstName`;
db.each(sql,['USA'], (err,row) =>{
    if(err){
        throw err;
    }
    console.log(`${row.firstName} ${row.lastName} - ${row.email}`);
});*/
//------------------------------------------


//---------LOGGING-DATA-FROM-ONE-ROW----------------
/*db.get(sql, [playlistId], (err,row)=>{
    if (err){
        return console.error(err.message);
    }
    return row
        ? console.log(row.id, row.name)
        : console.log(`No playlist found with the id ${playlistId}`);
});*/
//------------------------------------------


//-----------------------------------------------

console.log(products);

var express = require('express');
let util = require('util');
var bodyParser = require('body-parser');
var path = require('path');
var expressValidator=require('express-validator');

var app = express();

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/users.db',sqlite3.OPEN_READONLY);
//db.run('CREATE TABLE userData(name TEXT,username TEXT, email TEXT, password TEXT)');// --- INITIAL TABLE HAS BEEN MADE


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


//--reloading page--
var logger = function(req,res,next){
    console.log('Logging....');
    next();
}
app.use(logger);
//------------------

//--view-engine
app.set('view engine', 'ejs');
app.set('views',path.join(__dirname, 'views'));

//--body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//--set static path
app.use(express.static(path.join(__dirname, 'public')));

//--global-vars -- e.g. errors
app.use(function(req,res,next){
    res.locals.errors = null;
    next();
});

//--verification--ctavan -express-validator -------
app.use(expressValidator({
    errorFormatter: function(param,msg,value) {
        var namespace = param.split('.')
        , root = namespace.shift()
        , formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg : msg,
            value: value
        };
    }
}));
//----------------------------------

/*var users = [
    {
        first_name: 'Bob',
        last_name:  'Joe',
        email:      'bobj@gmail.com',
    },
    {
        first_name: 'tooe',
        last_name:  'uig',
        email:      'to29bj@gmail.com', 
    }
]*/

app.get('/hi',function(req,res){
    res.render('index',{
        //title: 'Customers'.data,
        //users: users
    });
});

const { body,validationResult } = require('express-validator/check');

app.post('/users/add', function(req,res,next){

    body('name','Name is Required').notEmpty;
    body('username','Username is Required').notEmpty;
    body('email','email is Required').notEmpty;
    body('password','password is Required').notEmpty;
    body('password2','password is Required').notEmpty;

    // deals with error handling here , ideal if correct error message could be printed
    //https://github.com/ctavan/express-validator#validation-result-api

    // EDIT I HAVE NO IDEA WHY THISISNT WORKING VALIDATION ISNT WORTH THIS 
    // IM GOING TO ACCEPT EVERYTHING FOR NOW
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        console.log('ERROR');
        res.render('index', {
            //title: 'Customers',
            //users:  users,
            errors: errors
        });
        response.json({
            result: "failed",
            message: 'Validation Errors: ${util.inspect(validationResult.array())}'
        });
    } else {
        var newUser = {
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            password2: req.body.password2
        }
        console.log('SUCCESS');
        console.log(newUser);
        res.render('index', {
            //title: 'Customers',
            //users:  users,
        });
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
});

app.listen(3000,function(){
    console.log('Server Started on Port 3000 ....');
});

app.get('/',function(req,res){
    res.sendFile(path.join(__dirname+'/public/index.html'));
});

app.get('/login',function(req,res){
    res.sendFile(path.join(__dirname+'/public/login.html'));
});


























app.get('/add/:product/:price?', addProduct);

function addProduct(request,response){
    var data = request.params;
    var product = data.product;
    var price = Number(data.price);


    if(!price) {
        var reply = {
            msg : "Price is Needed"
        }
        response.send(reply);

    } else {
        products[product] = price;
        var data = JSON.stringify(products, null, 2);
        fs.writeFile('products.json', data, finished);

        function finished(err) {
            console.log('all good');
        }

        reply = {
            product: product,
            price: price,
            msg: "thanks for the product"
        }
        response.send(reply);
    }

}

app.get('/all',sendAll);

function sendAll(request,response){
    response.send(products);
}

app.get('/search/:product/', searchProduct);

function searchProduct(request,response){
    var product = request.params.product;
    var reply;
    if(products[product]){
        reply= {
            status: "found",
            product: product,
            price: products[product]
        }
    } else {
        reply = {
            status: "not found",
            product:product
        }
    }
    response.send(reply);
}


//----------------------------------------------------------------------------------------------

//start();

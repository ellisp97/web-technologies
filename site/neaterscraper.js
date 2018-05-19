"use strict"
var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    express = require('express'),
    router = express.Router(),
    passport = require('passport');
var URLmatch = false;
var URLworks = true; 
var exitCode = 1; //return 0 if product is already in db
// return 1 if product works and is not exisiting , return -1 if product could not be found

// var url = "http://www.asos.com/pullbear/pullbear-hoodie-in-black/prd/8828973?clr=black&SearchQuery=&cid=5668&gridcolumn=4&gridrow=6&gridsize=4&pge=1&pgesize=72&totalstyles=1379";
// var url = "http://www.asos.com/new-balance/new-balance-501-trainers-in-blue/prd/8691396";
// var url = "https://www.amazon.co.uk/Maxwell-Williams-Porcelain-William-Strawberry/dp/B00THEAN3E/ref=sr_1_3?ie=UTF8&qid=1526403589&sr=8-3&keywords=mug";
// var url = "https://www.amazon.co.uk/AKORD-Metal-Binder-Clip-Clamp/dp/B0082JFX1M/ref=sr_1_5?s=officeproduct&ie=UTF8&qid=1526309936&sr=1-5&keywords=binder+clips";




var domains_and_id_precede = [{domain:"amazon", id_precede:"/dp/"},
                              {domain:"asos",   id_precede:"/prd/"}];

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/users.db');
//initialise table
// db.run('CREATE TABLE productData(prod_id text, prod_name text, prod_link text, prod_domain integer, prod_currency text, prod_price_history text, prod_price_current integer, date_added text, date_update_history text)');
// --- INITIAL PRODUCT TABLE HAS BEEN MADE

//an asynchronous databse get function https://gist.github.com/yizhang82/26101c92faeea19568e48224b09e2d1c
db.getAsync = function (sql) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.get(sql, function (err, row) {
      if(err){
        reject(err);
      } else{
        resolve(row);
      }
    });
  });
};

//an async db run func
db.runAsync = function(sql, data) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.run(sql, data, function(err) {
      if(err){
        reject(err);
      } else{
        console.log("no run error");
        resolve();
      }
    });
  });
};

//an async db all func
db.allAsync = function (sql, params) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.all(sql, params, function (err, rows) {
      if (err)
        reject(err);
      else
        resolve(rows);
    });
  });
};


function find_domain_and_id(url) {
  var id, domain;
  let i = 0;
  while(!url.includes(domains_and_id_precede[i].domain)){
    i+=1;
    console.log(i);
    console.log(domains_and_id_precede.length);
    if(i >= domains_and_id_precede.length){
      console.log("domain unsupported at this time");
      exitCode = -1;
      return false;
    }
  }
  var product_id_possible = url.split(domains_and_id_precede[i].id_precede)[1];

  var product_id_end = product_id_possible.indexOf("/");
  if(product_id_end != -1) {
    //if the slash exists, the id is between the start of the substring and the slash
    id = product_id_possible.substring(0, product_id_end);
  }else{
    //if the slash doesn't exist, look for a question mark
    product_id_end = product_id_possible.indexOf("?");
  }
  if(product_id_end != -1) {
    //if the ? exists, the id is between the start of the substring and the ?
    id = product_id_possible.substring(0, product_id_end);
  }else{
    //if the ? doesn't exist, look for a . (e.g. .html)
    product_id_end = product_id_possible.indexOf(".");
  }if(product_id_end != -1) {
    //if the . exists, the id is between the start of the substring and the .
    id = product_id_possible.substring(0, product_id_end);
  }else{
    //if none of the above exists, the end of the url is the end of the uniqueID
    id = product_id_possible;
  }
  return [id, i];
};


async function check_if_id_in_db_already(url, id, domain){
  var query = `SELECT prod_id id, prod_domain domain from productData WHERE prod_id = ?`;
  var rows = await db.allAsync(query, [id]);
  if (!Array.isArray(rows) || !rows.length) {
    //ID does not exist, continues as before
    URLmatch = false;
    return URLmatch;
  } else{
    //ID exists in the database, beware
    for(let row of rows){
      console.log(row);
      if(row.domain == domain){
        console.log("THIS ID IS ALREADY IN THE DATABASE WITH ITS DOMAIN");
        URLmatch = true;
        return URLmatch;
      }
    };
  }
};

function scraper(url_param, id, domain){
  var price_num, price, currency, title;
  var options = url_param;
  var price_htmls = ['span#priceblock_ourprice', '#product-price'];
  var title_htmls = ['span#productTitle', 'h1'];

  //ASOS needs an API call
  if(domain == "1") {
    var url_read = "http://api.asos.com/product/catalogue/v2/products/" + id + "?store=COM";
    options = {
      url: url_read,
      method : 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };
  }
  console.log("about to request");

  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      console.log("in request");
      if(error){
        exitCode = -1;
        console.log(error);
        reject(error);
      }else if(response.statusCode != 200){
        //LINK DID NOT MATCH A PRODUCT
        URLworks = false;
        exitCode = -1;
        console.log(response.statusCode);
        reject(error);
      } else {
        //handle ASOS with an API call
        if(domain == 1){
          let json = JSON.parse(body);
          console.log(json.price.current.value);
          price_num = Number(json.price.current.value);
          if(json.price.currency == "GBP"){
            currency = "£ pence"
          }
          if(json.price.currency == "EUR"){
            currency = "€ cents"
          }
          if(json.price.currency == "USD"){
            currency = "$ cents"
          }
          title = json.name;
        }//handle all other sites normally
        else {
          //load the html
          var $ = cheerio.load(body);
          //find the html element where the price is located
          $(price_htmls[domain]).each(function(i, element) {
            //grab the text
            var el = $(this);
            var price_text = el.text();
            //separate off the currency
            if(price_text[0] == "£"){
              price = price_text.split("£")[1];
              currency = "£ pence";
            }
            if(price_text[0] == "$"){
              price = price_text.split("$")[1];
              currency = "$ cents";
            }
            if(price_text[0] == "€"){
              price = price_text.split("€")[1];
              currency = "€ cents";
            }
            //save the price as a number
            price_num = Number(price);
          });

          //find the html element where the title is located
          $(title_htmls[domain]).each(function(i, element) {
            //separate off the text
            var el = $(this);
            var title_text = el.text();
            //in the case of Amazon, remove the extraneous whitespace
            if(domain == 0) {
              title = title_text.trim();
            }else {
              title = title_text;
            }
          });
        }
      }
      var price_int = Number(Math.round(price_num*100));
      var returner = [price_int, title, currency];
      resolve(returner);
    });
  });
};


async function insert_new_product(id, title, url, domain, currency, price){
    //grab the time
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

    console.log(date);

    console.log("inserting the following id, name, currency, price and date:");
    console.log("%s\t%s\t%s\t%d\t%s", id, title, currency, price, date);

    let query = `INSERT INTO productData (prod_id,prod_name,prod_link,prod_domain,prod_currency,prod_price_history,prod_price_current,date_added,date_update_history) VALUES(?,?,?,?,?,?,?,?,?)`;
    let data = [id,title,url,domain,currency,price,price,date,date];
    console.log(data);
    await db.runAsync(query, data);
    console.log("inserted");
};

module.exports = {
  callScraper : async function (url){
    try{
      console.log('start of scraping');
      let domain_id = find_domain_and_id(url);
      if(domain_id){
        let id = domain_id[0];
        let domain = domain_id[1];
        let exists = await check_if_id_in_db_already(url, id, domain);
        if(!exists){
          var price_data = await scraper(url, id, domain);
          
          let price = price_data[0];
          let title = price_data[1];
          let currency = price_data[2];
          await insert_new_product(id, title, url, domain, currency, price);
        }
        if(exists){
          console.log('Match Occured');
          exitCode = 0;
        }
        if(exitCode!=-1){
          await db.all(`SELECT * from productData`, [], (err, rows) => {
            if (err) {
              return console.error(err.message);
            }
            rows.forEach((row) => {
              // console.log(row);
            });
          });
        db.close();
        }
      }
      return exitCode;
    }
    catch (e) {
      console.log("error");
      console.log(JSON.stringify(e));
    }
  }
};
//main(url);

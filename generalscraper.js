"use strict"
var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    url = "http://www.asos.com/new-balance/new-balance-501-trainers-in-blue/prd/8691396";

var url_endings = [".co.uk", ".com", ".net", ".org"];
var supported_domains = ["amazon", "asos"];
var domain_id_precede = ["/dp/", "/prd/"];

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/prices.db');
//initialise table
// db.run('CREATE TABLE productData(prod_id text, prod_name text, prod_link text, prod_domain text, prod_currency text, prod_price_history text, prod_price_current real, date_added real, date_updated real)');
// --- INITIAL PRODUCT TABLE HAS BEEN MADE



function scrape_and_insert(url_param, id, domain){
  var options = url_param;
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

  request(options, function(error, response, body) {

    if(error){
      console.log(error);
    }

    if(response.statusCode != 200){
      console.log(response.statusCode);
    }

    var price;
    var price_num;
    var currency;
    var title;

    var price_htmls = ['span#priceblock_ourprice', '#product-price'];
    var title_htmls = ['span#productTitle', 'h1'];

    //handle ASOS with an API call
    if(domain == "1" && !error && response.statusCode == 200){
      let json = JSON.parse(body);
      console.log(json.price.current.value);
      price_num = Number(json.price.current.value);
      if(json.price.currency == "GBP"){
        currency = "£"
      }
      if(json.price.currency == "EUR"){
        currency = "€"
      }
      if(json.price.currency == "USD"){
        currency = "$"
      }
      title = json.name;
    }
    //handle all other sites normally
    else if (!error && response.statusCode == 200) {
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
          currency = "£";
        }
        if(price_text[0] == "$"){
          price = price_text.split("$")[1];
          currency = "$";
        }
        if(price_text[0] == "€"){
          price = price_text.split("€")[1];
          currency = "€";
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
    //grab the time
    var current_time = Date.now();

    //polyfill for date.now;
    // if (!Date.now) {
    //   Date.now = function now() {
    //     return new Date().getTime();
    //   };
    // }

    console.log("inserting the following id, name, currency, price and time:");
    console.log("%s\t%s\t%s\t%d\t%d", id, title, currency, price_num, current_time);
    db.run(`INSERT INTO productData (prod_id,prod_name,prod_link,prod_domain,prod_currency,prod_price_history,prod_price_current,date_added,date_updated) VALUES(?,?,?,?,?,?,?,?,?)`, [id,title,url_param,domain,currency,price_num,price_num,current_time,current_time], function(err) {
      if (err) {
        return console.log(err.message);
      }
    });

    db.all(`SELECT * from productData`, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      }
      rows.forEach((row) => {
        console.log(row);
      });
    });
  });
};


var id, i, domain;
for (i = 0; i < supported_domains.length; i++) {
  var supported_domain_index = url.search(supported_domains[i]);
  if(supported_domain_index != -1){
    domain = supported_domains[i];
    break;
  }
}
if (supported_domain_index == -1){
  console.log("domain unsupported at this time");
}
//find the part of the url preceding the uniqueID
var product_id_start = url.search(domain_id_precede[i]) + domain_id_precede[i].length;
//find the substring of the url from the start of the uniqueID to the end of the url
var product_id_possible = url.substring(product_id_start);
//look for a slash in the substring
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

var query = `SELECT prod_id id, prod_domain domain from productData WHERE prod_id = ?`;

db.all(query, [id], (err, rows) => {
  if (err) {
    return console.log(err.message);
  }
  if (!Array.isArray(rows) || !rows.length) {
    //ID does not exist, continues as before
    scrape_and_insert(url, id, i);
    console.log("scraped");
  } else{
    //ID exists in the database, beware
    rows.forEach((row) => {
      console.log(row);
      if(row.domain == supported_domains[i]){
        console.log("THIS ID IS ALREADY IN THE DATABASE WITH ITS DOMAIN");
        db.close();
      }
    });

  }
});

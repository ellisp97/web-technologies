"use strict"
var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    url = 'https://www.amazon.co.uk/AKORD-Metal-Binder-Clip-Clamp/dp/B0082JFX1M';

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/prices.db');
//initialise table
// db.run('CREATE TABLE productData(prod_id integer, prod_name text, prod_currency text, prod_price real)');
// --- INITIAL PRODUCT TABLE HAS BEEN MADE

var id = 0;

request(url, function(error, response, html) {

  var price;
  var price_num;
  var currency;
  var title_text;

  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);
    $('span#priceblock_ourprice').each(function(i, element) {
      var el = $(this);
      var price_text = el.text();
      //TODO: add error checking for the database and currency type
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
      price_num = Number(price);
      console.log(price_num);

      // fs.writeFile('price.json', JSON.stringify(json, null, 4), function(err) {
      //   console.log('Price saved in price.json file');
      // });
    });

    $('span#productTitle').each(function(i, element) {
      var el = $(this);
      title_text = el.text();
    });

    let sql = `SELECT prod_id FROM productData`
    id += 1;

    db.run(`INSERT INTO productData (prod_id,prod_name,prod_currency,prod_price) VALUES(?,?,?,?)`, [id,title_text,currency,price], function(err) {
      if (err) {
        return console.log(err.message);
      }
    });
  }
});

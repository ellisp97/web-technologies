"use strict"
var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    url = 'https://www.amazon.co.uk/Maxwell-Williams-Porcelain-William-Strawberry/dp/B00THEAN3E';

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/prices.db');
//initialise table
// db.run('CREATE TABLE productData(prod_id integer, prod_name text, prod_currency text, prod_price real)');
// --- INITIAL PRODUCT TABLE HAS BEEN MADE

var id = 1;

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

    db.get(`SELECT max(prod_id) as product_id FROM productData`, [], (err, row) => {
      if (err) {
        return console.error(err.message);
      }
      id = row.product_id + 1;
    });

    db.run(`INSERT INTO productData (prod_id,prod_name,prod_currency,prod_price) VALUES(?,?,?,?)`, [id,title_text,currency,price], function(err) {
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
  }
});

"use strict"
var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio');
console.log("shanik says what");
var url = 'https://www.amazon.co.uk/AKORD-Metal-Binder-Clip-Clamp/dp/B0082JFX1M';
request(url, function(error, response, html) {

  var price;
    var json = {
      price: ""
  };

  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);
    $('span#priceblock_ourprice').each(function(i, element) {
      var el = $(this);
      var price = el.text();
      json.price = price;
      // fs.writeFile('price.json', JSON.stringify(json, null, 4), function(err) {
      //   console.log('Price saved in price.json file');
      // });
    })
  }
});

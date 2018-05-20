"use strict"
var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    url = 'http://www.asos.com/pullbear/pullbear-hoodie-in-black/prd/8828973?clr=black&SearchQuery=&cid=5668&gridcolumn=4&gridrow=6&gridsize=4&pge=1&pgesize=72&totalstyles=1379';

var url_endings = [".co.uk", ".com", ".net", ".org"];
var supported_domains = ["amazon", "asos"];
var domain_id_precede = ["/dp/", "/prd/"];

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/users.db');
//initialise table
// db.run('CREATE TABLE productData(prod_id text, prod_name text, prod_link text, prod_domain text, prod_currency text, prod_price_history text, prod_price_current real, date_added real, date_updated real)');
// --- INITIAL PRODUCT TABLE HAS BEEN MADE

//we use asynchronicity for our callbacks, to wait until functions are finished, and link them together

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
        console.log(`Row(s) updated: ${this.changes}`);
        resolve();
      }
    });
  });
};

//an async db all func
db.allAsync = function (sql) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.all(sql, function (err, rows) {
      if (err)
        reject(err);
      else
        resolve(rows);
    });
  });
};

//this function is asynchronous so that it can wait and be waited on
//it looks through the db and queries another async function to find which
//have different live prices
async function get_changed_ids_prices() {
  var ids_and_data_to_update = [];
  var live_price;
  var get_query = `SELECT * FROM productData`;
  var rows = await db.allAsync(get_query);
  //wait until all rows are gotten
  if(!rows){
    console.log("No rows in productData"); //if there is a problem
  }
  else {
    //we have to use the modern for..of because we are using await
    for (let row of rows) {
      //wait until the request has fetched the live price
      live_price = await check_price(row.prod_link, row.prod_id, row.prod_domain);
      if(live_price != row.prod_price_current) {
          if(live_price == null && row.prod_price_current == null){}
          else{
              ids_and_data_to_update.push({id:row.prod_id, price:live_price, history:row.prod_price_history, dates:row.date_update_history});
              //if it is not the same as the current, store it
          }
      }
    };
  }
  return ids_and_data_to_update;
};

//async so that it can wait for the db to update and can be waited on
//the function just updates the database by searching it using the ids passed
async function update_prices(ids_data) {
  var update_query = `UPDATE productData
                      SET prod_price_current = ?, prod_price_history = ?, date_update_history = ?
                      WHERE prod_id = ?`;
  //again we must use the for..of
  for(let prod_data of ids_data) {
    let id = prod_data.id;
    let price = prod_data.price;
    let history = prod_data.history;
    let date_history = prod_data.dates;
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    history = history + "," + String(price);
    date_history = date_history + "," + date;
    let data = [price, history, date_history, id];
    console.log(`price updated, data used is ${data}`);
    await db.runAsync(update_query, data);
    //wait until the db has finished updating
  };
};

//this func uses a promise so that it can be used with asynchronicity
//it implements the http request to find the live price
function check_price(url_param, id, domain){
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
  var price_num, price_int;

  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      var price;
      var price_htmls = [{standard: 'span#priceblock_ourprice', sale: 'span#priceblock_saleprice', book_sale: 'span.a-size-medium.a-color-price.offer-price.a-text-normal'}, '#product-price'];
      var title_htmls = ['span#productTitle', 'h1'];
      if(error){ //if error, reject
        console.log("error in http request");
        reject(error);
      } //if the response status code is erroneous, reject
      else if(response.statusCode != 200) {
        console.log(`response status code was different, ${response.statusCode}`);
        reject(response.statusCode);
      }//otherwise there are no errors in the request
      else {
        //handle ASOS with an API call
        if(domain==1){
          let json = JSON.parse(body);
          price_num = Number(json.price.current.value);
        }//handle all other sites normally
        else{
          //load the html
          var $ = cheerio.load(body);
            var html_use
            if(domain==0){
                if($(price_htmls[domain].standard).length){
                    html_use = price_htmls[domain].standard;
                } else if($(price_htmls[domain].sale).length){
                    html_use = price_htmls[domain].sale;
                } else if($(price_htmls[domain].book_sale).length){
                    html_use = price_htmls[domain].book_sale;
                } else{
                    console.log("no price found for id" + id);
                    resolve(null);
                }
            }
            else{
                html_use = price_htmls[domain];
            }
          //find the html element where the price is located
          $(html_use).each(function(i, element) {
            //grab the text
            var el = $(this);
            var price_text = el.text();
            //separate off the currency
            price = price_text.split(price_text[0])[1];
            //save the price as a number
            price_num = Number(price);
          });
        }
        if(isNaN(price_num)){
          console.log("the price is not a number");
          resolve(null);
        }
        price_int = Number(Math.round(price_num*100));
        resolve(price_int);
        //resolve the promise with the live price
      }
    });
  });
};

//a main function to tie it together
async function main() {
  try {
    var id_data = await get_changed_ids_prices();
    console.log(id_data);
    //use the chained async functions to get the data to update
    //wait for it to complete
    await update_prices(id_data);
    //update the database, wait for it to complete
    db.close();
  }
  catch (e) {
    console.log("error");
    console.log(e);
  }
}

main();

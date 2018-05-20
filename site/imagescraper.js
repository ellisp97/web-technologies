"use strict"
var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    util = require('util');
// var url = "https://www.amazon.co.uk/AKORD-Metal-Binder-Clip-Clamp/dp/B0082JFX1M/ref=sr_1_5?s=officeproduct&ie=UTF8&qid=1526309936&sr=1-5&keywords=binder+clips";

var domains_and_id_precede = [{domain:"amazon", id_precede:"/dp/"},
                              {domain:"asos",   id_precede:"/prd/"}];

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/users.db');

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



function img_scraper(url_param){
    var domain;
    for(var i=0; i<domains_and_id_precede.length; i++){
        if(url_param.includes(domains_and_id_precede[i].domain)){
            domain = i;
        }
    }
    var options = url_param;
    //ASOS needs a spoofed user agent
    if(domain == "1") {
      options = {
        url: url_param,
        method : 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      };
    }
    // var img_htmls = ['div#imgTagWrapperId'];
    var img_htmls = ['img#landingImage', 'div.product-gallery-static'];
    var returnImg;
    return new Promise(function(resolve, reject) {
      request(options, function(error, response, body) {
        console.log("in request");
        if(error){
          exitCode = -1;
          console.log(error);
          reject(error);
        }else if(response.statusCode != 200){
          //LINK DID NOT MATCH A PRODUCT
          console.log(response.statusCode);
          reject(error);
        }
        //load the html
        var $ = cheerio.load(body);
        // console.log($);
        //find the html element where the price is located
        console.log(domain);
        $(img_htmls[domain]).each(function(i, element) {
          // returnImg = $(element).find('img').attr("src");
          if(domain == 0){
            returnImg = JSON.parse($(element).attr('data-a-dynamic-image'));
            console.log('CHECK IMAGES IS RIGHT ', returnImg);

            // this is all the image sizes from amazon
            for(var key in returnImg){
              returnImg = key;
              console.log("img", returnImg);
              break;
            }
          }
          else {
            returnImg = $(element).find('img').attr("src");
            console.log('CHECK asos IMAGES IS RIGHT ', returnImg);
          }
          // grab the text
          // var el = $(this);
          // var img_text = el.text();
        });
      });
      var returner = returnImg;
      resolve(returner);
    });
};

module.exports = {
  callImgScraper : async function (url){
    var image_url;
    try{
      console.log('start of image scraping');
      console.log('CHECK URL IS RIGHT ', url);
      let image_id = await img_scraper(url);
      image_url = image_id
    } catch (e) {
      console.log("error");
      console.log(e);
      console.log(JSON.stringify(e));
    }
    console.log(image_url);
    return image_url;
  }
};
//main(url);

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

async function take_params_request_image(options, domain, htmls) {
    var image_url;
    request(options, function(error, response, body) {
        console.log("in request");
        if(error){
            exitCode = -1;
            console.log(error);
            throw new Error();
        }else if(response.statusCode != 200){
            //LINK DID NOT MATCH A PRODUCT
            console.log(response.statusCode);
            throw new Error();
        }
        //load the html
        var $ = cheerio.load(body);
        // console.log($);
        //find the html element where the price is located
        console.log(domain);
        $(htmls[domain]).each(function(i, element) {
            // returnImg = $(element).find('img').attr("src");
            if(domain == 0){
                image_url = $(element).attr('data-a-dynamic-image');
                console.log('CHECK IMAGES IS RIGHT ', image_url);
                var url = image_url.split(".jpg")[0];
                url = url.slice(2);
                url += ".jpg";
                console.log(url);
                image_url = url;
                // // this is all the image sizes from amazon
                // for(var key in image_url){
                //     image_url = key;
                //     console.log("img", image_url);
                //     break;
                // }
            }
            else {
                image_url = $(element).find('img').attr("src");
                console.log('CHECK asos IMAGES IS RIGHT ', image_url);
            }
        });
    });
    return image_url;
}


async function img_scraper(url_param){
    console.log("url given is", url_param);
    var domain, returnImg;
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
    try {
        console.log("hi");
        return await take_params_request_image(options, domain, img_htmls);
    } catch (e) {
        throw new Error();
    }
};

module.exports = {
    callImgScraper : async function (url){
        var image_url;
        try{
            console.log('start of image scraping');
            console.log('CHECK URL IS RIGHT ', url);
            return await img_scraper(url);
        } catch (e) {
            console.log("error");
            console.log(e);
            console.log(JSON.stringify(e));
            return null;
        }
    }
};
//main(url);

"use strict";
// addEventListener('load', carousel);
// var select = document.getElementById("select"),
// arr = ["dfsghrtr","werwth","dfsgsh","ewrth"];
//
// for (var i=0; i<arr.length; i++){
//     var option = document.createElement("OPTION"),
//         txt = document.createTextNode(arr[i]);
//     option.appendChild(txt);
//     select.insertBefore(option,select.lastChild);
// }

var urls_JSON = document.getElementById('logged-in-script').getAttribute('data-urls');
var urls_and_names = JSON.parse(urls_JSON);
var urls_and_names_not_null = [];
var urls_and_names_null = [];
var counter = 0;
var current;
var amount;

for(var i=0; i<urls_and_names.length; i++){
    if(urls_and_names[i].prod_name != null && urls_and_names[i].image_link != null){
        urls_and_names_not_null.push(urls_and_names[i]);
    } else{
        urls_and_names_null.push(urls_and_names[i]);
    }
}

function emptyCarousel(carousel_container) {
    while(carousel_container.firstChild){
        carousel_container.removeChild(carousel_container.firstChild);
    }
}

function createCarouselElement(url, alt, id){
    var car_el = document.createElement('div');
    car_el.className = "carousel-element";
    car_el.id = "carousel-el-" + id;
    car_el.innerHTML = "<img src=" + "'" + url + "' alt='" + alt + "' />";
    return car_el;
}

function create_option(id, text){
    var new_option = document.createElement('option');
    new_option.setAttribute('value', id);
    new_option.id = 'carousel-select-option-' + id;
    new_option.innerHTML = text;
    return new_option;
}

function populate_carousel_and_select(urls_and_names_not_null, urls_and_names_null, carousel_container, select){
    var i;
    for(i=0; i<urls_and_names_not_null.length; i++){
        var url = urls_and_names_not_null[i].image_link;
        var name = urls_and_names_not_null[i].prod_name;
        var carousel_element = createCarouselElement(url, name, i);
        carousel_container.appendChild(carousel_element);
        var carousel_option = create_option(i, name);
        select.appendChild(carousel_option);
    }
    for(var j=0;j<urls_and_names_null.length;j++){
        var name = urls_and_names_null[j].prod_name;
        var carousel_option = create_option(i+j, name);
        select.appendChild(carousel_option);
    }
    items = container.querySelectorAll('.carousel-element');
    current = items[0];
    items[0].classList.add('current');
    amount = items.length;
    console.log(items);
}

/*
The below function moves the 'current' class to the next or previous element
(or does nothing at all if direction = 0)
*/
function navigate(movenum) {
    current.classList.remove('current'); //remove the current class from the current element
    counter = (counter + movenum + amount) % amount; //move a certain number forward or backward (modulo for wraparound)
    current = items[counter]; //update the current variable to be the next or previous item
    current.classList.add('current'); //add the current class to this element
}

function unloadScrollBars() {
  document.documentElement.style.overflow = 'hidden';  // firefox, chrome
  document.body.scroll = "no"; // ie only
}

function create_product_table_entry(row, id){
    var trow = document.createElement('tr');
    trow.id = "table-row-" + id;
    trow.className = "table-row-active";
    var td_name = document.createElement('td');
    td_name.className = "table-name";
    var td_price = document.createElement('td');
    td_price.className = "table-price";
    var name = row.prod_name;
    var prod_url = row.prod_link;
    var currency = row.prod_currency;
    var price = row.prod_price_current;
    if(price==null){
        price = "No price currently available";
    } else{
        price = (price/100).toFixed(2);
        price = currency[0] + price;
    }
    td_name.innerHTML = "<a href ='" + prod_url + "'>" + name + "</a>";
    td_price.innerHTML = price;
    trow.appendChild(td_name);
    trow.appendChild(td_price);
    return trow;
}

function create_product_table(urls_and_names_not_null, urls_and_names_null, container){
    var table = document.createElement('table');
    var thead = document.createElement('thead');
    var tbody = document.createElement('tbody');
    var headingrow = document.createElement('tr');
    var heading1 = document.createElement('th');
    var heading2 = document.createElement('th');
    var i;
    var trows_array = [];
    heading1.innerHTML = "Product Name (click to be sent to the link)";
    heading2.innerHTML = "Current Product Price";
    headingrow.appendChild(heading1);
    headingrow.appendChild(heading2);
    thead.appendChild(headingrow);
    table.appendChild(thead);
    tbody.id = "carousel-table-body";
    for(i=0; i<urls_and_names_not_null.length; i++){
        var row = create_product_table_entry(urls_and_names_not_null[i], i);
        if(i<5){
            tbody.appendChild(row);
        }
        trows_array.push(row);
    }
    for(var j=0; j<urls_and_names_null.length; j++){
        var row = create_product_table_entry(urls_and_names_null[j], i+j);
        if(i+j<5){
            tbody.appendChild(row);
        }
        trows_array.push(row);
    }
    table.appendChild(tbody);
    container.appendChild(table);
    return trows_array;
}

var carousel_select = document.getElementById('carousel-select');
var content_container = document.getElementById('carousel_content_container');
var container = document.querySelector('.carousel-container');
var table_container = document.querySelector('.carousel-text');
var items = container.querySelectorAll('.carousel-element');
var next = container.querySelector('.next');
var prev = container.querySelector('.prev');
emptyCarousel(content_container);
populate_carousel_and_select(urls_and_names_not_null, urls_and_names_null, content_container, carousel_select);
var trows_array = create_product_table(urls_and_names_not_null, urls_and_names_null, table_container);

next.addEventListener('click', function(ev) { //listen for a click event on the next button
    navigate(1); //navigate to the next element in the carousel
});

prev.addEventListener('click', function(ev) {
    navigate(-1); //navigate to the previous element in the carousel
});

carousel_select.onchange = function(){
    var element = Number(document.getElementById('carousel-select').value);
    console.log("selected element number", element);
    if(element < urls_and_names_not_null.length){
        var num = -counter + element;
        navigate(num);
    }

    var table_body = document.getElementById("carousel-table-body");
    console.log(table_body);
    console.log(table_body.childNodes);
    console.log(trows_array[element]);
    if(table_body.contains(trows_array[element])){
        console.log("yeah", trows_array[element].rowIndex - 1);
        table_body.removeChild(table_body.childNodes[trows_array[element].rowIndex - 1]);
        table_body.insertBefore(trows_array[element], table_body.childNodes[0]);
        //move it up to the top
    } else{
        //remove the last element and push the corresponding selected for to be the first
        table_body.removeChild(table_body.lastChild);
        table_body.insertBefore(trows_array[element], table_body.childNodes[0]);
    }
    // var active_rows = table_container.querySelectorAll(".table-row-active");
    // console.log(active_rows);
    // if(active_rows.length >= 5){
    //     active_rows[active_rows.length - 1].className = "table-row-inactive";
    // }
    // console.log(table_container.querySelectorAll(".table-row-active"));
    // var corresponding_table_row = document.getElementById('table-row-' + element);
    // console.log(corresponding_table_row);
    // corresponding_table_row.className="table-row-active";
    // console.log(table_container.querySelectorAll(".table-row-active"));
}

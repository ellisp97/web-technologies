"use strict"
var ctx = document.getElementById("myChart");
var prod_data = document.getElementById("profile-chart-script").getAttribute( "data-prod_data" );
var data_parsed = JSON.parse(prod_data);
const colours = ['#FEA47F', '#25CCF7', '#EAB543','#55E6C1','#CAD3C8','#F97F51','#1B9CFC','#F8EFBA','#58B19F','#2C3A47'];
var active_buttons = [];

var get_day_string = function(date){
  return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
};

var get_last_n_times = function(n, timescale){
  var bins = [];
  var multiplier = 1;
  if(timescale == "Weeks"){
    multiplier = 7;
  }
  for (var j=0; j<n; j++){
    //create a Date object for today
    var day = new Date();
    //create a date object for j timescale ago
    var earlier_day;
    if(timescale == "Months"){
      //j months ago
      earlier_day = (day.setMonth(day.getMonth() - j));
    }else {
      //j days or weeks ago
      earlier_day = (day.setDate(day.getDate() - (j*multiplier)));
    }
    earlier_day = Date(earlier_day);
    //turn it into a string following our convention
    var day_string = get_day_string(day);
    //append it to the bins
    bins.push(day_string);
  }
  //reverse the bins so that the most recent date is at the end
  bins = bins.reverse();
  return bins
};

var get_date_n_times_ago = function(n, timescale){
  var day = new Date();
  //date object for today at midnight
  day = new Date(day.setHours(0,0,0));
  //will hold date object for today - n times
  var n_times_ago;
  var multiplier = 1;
  if(timescale=="Months"){
    //take the current day at midnight, take n off of its months and set that to a new Date
    n_times_ago = new Date(day.setMonth(day.getMonth() - n));
  } else {
    if(timescale=="Weeks"){
      multiplier = 7;
    }
    n_times_ago = new Date(day.setDate(day.getDate() - (n*multiplier)));
  }
  return n_times_ago;
};

var cutoff_date_array_at_time = function(n, timescale, date_array){
  //date array must be ascending in date (2 days ago, yesterday, today)
  //values must be Date objects
  var cutoff_date_array;
  var cutoff = false;
  var n_times_ago = get_date_n_times_ago(n, timescale);
  //go down the array until we find a time that is more than n times ago
  for(var i=date_array.length - 1; i >= 0; i--){
    //date object of the update day we are looking at
    var current_array_date = new Date(date_array[i]);
    //if that date object is before the object for n times ago
    if(current_array_date <= n_times_ago){
      //slice off the elements 0, 1, ..., i leaving only the elements i+1, ..., n
      cutoff_date_array = date_array.slice(i+1);
      cutoff = true;
      break;
    }
  }
  if(!cutoff){
    //if we didn't have to slice the array, the price changes didn't happen
    //before n times ago
    cutoff_date_array = date_array;
  }
  cutoff_date_array.forEach(function(date, index, arr) {
    //turn the date objects back into strings in our convention
    arr[index] = get_day_string(date);
  });
  //return the date array with any dates before n times ago sliced off
  return cutoff_date_array;
};

var prices_at_dates = function(n, timescale, cutoff_dates, prices) {
  //cutoff_dates are the dates of the price changes since n times ago
  //prices are all the price changes
  var slice_num = prices.length - cutoff_dates.length;
  var prices_last_n_times;
  if(slice_num == 0){
    //if we only have a record of n prices and n price changes (i.e.
    //the product was first stored in the last n days), then we prepend null
    //so that we start at the right point
    prices_last_n_times = prices.slice(slice_num);
    prices_last_n_times.unshift(null);
  } else{
    //otherwise we have at least n+1 prices so slice off one more for the
    //historical price
    prices_last_n_times = prices.slice(slice_num - 1);
  }
  //to index the dates
  var dates_index = 0;
  //prices_last_n_times is now the prices associated with each date,
  //and one at the start to give us an initial value
  //so it should be the same length as cutoff_dates + 1

  //we will put the price at each date into this array
  var price_date = new Array(n);
  //the first element of prices_last_n_times is where we start from
  price_date[0] = prices_last_n_times[0];

  for(var i=0; i<n; i++){
    //we put the price n-i times ago into price_date
    var n_i_times_ago = get_date_n_times_ago(n-i, timescale);
    var n_i_1_times_ago = get_date_n_times_ago(n-(i+1), timescale);
    var current_price_change_date = new Date(cutoff_dates[dates_index]);

    if(dates_index == prices_last_n_times.length){
      price_date[i] = prices_last_n_times[dates_index]/100;
    } else{
      //if the next time the price changed is in the interval of our two ticks
      if(n_i_times_ago <= current_price_change_date && current_price_change_date < n_i_1_times_ago){
        dates_index += 1;
      }
      if(prices_last_n_times[dates_index] == null){
        price_date[i] = null;
      } else {
        price_date[i] = prices_last_n_times[dates_index] / 100;
      }
    }
  }
  return price_date;
}

var analyse_product_data = function(prod, last_n_time_strings, timescale){
  //make arrays that contain the dates and prices by splitting at commas
  var date_array = prod.date_update_history.split(",");
  var price_array = prod.prod_price_history.split(",");
  date_array.forEach(function(date, index, arr) {
    //convert the dates to Date objects
    arr[index] = new Date(date);
  });
  //the dates of price changes after n times ago
  var cutoff_price_change_dates = cutoff_date_array_at_time(last_n_time_strings.length, timescale, date_array);

  // var cutoff_indices = [];
  // cutoff_price_change_dates.forEach(function(date) {
  //   cutoff_indices.push(last_n_time_strings.indexOf(date));
  // });

  var last_n_day_prices = prices_at_dates(last_n_time_strings.length, timescale, cutoff_price_change_dates, price_array);
  return last_n_day_prices;
};

var create_price_changes_and_datasets = function(data_parsed, labels, timescale) {
  //add the price changes in the last n days for each product to the data
  //also specify the datasets for each plot
  var dataset_array = [];
  for(var i=0; i<data_parsed.length; i++){
    data_parsed[i].price_array = (analyse_product_data(data_parsed[i], labels, timescale));
    var dataset = {
      label:data_parsed[i].prod_name + ' (' + data_parsed[i].prod_currency.slice(0, 1) + ')',
      data: data_parsed[i].price_array,
      borderColor: colours[i],
      fill:false,
      lineTension:0
    };
    dataset_array.push(dataset);
  }
  return dataset_array;
}

var truncate_to_five = function(dataset_array){
  //truncate to the first five to plot
  var first_five_datasets = dataset_array
  if(dataset_array.length > 5){
    first_five_datasets = dataset_array.slice(0,5);
  }
  return first_five_datasets;
}

var create_button = function(id, text, dataset){
  var drop_butt = document.createElement('button');
  drop_butt.setAttribute('type', 'button');
  drop_butt.setAttribute('class', 'dropdown-button');
  drop_butt.setAttribute('id', 'button_' + id);
  drop_butt.setAttribute('value', 'OFF');
  drop_butt.innerHTML = text;
  active_buttons.push(false);
  return drop_butt;
};

function dispFunction() {
    var x = document.getElementById("myChart");
    if (x.style.display === "block") {
        x.style.display = "none";
    } else {
        x.style.display = "block";
    }
}

function makeChart(ctx, labels, datasets, n, timescale) {
  Chart.defaults.global.defaultFontFamily = "'Lato', 'Calibri', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
  Chart.defaults.global.defaultFontColor = 'black';
  Chart.defaults.global.defaultFontSize = 18;
  if(timescale!="Days"){
    n-=1;
  }
  var myChart = new Chart(ctx, {
      type: 'line',
      data: {
          // get product genres
          labels: labels,
          datasets: datasets
      },
      options: {
        title: {
          display: true,
          text: "Price over the last " + String(n) + " " + timescale.toLowerCase() + " for products"
        },
        responsive: true,
        scales: {
          yAxes: [{
            ticks :{
              callback: function(tick, index, ticks) {
                return tick.toFixed(2);
              }
            }
          }]
        },
        legend: {
          position: 'bottom'
        }
      }
  });
  return myChart;
}

function update_chart(chart, labels, data_array, n, timescale){
  var datasets_to_plot = [];
  for(var i=0; i < active_buttons.length; i++){
    if(active_buttons[i]){
      datasets_to_plot.push(data_array[i])
    }
  }
  datasets_to_plot = truncate_to_five(datasets_to_plot);
  if(timescale!="Days"){
    n-=1;
  }
  var title = "Price over the last " + String(n) + " " + timescale.toLowerCase() + " for products";
  chart.data.labels = labels;
  chart.data.datasets = datasets_to_plot;
  chart.options.title.text = title;
  chart.update();
  return datasets_to_plot;
}


var select_timescale = document.getElementById("choose-timescale");
var select_numbers = document.getElementById("choose-number");
var timescale_numbers = 31;
for (var i=0; i<timescale_numbers;i++){
  select_numbers.options[select_numbers.options.length] = new Option(i+1, i+1);
  if(i==6){
    select_numbers.selectedIndex = i;
  }
}
var n = select_numbers.value;
var timescale = select_timescale.value;
select_timescale.onchange = function() {
  if(select_timescale.value == "Days"){
    timescale_numbers = 31;
  } else if (select_timescale.value == "Weeks") {
    timescale_numbers = 51;
  } else if (select_timescale.value == "Months") {
    timescale_numbers = 11;
  }
  timescale = select_timescale.value;
  for (var i=select_numbers.options.length - 1; i>=0; i--){
    select_numbers.remove(i);
  }
  for(var i=0; i < timescale_numbers; i++){
    if(timescale!="Days"){
      select_numbers.options[select_numbers.options.length] = new Option(i+1, i+2);
    }
    else{
      select_numbers.options[select_numbers.options.length] = new Option(i+1, i+1);
    }
  }
  if(timescale != "Days"){
    select_numbers.selectedIndex = 0;
  } else if (timescale == "Days") {
    select_numbers.selectedIndex = 6;
  }
};
select_numbers.onchange = function(){
  n = select_numbers.value;
}

//this is the days over which we plot
var labels = get_last_n_times(n, timescale);
var dataset_array = create_price_changes_and_datasets(data_parsed, labels, timescale);
var datasets_to_plot = truncate_to_five(dataset_array)
var chart = makeChart(ctx, labels, datasets_to_plot, n, timescale);

for(var i=0; i<data_parsed.length; i++){
  //also create a button in the dropdown for each possible plot, to show up to 5
  var drop_butt = create_button(String(i), data_parsed[i].prod_name, i);
  if(i < 5){
    drop_butt.setAttribute('value', 'ON');
    active_buttons[i] = true;
  }
  document.getElementById("dropdown_container").appendChild(drop_butt);
  drop_butt.onclick = function() {
    if(this.value == "ON"){
      this.setAttribute('value', 'OFF');
      active_buttons[Number(this.id.slice(-1))] = false;
    }
    else{
      this.setAttribute('value', "ON");
      active_buttons[Number(this.id.slice(-1))] = true;
    }
    datasets_to_plot = update_chart(chart, labels, dataset_array, n, timescale);
  }
}


var redraw_button = document.getElementById('redraw_button');
redraw_button.onclick = function(){
  n = select_numbers.value;
  timescale = select_timescale.value;
  labels = get_last_n_times(n, timescale);
  dataset_array = create_price_changes_and_datasets(data_parsed, labels, timescale);
  datasets_to_plot = update_chart(chart, labels, dataset_array, n, timescale);
}

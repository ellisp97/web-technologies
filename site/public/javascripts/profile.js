"use strict"
var ctx = document.getElementById("myChart");
var prod_data = document.getElementById("profile-chart-script").getAttribute( "data-prod_data" );
var data_parsed = JSON.parse(prod_data);
const colours = ['#FEA47F', '#25CCF7', '#EAB543','#55E6C1','#CAD3C8','#F97F51','#1B9CFC','#F8EFBA','#58B19F','#2C3A47'];
var active_buttons = [];

var get_day_string = function(date){
  return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
};

var get_last_n_days = function(n_days){
  var bins = [];
  for (var j=0;j<n_days;j++){
    var day = new Date();//today
    var earlier_day = (day.setDate(day.getDate() - j));
    earlier_day = Date(earlier_day);
    var day_string = get_day_string(day);
    bins.push(day_string);
  }
  bins = bins.reverse();
  return bins
};

var cutoff_date_array_at_time = function(n_days, date_array){
  //date array must be ascending in date (2 days ago, yesterday, today)
  //values must be Date objects
  var cutoff_date_array;
  var cutoff = false;
  var today = new Date();
  //go down the array until we find a day that is more than n days ago
  for(var i=date_array.length - 1; i > 0; i--){
    var timediff = Math.abs(today.getTime() - date_array[i].getTime());
    var daydiff = Math.ceil(timediff/(1000*3600*24));
    if(daydiff > n_days){
      cutoff_date_array = date_array.slice(i);
      //returns the last i-1 elements
      cutoff = true;
      break;
    }
  }
  if(!cutoff){
    cutoff_date_array = date_array;
  }
  cutoff_date_array.forEach(function(date, index, arr) {
    arr[index] = get_day_string(date);
  })
  return cutoff_date_array
};

var prices_at_dates = function(n_days, cutoffs, prices) {
  //cutoffs are the indices of the last n days that the prices changed
  var prices_last_n_days = prices.slice(prices.length - cutoffs.length);
  //this is the last n price changes
  var price_date = [];
  var j = 0;
  var flag = false;
  for(var i=0;i<n_days;i++){
    //price_date[i] will be the price n-i days ago
    if(cutoffs.indexOf(i) != -1){
      //if i (e.g. = 3) is in the cutoffs, then n-i days ago the price changed
      if(flag){
        //delay by one because we don't look back all the way
        j+=1;//we use this to index the changed prices
      }
      flag = true;
    }
    price_date[i] = prices_last_n_days[j]/100;
  }
  return price_date;
}

var analyse_product_data = function(prod, last_n_day_strings){
  //make arrays that contain the dates and prices by splitting at commas
  var date_array = prod.date_update_history.split(",");
  var price_array = prod.prod_price_history.split(",");
  date_array.forEach(function(date, index, arr) {
    //convert the dates to Date objects
    arr[index] = new Date(date);
  });
  var cutoff_price_change_dates = cutoff_date_array_at_time(7, date_array);

  var cutoff_indices = [];
  cutoff_price_change_dates.forEach(function(date) {
    cutoff_indices.push(last_n_day_strings.indexOf(date));
  });

  var last_n_day_prices = prices_at_dates(7, cutoff_indices, price_array);
  return last_n_day_prices;
};

var create_price_changes_and_datasets = function(data_parsed, labels) {
  //add the price changes in the last n days for each product to the data
  //also specify the datasets for each plot
  var dataset_array = [];
  for(var i=0; i<data_parsed.length; i++){
    data_parsed[i].price_array = (analyse_product_data(data_parsed[i], labels));
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

function makeChart(ctx, labels, datasets, n) {
  Chart.defaults.global.defaultFontFamily = "'Lato', 'Calibri', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
  Chart.defaults.global.defaultFontColor = 'black';
  Chart.defaults.global.defaultFontSize = 18;
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
          text: "Price over the last " + String(n) + " days for products"
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
          position: 'right'
        }
      }
  });
  return myChart;
}

function update_chart(chart, labels, data_array){
  var datasets_to_plot = [];
  for(var i=0; i < active_buttons.length; i++){
    if(active_buttons[i]){
      datasets_to_plot.push(data_array[i])
    }
  }
  datasets_to_plot = truncate_to_five(datasets_to_plot);
  chart.data.labels = labels;
  chart.data.datasets = datasets_to_plot;
  chart.update();
}

//this is the days over which we plot
var labels = get_last_n_days(7);
var dataset_array = create_price_changes_and_datasets(data_parsed, labels);
var datasets_to_plot = truncate_to_five(dataset_array)
var chart = makeChart(ctx, labels, datasets_to_plot, 7);

for(var i=0; i<data_parsed.length; i++){
  //also create a button in the dropdown for each possible plot, to show up to 5
  var drop_butt = create_button(String(i), data_parsed[i].prod_name, i);
  if(i < 5){
    drop_butt.setAttribute('value', 'ON');
    active_buttons[i] = true;
  }
  document.getElementById("dropdown_container").appendChild(drop_butt);
  drop_butt.onclick = function() {
    console.log(dataset_array);
    if(this.value == "ON"){
      this.setAttribute('value', 'OFF');
      console.log(this.value);
      active_buttons[Number(this.id.slice(-1))] = false;
    }
    else{
      this.setAttribute('value', "ON");
      active_buttons[Number(this.id.slice(-1))] = true;
    }
    update_chart(chart, labels, dataset_array);
  }
}

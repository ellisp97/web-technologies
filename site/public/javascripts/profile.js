var ctx = document.getElementById("myChart");

Chart.defaults.global.defaultFontFamily = 'Lato';
Chart.defaults.global.defaultFontColor = 'black';
Chart.defaults.global.defaultFontSize = 18;


var myChart = new Chart(ctx, {
    type: 'pie',
    data: {
        // get product genres
        labels: ["Books", "Games", "Electronics", "Stationary", "Hygeine"],
        datasets: [{
            label: 'Purchase History',
            // lineTension: 1,
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
            ],
            /*borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 2,*/
        }]
    },
    options: {
        cutoutPercentage: 50,
        animation: {
            animateScale: true
        },
        legend: {
            position: 'right',
            labels: {
                }
             },
        title: {
            display: true,
            text: 'Buying Details'
        }   ,
        scales: {
            // yAxes: [{
                // ticks: {
                    // beginAtZero:true,
                    // fontColor: 'black'
                // },
            // }],
            // xAxes: [{
                // ticks: {
                // },
            // }]
        },
        responsive: false
    }
});

function dispFunction() {
    var x = document.getElementById("myChart");
    if (x.style.display === "block") {
        x.style.display = "none";
    } else {
        x.style.display = "block";
    }
}
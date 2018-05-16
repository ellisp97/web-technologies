
function random_col() { 
    var color = ['#bdc3c7','#9b59b6','#2c3e50','#7f8c8d','#f3a683','#f8a5c2']; //Set your colors here
    var randcolor = Math.floor(Math.random() * color.length);
    document.body.style.backgroundColor = color[randcolor]; // Setting the random color on your div element.
  }
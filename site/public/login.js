function random_col() { //function name
  var color = '#';
  var letters = ['000000','FF65hy','00FF00','0000FF','FFFF00','00FFFF','FF00FF','C0C0C0']; //Set your colors here
  color = letters[Math.floor(Math.random() * letters.length)];
  document.getElementById('posts').style.background = color; // Setting the random color on your div element.
}
console.log(random_col());

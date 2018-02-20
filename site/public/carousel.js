"use strict";
addEventListener('load', carousel);
/*
The below function makes the carousel work
*/
function carousel() {

  /*
  Prevents the bulk of the script from running if the parts
  that we rely on are not present
  if (!document.querySelector || !('classList' in document.body)) {
    return false;
  }*/

  //These variables pick out the HTML elements that we need
  //Namely the carousel container, next and previous buttons, and list items
  var container = document.querySelector('.carousel-container');
  var next = container.querySelector('.next');
  var prev = container.querySelector('.prev');
  var items = container.querySelectorAll('.carousel-content li');

  var counter = 0; //a counter to note which element we are on
  var amount = items.length; //the number of elements in the carousel
  var current = items[0]; //the currently-displaying carousel element, initialised at the first list element



  container.classList.add('active'); //make the container active

  /*
  The below function moves the 'current' class to the next or previous element
  (or does nothing at all if direction = 0)
  */
  function navigate(direction) {
    current.classList.remove('current'); //remove the current class from the current element
    counter = (counter + direction + amount) % amount; //move forward or backward (modulo for wraparound)
    current = items[counter]; //update the current variable to be the next or previous item
    current.classList.add('current'); //add the current class to this element
  }

  next.addEventListener('click', function(ev) { //listen for a click event on the next button
    navigate(1); //navigate to the next element in the carousel
  });

  prev.addEventListener('click', function(ev) {
    navigate(-1); //navigate to the previous element in the carousel
  });
  navigate(0); //show the first element
};

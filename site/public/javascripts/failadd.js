
var failure = document.getElementById('fail-script').getAttribute('data-urlcode');
if(failure==0){
    console.log('product already exists');
    document.getElementById("error-message").innerHTML = 'product already exists';
    var fail_modal = document.getElementById('failadd');
    fail_modal.style.display = 'block';
    var login = document.getElementById('add');
    login.style.display = 'block';
    fail_modal.style.zIndex = 20;
    // count = 0;
}else if(failure==-1){
    console.log('product not found from link');
    document.getElementById("error-message").innerHTML = 'product not found from link';
    var fail_modal = document.getElementById('failadd');
    fail_modal.style.display = 'block';
    var login = document.getElementById('add');
    login.style.display = 'block';
    fail_modal.style.zIndex = 20;
    // count = 0;
}else if(failure==-2){
    console.log('product found, no price in product');
    document.getElementById("error-message").innerHTML = 'product found from link has no price';
    var fail_modal = document.getElementById('failadd');
    fail_modal.style.display = 'block';
    var login = document.getElementById('add');
    login.style.display = 'block';
    fail_modal.style.zIndex = 20;
    // count = 0;
}

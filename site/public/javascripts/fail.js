var failure = document.getElementById('fail-script').getAttribute('fail');
var failure_parsed = JSON.parse(failure);
console.log(failure_parsed);
if(failure_parsed){
    var fail_modal = document.getElementById('faillogin');
    fail_modal.style.display = 'block';
    var login = document.getElementById('login');
    login.style.display = 'block';
    fail_modal.style.zIndex = 20;

}
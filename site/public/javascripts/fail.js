var login_failure = document.getElementById('failure-script').getAttribute('floppy');

if(login_failure=='true'){
    var fail_modal = document.getElementById('faillogin');
    fail_modal.style.display = 'block';
    var login = document.getElementById('login');
    login.style.display = 'block';
    fail_modal.style.zIndex = 20;
}
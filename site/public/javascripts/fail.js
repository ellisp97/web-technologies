var login_failure = document.getElementById('failure-script').getAttribute('floppy');

console.log("Login Failire ::",login_failure);

if(login_failure==0){
    var fail_modal = document.getElementById('faillogin');
    document.getElementById('login-message').innerHTML = "Your Username or Password was Incorrect"; 
    fail_modal.style.display = 'block';
    var login = document.getElementById('login');
    login.style.display = 'block';
    fail_modal.style.zIndex = 20;
}else if(login_failure==-1){
    var fail_modal = document.getElementById('faillogin');
    document.getElementById('login-message').innerHTML = "Username is already taken"; 
    fail_modal.style.display = 'block';
    var register = document.getElementById('register');
    register.style.display = 'block';
    fail_modal.style.zIndex = 20;    
}

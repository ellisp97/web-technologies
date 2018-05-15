function CustomValidation(input){
    //arrays for invalid parts user has sumbitted and one for checks to be compared
    this.invalidities = [];
    this.validityChecks = [];

    //add reference to the input node
	this.inputNode = input;
	this.registerListener();
}

CustomValidation.prototype = {
    addInvalids: function(message){
        this.invalidities.push(message);
    },
    getInvalids: function(){
        return this.invalids.join('. \n');
    },
    checkValidity: function(input) {
        for(i=0; i<this.validityChecks.length; i++){
            var isInvalid = this.validityChecks[i].isInvalid(input);
            if(isInvalid) {
                this.addInvalidity(this.validityChecks[i].invalidityMsg);
                this.validityChecks[i].element.classList.add('invalid');
                this.validityChecks[i].element.classList.remove('valid');
            } else {
                this.validityChecks[i].element.classList.remove('invalid');
                this.validityChecks[i].element.classList.add('valid');                
            }
        }
    },
	checkInput: function() {

		this.inputNode.CustomValidation.invalidities = [];
		this.checkValidity(this.inputNode);

		if ( this.inputNode.CustomValidation.invalidities.length === 0 && this.inputNode.value !== '' ) {
			this.inputNode.setCustomValidity('');
		} else {
			var message = this.inputNode.CustomValidation.getInvalidities();
			this.inputNode.setCustomValidity(message);
		}
    },
    //listens to register form and finally checks if tform is valid
	registerListener: function() { 

		var CustomValidation = this;
		this.inputNode.addEventListener('keyup', function() {
			CustomValidation.checkInput();
		});
	}
};

// 3 arrays to check for each input 
// isinvalid determines if requirements are met
// invalidityMsg displays not met requirements
// element states the specific reqauirement --------------
var usernameValidityChecks = [{
        isInvalid: function(input) {
            return input.value.length < 3;
        },
        invalidityMsg: 'Input needs to be at least 3 characters long',
        element: document.querySelector('label[for="username"] li:nth-child(1)')
    },{
        isInvalid: function(input) {
            var illegalChars = input.value.match(/[^a-zA-Z0-9]/);
            return illegalChars ? true : false;
        },
        invalidityMsg: 'Only letters and numbers are allowed',
        element: document.querySelector('label[for="username"] li:nth-child(2)')
        
    }
]
var passwordValidityChecks = [{
		isInvalid: function(input) {
			return input.value.length < 8 | input.value.length > 100;
		},
		invalidityMsg: 'This input needs to be between 8 and 100 characters',
		element: document.querySelector('label[for="password"] .input-requirements li:nth-child(1)')
	},{
		isInvalid: function(input) {
			return !input.value.match(/[0-9]/g);
		},
		invalidityMsg: 'At least 1 number is required',
		element: document.querySelector('label[for="password"] .input-requirements li:nth-child(2)')
	},{
		isInvalid: function(input) {
			return !input.value.match(/[a-z]/g);
		},
		invalidityMsg: 'At least 1 lowercase letter is required',
		element: document.querySelector('label[for="password"] .input-requirements li:nth-child(3)')
	},{
		isInvalid: function(input) {
			return !input.value.match(/[A-Z]/g);
		},
		invalidityMsg: 'At least 1 uppercase letter is required',
		element: document.querySelector('label[for="password"] .input-requirements li:nth-child(4)')
	},{
		isInvalid: function(input) {
			return !input.value.match(/[\!\@\#\$\%\^\&\*]/g);
		},
		invalidityMsg: 'You need one of the required special characters',
		element: document.querySelector('label[for="password"] .input-requirements li:nth-child(5)')
	}
];
var passwordRepeatValidityChecks = [
	{
		isInvalid: function() {
			return password2Input.value != passwordInput.value;
		},
		invalidityMsg: 'This password needs to match the first one'
	}
];
// --------------------------------------------------------


//--------sets the validation to check on each neccessary input----------------
var usernameInput = document.getElementById('username');
var passwordInput = document.getElementById('password');
var password2Input = document.getElementById('password2');

usernameInput.CustomValidation = new CustomValidation();
usernameInput.CustomValidation = usernameValidityChecks.validityChecks;

passwordInput.CustomValidation = new CustomValidation();
passwordInput.CustomValidation = passwordValidityChecks.validityChecks;

password2Input.CustomValidation = new CustomValidation();
password2Input.CustomValidation = password2ValidityChecks.validityChecks;
// -------------------------------------------------------------------------------


for(var i =0; i<inputs.length; i++){
    inputs[i].addEventListener('keyup', function() {
        this.CustomValidation.checkValidity(this);
    })
}

var inputs = document.querySelectorAll('input:not([type="submit"])');
var submit = document.querySelector('input[type="submit"');
var form = document.getElementById('register');

function validate() {
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].CustomValidation.checkInput();
	}
}

submit.addEventListener('click', validate);
form.addEventListener('submit', validate);
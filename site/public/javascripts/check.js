
function realTimeValidation(input) {
	this.Invalids = [];
	this.validityChecks = [];

	//add reference to the input node
	this.inputNode = input;
	console.log(this.inputNode);

	//trigger method to attach the listener
	this.registerListener();
}

realTimeValidation.prototype = {
	addInvalidity: function(message) {
		this.Invalids.push(message);
	},
	getInvalids: function() {
		return this.Invalids.join('. \n');
	},
	checkValidity: function(input) {
		for ( var i = 0; i < this.validityChecks.length; i++ ) {

			var isInvalid = this.validityChecks[i].isInvalid(input);
			if (isInvalid) {
				this.addInvalidity(this.validityChecks[i].invalidityMessage);
			}

			var requirementElement = this.validityChecks[i].element;

			if (requirementElement) {
				if (isInvalid) {
					requirementElement.classList.add('invalid');
					requirementElement.classList.remove('valid');
				} else {
					requirementElement.classList.remove('invalid');
					requirementElement.classList.add('valid');
				}

			} 
		} 
	},
	checkInput: function() {

		this.inputNode.realTimeValidation.Invalids = [];
		this.checkValidity(this.inputNode);

		if ( this.inputNode.realTimeValidation.Invalids.length === 0 && this.inputNode.value !== '' ) {
			this.inputNode.setCustomValidity('');
		} else {
			var message = this.inputNode.realTimeValidation.getInvalids();
			this.inputNode.setCustomValidity(message);
		}
	},
	registerListener: function() { 

		var realTimeValidation = this;

		this.inputNode.addEventListener('keyup', function() {
			realTimeValidation.checkInput();
		});


	}

};



var nameValidityChecks = [
	{
		isInvalid: function(input) {
			return input.value.length < 3;
		},
		invalidityMessage: 'This input needs to be at least 3 characters',
		element: document.querySelector('label[for="name"] .input-requirements li:nth-child(1)')
	},
	{
		isInvalid: function(input) {
			var illegalCharacters = input.value.match(/[^a-zA-Z0-9]/g);
			return illegalCharacters ? true : false;
		},
		invalidityMessage: 'Only letters and numbers are allowed',
		element: document.querySelector('label[for="name"] .input-requirements li:nth-child(2)')
	}
];


var usernameValidityChecks = [
	{
		isInvalid: function(input) {
			return input.value.length < 3;
		},
		invalidityMessage: 'This input needs to be at least 3 characters',
		element: document.querySelector('label[for="username"] .input-requirements li:nth-child(1)')
	},
	{
		isInvalid: function(input) {
			var illegalCharacters = input.value.match(/[^a-zA-Z0-9]/g);
			return illegalCharacters ? true : false;
		},
		invalidityMessage: 'Only letters and numbers are allowed',
		element: document.querySelector('label[for="username"] .input-requirements li:nth-child(2)')
	}
];

var emailValidityChecks = [
	{
		isInvalid: function(input) {
			return input.value.length < 3;
		},
		invalidityMessage: 'This input needs to be at least 3 characters',
		element: document.querySelector('label[for="email"] .input-requirements li:nth-child(1)')
	},
	{
		isInvalid: function(input) {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(email);
		},
		invalidityMessage: 'Valid Emailis Required',
		element: document.querySelector('label[for="email"] .input-requirements li:nth-child(2)')
	}
];

var passwordValidityChecks = [
	{
		isInvalid: function(input) {
			return input.value.length < 8 | input.value.length > 100;
		},
		invalidityMessage: 'This input needs to be between 8 and 100 characters',
		element: document.querySelector('label[for="password"] .input-requirements li:nth-child(1)')
	},
	{
		isInvalid: function(input) {
			return !input.value.match(/[0-9]/g);
		},
		invalidityMessage: 'At least 1 number is required',
		element: document.querySelector('label[for="password"] .input-requirements li:nth-child(2)')
	},
	{
		isInvalid: function(input) {
			return !input.value.match(/[a-z]/g);
		},
		invalidityMessage: 'At least 1 lowercase letter is required',
		element: document.querySelector('label[for="password"] .input-requirements li:nth-child(3)')
	},
	{
		isInvalid: function(input) {
			return !input.value.match(/[A-Z]/g);
		},
		invalidityMessage: 'At least 1 uppercase letter is required',
		element: document.querySelector('label[for="password"] .input-requirements li:nth-child(4)')
	},
	{
		isInvalid: function(input) {
			return !input.value.match(/[\!\@\#\$\%\^\&\*]/g);
		},
		invalidityMessage: 'You need one of the required special characters',
		element: document.querySelector('label[for="password"] .input-requirements li:nth-child(5)')
	}
];

var confirmPasswordValidityChecks = [
	{
		isInvalid: function() {
			return confirmPasswordInput.value != passwordInput.value;
		},
		invalidityMessage: 'This password needs to match the first one'
	}
];



var nameInput = document.getElementById('name');
var usernameInput = document.getElementById('usernameR');
var emailInput = document.getElementById('email');
var passwordInput = document.getElementById('passwordR');
var confirmPasswordInput = document.getElementById('password_repeat');


nameInput.realTimeValidation = new realTimeValidation(nameInput);
nameInput.realTimeValidation.validityChecks = nameValidityChecks;

usernameInput.realTimeValidation = new realTimeValidation(usernameInput);
usernameInput.realTimeValidation.validityChecks = usernameValidityChecks;

emailInput.realTimeValidation = new realTimeValidation(emailInput);
emailInput.realTimeValidation.validityChecks = usernameValidityChecks;

passwordInput.realTimeValidation = new realTimeValidation(passwordInput);
passwordInput.realTimeValidation.validityChecks = passwordValidityChecks;

confirmPasswordInput.realTimeValidation = new realTimeValidation(confirmPasswordInput);
confirmPasswordInput.realTimeValidation.validityChecks = confirmPasswordValidityChecks;




/* ----------------------------

	Event Listeners

---------------------------- */

var inputs = document.querySelectorAll('input:not([type="submit"])');


var submit = document.querySelector('input[type="submit"');
var form = document.getElementById('register');

function validate() {
	for (var i = 0; i < inputs.length; i++) {
		console.log(inputs[i]);
		inputs[i].realTimeValidation.checkInput();
	}
}

submit.addEventListener('click', validate);
form.addEventListener('submit', validate);
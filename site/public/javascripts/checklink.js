
function realTimeValidation(input) {
	this.Invalids = [];
	this.validityChecks = [];
	this.inputNode = input;
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



var URLValidityChecks = [
	{
		isInvalid: function(input) {
			return input.value.length < 6;
		},
		invalidityMessage: 'This input needs to be at least 6 characters',
		element: document.querySelector('label[for="prod_link"] .input-requirements li:nth-child(1)')
	},
	{
		isInvalid: function(input) {
            var legalURL = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
			// var legalURL =  new RegExp('^(https?:\\/\\/)?'+ // protocol
            // '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            // '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            // '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            // '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            // '(\\#[-a-z\\d_]*)?$','i'); // fragment locater;
			return legalURL.test(input.value) ? false : true;
		},
		invalidityMessage: 'Valid URL Link is needed',
		element: document.querySelector('label[for="prod_link"] .input-requirements li:nth-child(2)')
	}
];





var confirmURLInput = document.getElementById('prod_link');


confirmURLInput.realTimeValidation = new realTimeValidation(confirmURLInput);
confirmURLInput.realTimeValidation.validityChecks = URLValidityChecks;


var inputs = document.querySelectorAll('input:not([type="submit"])');

var submit = document.querySelector('input[type="submit"');
var form = document.getElementById('add');

function validate() {
	for (var i = 0; i < inputs.length; i++) {
		console.log(inputs[i]);
		inputs[i].realTimeValidation.checkInput();
	}
}

submit.addEventListener('click', validate);
form.addEventListener('submit', validate);
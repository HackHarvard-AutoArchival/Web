var input;

$(document).ready(function() {

  // Place JavaScript code here...

 	$('input[type=file]').change(function(e){
			//get the input and UL list
		input = document.getElementById('uploadBtn');
		var list = document.getElementById("fileUploadQueue");
		//alert(input.files[0].name);

		while (list.hasChildNodes()) { 
			list.removeChild(list.firstChild);
		}

		//for every file...
		for (var x = 0; x < input.files.length; x++) {
			$("#fileUploadQueue").append("<a href=\"#\" class=\"list-group-item\" onclick=\"selectMe(this)\"> " + input.files[x].name + "</a>");
			$("#filePrompt").hide();
		}
	});
});

function selectMe(e) {
	e = e || window.event;
	if(e.className == "list-group-item")
		e.classList.add('active');
	else
		e.classList.remove('active');
}


$(document).ready(function() {

  // Place JavaScript code here...

 	$('input[type=file]').change(function(e){
 		alert("here");
 		$("#filesUploaded").innerHTML = "";
 		$("#filesUploaded").hidden = false;
 		/*a.forEach(value, index, ar)
 		{
 			var fileName = $('input[type=file]').val();
			$("#filesUploaded").innerHTML += "a(href=\"#\", class=\"list-group-item active\") " + fileName;
		}*/
		for (var i = 0; i < e.files.length; ++i) {
		  var name = e.files.item(i).name;
		  alert("here is a file name: " + name);
		}
	});

});
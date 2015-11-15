var input;
var FindFiles = require("node-find-files");

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
  getPermaFiles();
});

function selectMe(e) {
	e = e || window.event;
	if(e.className == "list-group-item")
		e.classList.add('active');
	else
		e.classList.remove('active');
}

function getPermaFiles() {
  var finder = new FindFiles({
    rootFolder: "../../autoTool/uploads",
    filterFunction: function(path,stat) {
      var jsonPerma = path.substring(path.length - 11, path.length);
      console.log("jsonPerma", jsonPerma);
      var pdfPerma = path.substring(path.length - 4,path.length);
      console.log("pdfPerma", pdfPerma);
      console.log(path);
      return ((pdfPerma === ".txt")|| (jsonPerma === "_perma.json")) ? true : false;
    }
  });
  finder.startSearch();
}
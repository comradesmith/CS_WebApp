var courses_url = "http://redsox.tcs.auckland.ac.nz/ups/UniProxService.svc/courses"
var people_url = "http://redsox.tcs.auckland.ac.nz/ups/UniProxService.svc/people"
var news_url = "http://redsox.tcs.auckland.ac.nz/ups/UniProxService.svc/newsfeed"
var notices_url = "http://redsox.tcs.auckland.ac.nz/ups/UniProxService.svc/notices"

var vcard_url = "http://redsox.tcs.auckland.ac.nz/ups/UniProxService.svc/vcard?u="
var photo_url = "https://unidirectory.auckland.ac.nz/people/imageraw/{0}/{1}/small"
var response;


String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function data_fetch(url, type){	
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4){
			if (this.status == 200){
				response = this.responseText;
				switch(type){
					case "courses":
						courses_process();
						break;
					case "people":
						people_process();
						break;
					case "news":
						news_process();
				}
			}
			else{
				document.getElementById("target").innerHTML = "Something happened";
			}
		};
	}
	
	xhttp.open("GET", url, true);
	xhttp.send();	 
}

function courses_process() {
	var json = JSON.parse(response);
	var target = document.getElementById("coursestable");
	var courses = json.courses.coursePaperSection;
	var course_template = '<tr><th>{0}{1}</th></tr><tr class="coursedata" id={2}><td>{3}</td></tr>'
	var stage_template = "<p>Stage {0}</p><table>{1}</table>";
	var data_toggle_template = '<a id="{0}button" class="coursetogglebutton" onclick=\'togglecoursedata("{1}")\'>&#9660</a>';
	var stages = {};

	var course_names = {}
	for(i=0; i<courses.length; i++){
		var split = courses[i].subject.courseA.split(" ");
		var stage_num =split[1].charAt(0);
		if (!(stage_num in stages)){
			stages[stage_num] = {"number":stage_num, "courses":[]};
			course_names[stage_num] = [];
		}
		/* each course belongs to a stage, stages are set, now make the association */
		var base_course_code = split[1].substr(0, 3);
		if(!(course_names[stage_num].indexOf(base_course_code) > -1)){
			course_names[stage_num].push(base_course_code);
			stages[stage_num].courses.push(courses[i]);
		}
		else{
			/* merge courses */
			var new_course = courses[i];
			var index = course_names[stage_num].indexOf(base_course_code);
			course_names[stage_num].splice(index, 1);
			var old_course = stages[stage_num].courses.splice(index, 1)[0];

			var old_code = old_course.subject.courseA;
			var new_code = new_course.subject.courseA.split(" ")[1];

			new_course.subject.courseA = old_code+ "/" + new_code;

			/* TODO ; merge points, and replace empty strings for fields such as description */
			var old_points = old_course.subject.points.split(" ")[0];
			var new_points = new_course.subject.points

			new_course.subject.points = old_points + "/" + new_points;

			course_names[stage_num].push(base_course_code);
			stages[stage_num].courses.push(new_course);

		}
	}

	for(key in stages){
		var stage = stages[key];
		var stage_data = ""
		for(i=0; i<stage.courses.length; i++){
			var course = stage.courses[i];
			var base_course_code = course.subject.courseA.split(" ")[1].substr(0, 3);
			var course_header = "<h2>" + course.subject.courseA + "</h2>" + "<p>";
			course_header += course.title + "</p>";
			var course_data = "<p>" + course.description +'</p><br><p style="font-size: smaller; 								font-weight: bold;">' + course.subject.points;
			if(typeof course.prerequisite == "undefined"){
				course_data += "</p>";
			}
			else if(typeof course.prerequisite != "string"){
				for( key in course.prerequisite){
					course_data += "<br>" + course.prerequisite[key];
				}
			}
			else{
				course_data += "<br>" + course.prerequisite;
			}
			course_data += "</p>";
			var toggle_button = data_toggle_template.format(base_course_code, base_course_code);
			stage_data += course_template.format(toggle_button, course_header, base_course_code, course_data);
		}	

		target.innerHTML += stage_template.format(stage.number, stage_data);
		target.innerHTML += "<br>"
	}
}


function togglecoursedata(course_id) {
	var row = document.getElementById(course_id);
	var button = document.getElementById(course_id + "button");
	if (row.style.display == "none" || row.style.display == ""){
		row.style.display = "table";
		button.innerHTML = "&#9650";
	}
	else {
		row.style.display = "none";
		button.innerHTML = "&#9660";
	}
}


function people_process() {
	var json = JSON.parse(response);	
	json = json.list;
	json.sort(function(a, b){
		if( a.lastname < b.lastname) return -1;
		if( a.lastname > b.lastname) return 1;
		return 0;
	});
	var personTemplate = "<table><tr><th>{0}</th></tr><tr><td><p>{1}</p></td></tr></table><br>";
	var vcardLinkTemplate = '<a href="' + vcard_url + '{0}">☎</a>';
	var person;
	var tablecontents = "";
	var normaltitles = ["Mr", "Mrs", "Miss", "Ms", "Master", "undefined"];


	for(var i=0; i<json.length; i++){
		person = json[i];
		
		var name = person.firstname + " " + person.lastname;
		var photo = "";

		var header = "<div class=\"persondescription\">";
		for (key in person.jobtitles){
			header += "<h6>" + person.jobtitles[key] + "</h6>";
			
		}

		if (typeof person.mediaKeywords != "undefined") { 
				var keyword = person.mediaKeywords[0];
				if (typeof keyword != "undefined"){
					header += "<p>" + keyword.split(",")[0] + "</p>";
				}
				var keyword = person.mediaKeywords[1];
				if (typeof keyword != "undefined"){
					header += "<p>" + keyword.split(",")[0] + "</p>";
				}
				var keyword = person.mediaKeywords[2];
				if (typeof keyword != "undefined"){
					header += "<p>" + keyword.split(",")[0] + "</p>";
				}
		}

		header += "</div>";

		header += "<div class=\"personname\">";

		if (typeof person.imageId != "undefined"){
			var photo = photo_url.format(person.profileUrl[1], person.imageId);
			header += "<img style='border-radius: 10px;' src=\"" + photo + "\"/>";
		}
		else {
			header += "<div class=\"personplaceholder\">?</div>" ;
		}

		header += "<p>";
		if (!(normaltitles.indexOf(person.title) > -1)){
			if (typeof person.title != "undefined"){
				header += person.title + " ";
			}
		}
		
		header += name + "</p>";
		header += "</div>";

		var vcardLink = vcardLinkTemplate.format(person.profileUrl[1]);
		var emaillink = "<a href=\"mailto:{0}\">Email me</a>".format(person.emailAddresses[0]);


		var details = emaillink + " " + vcardLink;
		var person1Table = personTemplate.format(header, details);

		tablecontents = tablecontents.concat(person1Table);
	}

	var section = document.getElementById("people");
	var peopleTable = section.querySelector("#peopletable");
	peopleTable.innerHTML = tablecontents;
}


function news_process() {
	var content = document.getElementById("newscontent");
	var news_template = "<table><tr><th>{0}</th></tr><tr><td>{1}</td></tr></table>"
	var news = "";
	
	var parser = new DOMParser();
	var xml = parser.parseFromString(response, "text/xml");
	var items = xml.getElementsByTagName("item");

	for(var i = 0; i < 5; i++) {
		var item = items[i];
		var title = item.children[0].innerHTML;
		var description = item.children[1].innerHTML;
		var link = item.children[2].innerHTML;
		var date = item.children[4].innerHTML;

		var head = "<a href=\"" + link + "\">" + title + "</a>" + "<p>" + date + "</p>";
		var body = "<p>" + description + "</p><a href=\"" + link+ "\">Source</a>";

		news += news_template.format(head, body) + "<br>";

	}

	document.getElementById("newscontent").innerHTML = news;

}


function section_display_toggle(id) {
	var section = document.getElementById(id);
	var button = document.getElementById(id + "nav");
	if (section.style.display == "none"){
		hide_all();
		section.style.display = "block";
		button.style.background = "#4A45CA";
	}	
}

function hide_all() {
	document.getElementById("home").style.display = "none";
	document.getElementById("courses").style.display = "none";
	document.getElementById("people").style.display = "none";
	document.getElementById("news").style.display = "none";
	document.getElementById("notices").style.display = "none";
	document.getElementById("guestbook").style.display = "none";

	document.getElementById("homenav").style.background  = "none";
	document.getElementById("coursesnav").style.background  = "none";
	document.getElementById("peoplenav").style.background  = "none";
	document.getElementById("newsnav").style.background  = "none";
	document.getElementById("noticesnav").style.background  = "none";
	document.getElementById("guestbooknav").style.background = "none";
}

window.onload = function() {
	hide_all();
	
	data_fetch(courses_url, "courses");
	data_fetch(people_url, "people");
	data_fetch(news_url, "news");

	section_display_toggle("home");
}

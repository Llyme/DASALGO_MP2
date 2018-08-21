// The <body> tag that contains all the visible elements.
const body = document.body;

// Random names to make mail creation feel faster and natural.
const name_struct = [
	"Bob", "Charles", "Margaret", "Carl", "Billy", "Mandy", "Willy",
	"Richard", "Charlie", "Emilly", "Gordon", "Freeman", "Gunther",
	"Fred", "Noel", "Peter", "Stephanie", "Ethan", "Drake", "Randolf",
	"Fredrick", "Roger", "Candice", "Phineas", "Ferb", "Squee",
	"Splee", "Spoon", "Marvin", "Violet", "Summer", "Ruby", "Jasmine",
	"Eugene", "Chloe", "Tiffany", "Louise", "Luis", "Vannessa",
	"Kelly", "Brandon", "Finn", "Sophilia", "Carlos", "Andromeda",
	"Ignacio", "Constantine", "Nick", "Hilda", "Cecie", "Evelyn",
	"Dominic", "Dorothy", "Donald", "Teressa", "Himiko", "Stacy",
	"Chell", "Wheatley", "GLaDOS", "Arthur", "Simon", "Simone",
	"Joseph", "Jonathan", "Joestar", "John", "Cena"
];

// Animation speed index (fastest to slowest).
const speed = [50, 100, 300, 500, 1000];

/* This scales the distance between nodes. This does not affect
   travel speed.
*/
const space_size = 64;

// Call all the relevant elements so they'll be easily found here.
const e = {
	// The speed slider.
	speed: q("#ctrl div")[0],
	// The speed slider's indicator.
	speed_ball: q("#ctrl div div")[0],
	// The very first thing the user sees upon accessing this app.
	dropdown: q("#dropdown"),
	// The list of the messages to be sorted and sent.
	msg: q("#msg"),
	// The first entry in the '#msg' element.
	msg_main: q("#msg div")[0],
	// The message selection's window.
	msg_sel: q("#msg_sel"),
	// The message selection table.
	msg_sel_tbody: q("#msg_sel tbody")[0],
	// The message selection's buttons.
	msg_sel_btn: q("#msg_sel #btn div"),
	// AKA 'workspace', this will hold the points of the addresses.
	space: q("#space"),
	// This element will hold most of the mouse events.
	drag: q("#drag"),
	// The mailman.
	mailman: q("#mailman"),
	// The window where you set the mail's recipient.
	msg_write: q("#msg_write"),
	// The input for the mail's recipient's name.
	msg_write_input: q("#msg_write_input"),
	// The input for the mail's date of submission.
	msg_write_date: q("#msg_write_date"),
	// The close button.
	msg_write_close: q("#msg_write .btn")[0]
};

// Call all the relevant images so they'll be easily found here.
const img = {
	// The controls (play, resume, pause, etc).
	ctrl: q("#ctrl img")
};

// The array of addresses that can be found in the loaded .csv file.
let array;
/* This array will be the one to be sorted, preserving the true array
   throughout the simulation.
*/
let array_tag;
// Priority list for post office. Newest is the last prioritized.
let array_prio = [];
/* All the addresses selected in the message selection will be here.
   Each entry is a combination of the div element, the address
   location, and the date & time it was created.
*/
let address_selected = [];
/* This is used whenever the user is writing a mail. The variable's
   name pretty much suggests what it's for.
*/
let address_target;
// This will indicate if the screen is being dragged by the mouse.
let drag;
// This will indicate how far was the screen drag from the origin.
let drag_pos = [0, 0];
// This will indicate the screen's zoom factor.
let space_scale = 10; // range of 4 to 20.
// This will indicate which node is the mailman in.
let office_selected;
// The mailman's position in Vector[2].
let mailman_pos = new lemon.Vector([0, 0]);
// The selected node that will persistently show it's details.
let pnt_held;
// The path from the point being held towards the point being hovered.
let pnt_held_path;

//-- Mailman. Setup portion for the mailman's functions. --//

/**
 * Move the mailman towards the given Vector[2].
 * @param Vector[2] v - 2D vector.
**/
function mailman_move(v) {
	// Get direction from the 2 vector[2]s.
	let dir = new lemon.Vector([
		v[0] - mailman_pos[0],
		v[1] - mailman_pos[1]
	]);

	// Set position.
	mailman_pos = new lemon.Vector(v);
	e.mailman.style.left = v[0]*space_size + "px";
	e.mailman.style.top = v[1]*space_size + "px";
	e.mailman.style.transform = "translate(-50%, -50%) rotate(" +
		Math.atan2(dir[1], dir[0])/Math.PI*180 + "deg)";

	// Make the mailman visible.
	e.mailman.removeAttribute("hidden");
}


//-- Controls Section. Setup portion for the controls. --//

// This will indicate if the speed slider's ball is being dragged.
let div_speed_drag;

/**
 * Set the buttons' state. Setting to null will not change it.
 * 0 = Disabled; 1 = Enabled; null = No Changes
 * @param Integer a - Play button.
 * @param Integer b - Pause button.
 * @param Integer c - Array button. Mail-writing window.
 * @param Integer d - Sort button.
**/
function ctrl_set(a, b, c, d) {
	let l = [a, b, c, d];

	for (let i in l)
		if (l[i] != null)
			if (l[i])
				img.ctrl[i].removeAttribute("disabled");
			else
				img.ctrl[i].setAttribute("disabled", 1);
}

/**
 * This will be called whenever the speed slider's ball is dragged.
 * @param Object event - The mouse event's information summary.
**/
function div_speed_fn(event) {
	// Only do do something if the ball is being dragged.
	if (div_speed_drag) {
		// Calculate by 32 pixels (We don't need extreme precision).
		let i = Math.max(Math.min(Math.floor(
			(event.x - e.speed.offsetLeft)/32
		), 4), 0);

		// Move the ball.
		e.speed_ball.style.left = i*40 - 12 + "px";

		i = speed[i];

		/* Update the animation's 'step' delay. 'Step' means when the
		   'mailman' moves to another point, or arranges his mails.
		   This will make the mailman do 1 'step' after x seconds.
		*/
		stepper.delay = i;

		i *= 0.00075;

		// Make the mailman's movements change as well.
		e.mailman.style.transition = "top " + i +
			"s linear, left " + i + "s linear," + " transform 0.2s";
	}
}

// See if the mouse is being held down on the speed slider.
e.speed.addEventListener("mousedown", event => {
	// Make sure it's the left mouse button.
	if (!event.button) {
		// Tell the user that it started dragging.
		div_speed_drag = 1;

		// Update it ASAP.
		div_speed_fn(event);
	}
});

// See if a mouse button is no longer being held down.
document.addEventListener("mouseup", event => {
	// Make sure it's the left mouse button.
	if (!event.button)
		// Tell the user it's no longer being dragged.
		div_speed_drag = null;
});

// Update whenever the user attempts to move the mouse.
document.addEventListener("mousemove", div_speed_fn);

// Play Button.
img.ctrl[0].addEventListener("click", _ => {
	if (pnt_held) {
		pnt_held.unhold();

		pnt_held = null;
	}

	stepper.play( i => i == 1 && ctrl_set(
		(array_tag.unsorted.length + array_tag.sorted.length) > 0,
		0,
		1,
		1
	));

	ctrl_set(0, 1, 0, 0);
});

// Pause Button.
img.ctrl[1].addEventListener("click", _ => {
	stepper.playing = -1;

	ctrl_set(1, 0);
});

// Array Button. Opens the mail creation window.
img.ctrl[2].addEventListener("click", _ => {
	e.msg_sel.removeAttribute("hidden");
});

// Sort Button. Change sorting priority.
img.ctrl[3].addEventListener("click", _ => {
	stepper.sorttime = !stepper.sorttime;

	img.ctrl[3].src = stepper.sorttime ?
		"assets/img/sorttime.png" : "assets/img/sortdist.png";
});


//-- Mail Recipient Window. Set the recipient's name. --//

function msg_write_show() {
	let name = name_struct[Math.floor(
		Math.random()*name_struct.length
	)];

	// Set time to current.
	e.msg_write_date.value = new Date().toJSON().slice(0, -8);

	msg_write.removeAttribute("hidden");
	msg_write_input.setAttribute("placeholder", name);
	msg_write_input.focus(); // Focus immediately.
}

// Make it so that pressing enter will submit it.
e.msg_write_input.addEventListener("keydown", event => {
	let address = address_target;

	// Make sure there's actually an address to go to.
	if (event.keyCode == 13 && address) {
		// Grab the placeholder instead if empty.
		let name = e.msg_write_input.value ? e.msg_write_input.value :
			e.msg_write_input.getAttribute("placeholder");

		let t = new Date(e.msg_write_date.value);
		let div = q("!div");
		div.innerHTML =
			name + "; " + t.toLocaleString() + "; " +
			address.city.split(" ")[0] + "<br>" +
			address.name;

		// Make it so that it emphasizes the address on hover.
		address.hover(div);

		let i = address_selected.push({
			div,
			address,
			time: t.getTime() // Convert to seconds.
		}) - 1;

		let n = array_tag.unsorted.push(i) - 1 +
			array_tag.sorted.length;

		stepper.ctrl(i, 0, 1);
		stepper.ctrl(i, 1, n);
		e.msg_main.appendChild(div);

		// Enable confirm button.
		e.msg_sel_btn[0].removeAttribute("disabled");

		// Hide this window.
		e.msg_write.setAttribute("hidden", 1);

		// Enable play button.
		ctrl_set(1);
	}
});

// Close button.
e.msg_write_close.addEventListener("click", _ =>
	e.msg_write.setAttribute("hidden", 1)
);


//-- Load Section. Setup portion for the file-loading functions. --//

/**
 * CLears out the message list and array tag.
**/
function reset() {
	// Message list.
	e.msg.innerHTML = "";
	e.msg_main.innerHTML = "";

	e.msg.appendChild(e.msg_main);

	// Remove the stepper's key and playlist.
	stepper.key = null;
	stepper.playlist = [];

	// Clear out the tag list.
	array_tag = {
		dump: {},
		buffer: {},
		order: [],
		unsorted: [],
		sorted: [],
		div: {}
	};

	// Add the selected office if 2nd time.
	if (office_selected)
		array_tag.order.push(office_selected);

	// Clear our mail history.
	address_selected = [];

	// Disable play since there's no messages.
	ctrl_set(0, 0, 1, 1);

	// Disable confirm button for mail creation window.
	e.msg_sel_btn[0].setAttribute("disabled", 1);
}

/**
 * Load the data in string format.
 * @param String str - the data (supposedly coming from a .csv file).
**/
function load(str) {
	// Make sure it's not playing.
	if (stepper.playing != -1) return;

	// Make a map out of the file's contents (assets/js/map.js).
	array = map(str);

	// It's a dud. Don't even bother.
	if (!Object.keys(array).length) return;

	// Reset stepper.
	reset();

	// Reset controls.
	ctrl_set(0, 0, 0, 1);

	// Clear message list.
	e.msg_sel_tbody.innerHTML =
		"<tr head>" +
		"<td>City</td>" +
		"<td>Location</td>"
		"</tr>";

	// Clear workspace.
	e.space.innerHTML = "";

	// Reset the mailman.
	e.mailman.setAttribute("hidden", 1);
	e.space.appendChild(e.mailman);

	// Reset user selections.
	address_selected = [];


	//-- Draw nodes. --//

	for (let x in array) {
		let city = array[x];
		let debounce = {};

		for (let y in city) {
			let location = city[y];
			debounce[y] = 1;

			/* Ignore non-plotted locations. It means they're
			   unreachable from the root node.
			*/
			if (location.position) {
				let tooltip = "<label>" + y + "</label>";

				//-- Create the elements. --//

				let position_str = [
					location.position[0]*space_size + "px",
					location.position[1]*space_size + "px"
				];

				let pnt = q("!div");
				location.pnt = pnt;
				pnt.style.left = position_str[0];
				pnt.style.top = position_str[1];

				e.space.appendChild(pnt);

				let label = q("!label");
				location.label = label;
				label.style.left = position_str[0];
				label.style.top = location.position[1]*space_size
				- 56 + "px";
				label.setAttribute("hidden", 1);

				e.space.appendChild(label);


				//-- Draw paths. --//

				location.paths = {};

				let fn = (name, v) => {
					if (!v.position)
						return;

					if (!debounce[name]) {
						let dir = new lemon.Vector([
							v.position[0] - location.position[0],
							v.position[1] - location.position[1]
						]);

						let path = q("!path");
						location.paths[name] = path;
						path.style.left = position_str[0];
						path.style.top = position_str[1];
						path.style.width =
							dir.magnitude()*space_size + "px";
						path.style.transform = "rotate(" + Math.atan2(
							dir[1], dir[0]
						)/Math.PI*180 + "deg)";

						e.space.appendChild(path);
					} else
						location.paths[name] = city[name].paths[y];
				};

				for (let z in location.parent)
					fn(z, city[z]);

				for (let z in location.children)
					fn(z, city[z]);


				//-- Setup behavior. --//

				pnt.addEventListener("contextmenu", event => {
					event.preventDefault();
					event.stopPropagation();

					if (stepper.playlist.length)
						return;

					if (pnt_held)
						pnt_held.unhold();

					if (pnt_held == location)
						return pnt_held = null;

					pnt_held = location;

					for (let k in location.paths) {
						city[k].label.innerHTML = (
							location.children[k] ||
							location.parent[k]
						) + "<br><small>" + k + "</small>";

						city[k].label.removeAttribute("hidden");
						location.paths[k].setAttribute("hover", 1);
					}

					pnt.setAttribute("hover", 1);
				});

				pnt.addEventListener("mouseenter", _ => {
					if (!pnt_held || pnt_held == location)
						return;

					let doc = map.traverse(
						array,
						x,
						pnt_held.name,
						y
					);

					if (doc) {
						for (let k in pnt_held.paths)
							city[k].label.setAttribute("hidden", 1);

						let txt = "";

						label.innerHTML =
							"<br><small>" + pnt_held.name + "</small>";

						pnt_held_path = doc.path;

						for (let i = 1; i < doc.path.length; i++) {
							let a = doc.path[i-1],
								b = doc.path[i];
							let v = city[a];
							let n = v.children[b] || v.parent[b];

							txt += n + " + ";
							label.innerHTML +=
								"<br><small>" + b + "; " + n +
								"</small>";

							v.paths[b].setAttribute("track", 1);
						}

						label.innerHTML =
							txt.slice(0, -2) +
							"= " + doc.length +
							label.innerHTML;

						label.removeAttribute("hidden", 1);
					}
				});

				pnt.addEventListener("mouseleave", _ => {
					let path = pnt_held_path;

					if (!path)
						return;

					for (let i = 1; i < path.length; i++)
						city[path[i-1]].paths[path[i]]
							.removeAttribute("track");

					pnt_held_path = null;

					if (!pnt_held)
						return;

					label.setAttribute("hidden", 1);

					for (let k in pnt_held.paths) {
						city[k].label.innerHTML = (
							pnt_held.children[k] ||
							pnt_held.parent[k]
						) + "<br><small>" + k + "</small>";

						city[k].label.removeAttribute("hidden");
						pnt_held.paths[k].setAttribute("hover", 1);
					}
				});

				location.unhold = _ => {
					for (let k in location.paths) {
						city[k].label.setAttribute("hidden", 1);
						location.paths[k].removeAttribute("hover");
					}

					pnt.removeAttribute("hover");
				}

				location.hover = v => {
					tooltip_new(v, tooltip);

					v.addEventListener("mouseenter", _ => {
						if (pnt_held || stepper.playlist.length)
							return;

						for (let k in location.paths) {
							city[k].label.innerHTML = (
								location.children[k] ||
								location.parent[k]
							) + "<br><small>" + k + "</small>";

							city[k].label.removeAttribute("hidden");
							location.paths[k].setAttribute("hover", 1);
						}

						pnt.setAttribute("hover", 1);
					});

					v.addEventListener("mouseleave", _ => {
						if (pnt_held || stepper.playlist.length)
							return;

						location.unhold();
					});
				};

				tooltip_new(
					pnt,
					tooltip,
					_ => !pnt_held || pnt_held == location
				);

				//-- If root node... --//

				if (location.root) {
					pnt.setAttribute("post", 1);

					pnt.addEventListener("click", _ => {
						if (office_selected)
							return;

						office_selected = x;

						array_tag.order.push(office_selected);
						event.target.setAttribute("selected", 1);
						mailman_move(location.position);

						// Allow the user to create mails.
						ctrl_set(0, 0, 1);

						nani(
							"Post Office Selected!",
							"Click the `Array Button` (the 3rd " +
							"button from the bottom-left; " +
							"the one with the brackets) to select " +
							"addresses for you to send mails to."
						);
					});
				} else {
					//-- Mail creation entry. --//

					let tr = q("!tr");
					location.tr = tr;

					[x, y].map(v => {
						let td = q("!td");
						td.innerHTML = v;

						tr.appendChild(td);
					});

					tr.addEventListener("click", _ => {
						address_target = location;

						msg_write_show();
					});

					e.msg_sel_tbody.appendChild(tr);
				}
			}
		}
	}

	e.dropdown.setAttribute("hidden", 1);

	nani(
		"Map Loaded Succesfully!",
		"Select a post office by clicking one of the blue circles."
	);

	return 1;
}

// One-time load-via-paste method.
document.addEventListener("paste", function(event) {
	if (load(event.clipboardData.getData("Text")))
		document.removeEventListener("paste", arguments.callee);
});

// File selected with the file browser.
dropdown.addEventListener("click", _ => {
	let e = q("body !input type=file accept=.csv hidden=1 delete=1");
	e.addEventListener("change", event => {
		let file = event.target.files[0];

		if (file) if (file.type == "application/vnd.ms-excel") {
			let reader = new FileReader();
			reader.onload = event => load(event.target.result);

			// Read the file.
			reader.readAsText(file);
		}
	});
	e.click();
});

// File dropped on the screen.
document.addEventListener("drop", event => {
	/* Stop the browser from doing its automatic things. Tell it that
	   we'll take it from here.
	*/
	event.stopPropagation();
	event.preventDefault();

	let file = event.dataTransfer.items[0];

	if (file) if (file.type == "application/vnd.ms-excel") {
		let reader = new FileReader();
		reader.onload = event => load(event.target.result);

		// Read the file.
		reader.readAsText(event.dataTransfer.files[0]);
	} else if (file.type == "text/plain")
		file.getAsString(load);
});

// Explicitly change the file dragging behavior.
document.addEventListener("dragover", event => {
	// Stop the browser from doing its automatic things.
	event.stopPropagation();
	event.preventDefault();
	// Make the cursor look like its making a copy of the file.
	event.dataTransfer.dropEffect = "copy";
});


//-- Message Selection Section. Contains the button functions. --//

// Confirm Button. Hide the 'messages' window.
e.msg_sel_btn[0].addEventListener("click", _ => {
	// Hide the 'messages' window.
	e.msg_sel.setAttribute("hidden", 1);
});

// Reset Button. Clear all selected addresses.
e.msg_sel_btn[1].addEventListener("click", reset);


//-- Screen Behaviour Section. Make the mouse responsive. --//

// Set 'drag' to 'true' if left mouse button is held down.
e.drag.addEventListener("mousedown", event => drag = !event.button);

// Make mouse wheel zoom in/out.
e.drag.addEventListener("wheel", event => {
	// See if mouse wheel was moved forward or backward.
	let n = event.deltaY < 0 ? -1 : 1;
	// Get current screen scale
	let i = space_scale;
	// Update it.
	space_scale = Math.max(4, Math.min(20,
		space_scale + n
	));

	// No changes? Do nothing.
	if (i == space_scale) return;

	// Divide it by 10. We scale it by percent (0.4 to 2.0).
	i = space_scale/10;
	// Slightly move the screen when zooming.
	drag_pos[0] += (drag_pos[0]*2 - innerWidth)*0.05*n;
	drag_pos[1] += (drag_pos[1]*2 - innerHeight)*0.05*n;
	e.space.style.left = drag_pos[0];
	e.space.style.top = drag_pos[1];
	// Rescale.
	e.space.style.transform = "scale(" + i + ", " + i + ")";
});

// Make the mouse dragging move the screen.
document.addEventListener("mousemove", event => {
	// Only do this if left mouse button is held down.
	if (drag) {
		drag_pos[0] += event.movementX;
		drag_pos[1] += event.movementY;

		e.space.style.left = drag_pos[0];
		e.space.style.top = drag_pos[1];
	}
})

// Stop drag if left mouse button is released.
document.addEventListener("mouseup", event => {
	if (!event.button)
		drag = null;
});

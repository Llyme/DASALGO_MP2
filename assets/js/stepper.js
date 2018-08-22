// Everything is connected so we can get variables from the others.

/**
 * This will hold all of the iterators (for loops in the form of
 * functions; not to be confused by recursive functions) that allows
 * nifty stuffs like pausing during the animation.
 * What the iterators iterate are 'imaginary' key frames for the
 * animation, which will be formulated along the way.
**/
let stepper = {
	// Delay between steps.
	delay: 300,
	// If the animation is playing.
	playing: -1,
	// This will contain which iterator should be ran. Right to left.
	playlist: [],
	// Counter evertime a function is called.
	step: 0,
	/* Make it so that it sorts by mail time creation instead of
	   distance from post office.
	*/
	sorttime: 0,
	// Used by the stepper. Don't touch.
	key: null
};

// Order is: deconstruct > arrange > pour.

/**
 * Used to manipulate the GUI.
**/
stepper.ctrl = (i, flag, v) => {
	if (!address_selected[i]) return;

	let elm = address_selected[i].div;

	switch(flag) {
		case 0: // Set state.
			elm.setAttribute("state", v);
			break;

		case 1: // Set Y.
			elm.style.top = 40*v + 8 + "px";
			break;

		case 2: // Set X.
			elm.style.right = 304*v + 16 + "px";
			break;
	}
}

/**
 * This separates all by post offices.
**/
stepper.deconstruct = _ => {
	let c = stepper.ctrl,
		k = stepper.key,
		s = array_tag.sorted,
		u = array_tag.unsorted,
		m = array_tag.div,
		h = office_selected;

	if (k == null) {
		c(u[0], 0, 2);

		stepper.key = 0;

		return;
	}

	if (address_selected[u[k]].address.city == h) {
		c(u[k], 0, 1);
		c(u[k], 2, 1);
		c(u[k], 1, s.push(u.splice(k, 1)[0]) - 1);
		c(u[k], 0, 2);

		for (let i = k; i < u.length; i++)
			c(u[i], 1, i);
	} else {
		stepper.key++;

		c(u[k], 0, 1);
		c(u[stepper.key], 0, 2);

		for (let i = k; i < u.length; i++)
			c(u[i], 1, i);
	}

	if (stepper.key >= u.length) {
		if (!s.length) {
			stepper.playlist = ["deconstruct"];
			stepper.key = null;

			array[h][h + " Post Office"].pnt
				.removeAttribute("selected");

			office_selected = address_selected[u[0]].address.city;

			let v = array[office_selected]
				[office_selected + " Post Office"];

			v.pnt.setAttribute("selected", 1);
			mailman_move(v.position);
		} else
			stepper.key = [];

		return 1;
	}
};

/**
 * This arranges the messages in 'descending' order, separated by
 * post offices.
**/
stepper.arrange = _ => {
	let k = stepper.key,
		c = stepper.ctrl,
		t = array_tag.buffer,
		o = array_tag.order,
		s = array_tag.sorted,
		h = office_selected;

	if (k.length)
		return 1;

	let l = [];

	s.filter(v => {
		let k = address_selected[v].address.name;

		if (l.indexOf(k) != -1)
			return;

		l.push(k);
	});

	let doc = map.traverse(array, h, h + " Post Office", l);
	let res = [];

	let office_label_txt = "";
	let office_label = array[h][h + " Post Office"].label;
	office_label.innerHTML = "";

	for (let x = 1; x < doc.path.length; x++) {
		let a = array[h][doc.path[x-1]];
		let b_name = doc.path[x];
		let n = a.parent[b_name] || a.children[b_name];

		a.paths[b_name].setAttribute("track", 1);

		let label = array[h][b_name].label;
		label.innerHTML = n + "<br><small>" + b_name + "</small>";
		label.removeAttribute("hidden");

		office_label_txt += n + " + ";
		office_label.innerHTML += "<br><small>" + b_name + "</small>";

		for (let y in s) {
			let v = address_selected[s[y]]

			if (v.address.name == b_name) {
				label.innerHTML +=
					"<br><small>" + v.div.innerHTML.split("<br>")[0] +
					"</small>";

				c(s[y], 0, 0);
				c(s[y], 1, res.push(s[y]) - 1);
			}
		}
	}

	office_label.innerHTML =
		office_label_txt.slice(0, -3) + " = " + doc.length +
		office_label.innerHTML;
	office_label.removeAttribute("hidden");

	array_tag.sorted = res;
	stepper.key = doc;
};

/**
 * Place everything back to the array.
**/
stepper.pour = _ => {
	let c = stepper.ctrl,
		s = array_tag.sorted,
		u = array_tag.unsorted;

	u.map((v, i) => c(v, 1, i + s.length));
	s.map((v, i) => c(v, 2, 0));

	return 1;
}

/**
 * The mailman's journey in an iterator.
**/
stepper.mailman = _ => {
	// Peek at the top element first.
	let c = stepper.ctrl,
		k = stepper.key.path,
		s = array_tag.sorted,
		u = array_tag.unsorted,
		h = office_selected;

	if (!s.length) {
		let v = array[h][h + " Post Office"];
		v.label.setAttribute("hidden", 1);

		if (u.length) {
			v.pnt.removeAttribute("selected");

			v = address_selected[u[0]].address.city;
			v = array[v][v + " Post Office"];
			v.pnt.setAttribute("selected", 1);

			office_selected = v.city;
		}

		mailman_move(v.position);

		stepper.key = null;

		return 1;
	}

	while (s.length && address_selected[s[0]].address.name == k[1])
		address_selected[s.shift()].div.remove();

	let v = array[office_selected][k[1]];

	s.map((v, i) => c(v, 1, i));
	u.map((v, i) => c(v, 1, i + s.length));
	mailman_move(v.position);

	v.label.setAttribute("hidden", 1);
	v.paths[k.shift()].removeAttribute("track");
}

stepper.play = (callback, tick) => {
	callback = callback ? callback : _ => {};

	if (!stepper.playlist.length) {
		stepper.step = 0;
		stepper.playlist = [
			stepper.mailman,
			stepper.pour,
			stepper.arrange,
			stepper.deconstruct
		];
	}

	if (tick == null)
		tick = stepper.playing = Date.now();

	let i = stepper.playlist.length - 1;
	stepper.step++;

	if (stepper.playlist[i]())
		stepper.playlist.pop();

	if (!stepper.playlist.length) {
		stepper.playing = -1;

		return callback(1);
	}

	setTimeout(_ => (
		stepper.playing == tick && stepper.playlist.length ?
		stepper.play(callback, tick) : callback(0)
	), stepper.delay);
}
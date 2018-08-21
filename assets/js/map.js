/**
 * Map creation. Create a map out of a .csv file, assuming it has
 * the 'proper' (Post Office, From, To, Distance; in that order)
 * format. The first one is ignored since all of which are coming
 * from the post office.
 * @param String src - The unparsed .csv string bundle.
 * @return Object - A list of all of the locations found within the
 * .csv file, along with their positions (and their post offices with
 * distance).
**/
const map = src => {
	// The result's container.
	let l = [];
	// Split by return carriage. Excel splits by newline.
	src = src.split(/\r\n|\n/);

	// Loop through each line, excluding empty ones (Don't need those).
	for (let x in src) if (src[x].length) {
		// Quotation mark counter.
		let n = -1; // -1 = No " found; 0 = " Found; 1 = Last " Found
		// Row elements.
		let v = [];
		// Create empty string for first entry.
		let i = v.push("") - 1;

		// Loop through each character.
		for (let y in src[x]) {
			// New entry if 'comma' and n is not 0.
			if (src[x][y] == "," && n) {
				// Create empty string for next entry.
				i = v.push("") - 1;
				// Set quotation mark counter to -1 again.
				n = -1;
			// See if is a double quotation mark.
			} else if (src[x][y] == '"') {
				/* If counter is 1 and there's still a quotation mark.
				   This means that the user deliberately put it there.
				*/
				if (n == 1)
					v[i] += '"';

				// Increment counter up until 1 then go back to 0.
				n = (n + 1)%2;
			} else
				// Append character to entry.
				v[i] += src[x][y];
		}

		// Append the entire to array.
		l.push(v);
	}


	//-- Sort by city, with its parents and children. --//

	let data = {};

	for (let i = 1; i < l.length; i++) {
		if (!data[l[i][0]])
			data[l[i][0]] = {};

		let city = data[l[i][0]];

		if (!city[l[i][1]])
			city[l[i][1]] = {
				name: l[i][1],
				city: l[i][0],
				parent: {},
				children: {}
			};

		if (!city[l[i][2]])
			city[l[i][2]] = {
				name: l[i][2],
				city: l[i][0],
				parent: {},
				children: {}
			}

		city[l[i][1]].children[l[i][2]] = Number(l[i][3]);
		city[l[i][2]].parent[l[i][1]] = Number(l[i][3]);
	}


	//-- Iterate through each cities. --//

	let forest = {};

	for (let x in data) {
		forest[x] = [{}];

		/* Arrange the locations by reversed depth (root node being
		   at the bottom instead of the leaf nodes).
		*/
		let tree = forest[x];
		let city = data[x];


		//-- Look for nodes without children (leaf nodes). --//

		let debounce = {};

		for (let y in city) {
			let location = city[y];

			if (!Object.keys(location.children).length) {
				tree[0][y] = location;
				debounce[y] = 1;
			}
		}


		//-- Go up from the leaf nodes to root node(s). --//

		let fn = (i, location) => {
			for (let name in location.parent) {
				let parent = city[name];

				if (!debounce[name]) {
					for (let name in parent.children)
						if (tree[i] && tree[i][name])
							i++;

					for (let name in parent.parent)
						if (tree[i] && tree[i][name])
							tree.splice(i, 0, {});

					if (!tree[i])
						tree.push({});

					tree[i][name] = city[name];
					debounce[name] = 1;
				}

				fn(i + 1, parent);
			}
		};

		for (let i in tree[0])
			fn(1, tree[0][i]);
	}


	//-- Plot down the forest's nodes. --//

	let offset = 0;

	for (let x in forest) {
		let city = forest[x];
		/* Make it so that each region is rotated progressively. This
		   allow some space for each path between nodes.
		*/
		let deg_cumulative = 0;
		// Distance from center.
		let orbit = 0;

		for (let i in city) {
			i = city.length - i - 1;
			let region = city[i];
			let index = Object.keys(region);
			let is_root = i == city.length - 1;

			if (is_root)
				orbit = index.length - 1;

			for (let n in index) {
				let deg = (n/index.length + deg_cumulative)*Math.PI;
				region[index[n]].position = new lemon.Vector([
					Math.cos(deg)*orbit + offset,
					Math.sin(deg)*orbit
				]);

				if (is_root)
					region[index[n]].root = true;
			}

			if (is_root)
				orbit += 2;
			else
				orbit += 1;

			deg_cumulative += 4/(city.length-1);
		}

		offset += orbit*1.5;
	}

	return data;
};

/**
 * Finds all possible paths that traverses all the target nodes
 * and gets the shortest one.
 * This will also cache it so we don't have to do these things that
 * usually take up to 100+ steps.
**/
map.traverse = (data, city, start, targets) => {
	if (typeof(targets) == "string")
		targets = [targets];

	/* Presumably the UID for this specific instruction. This will
	   be used for caching so we can store the answer for later use.
	*/
	let id = city + start + targets.sort((a, b) => a > b).join("");
	let doc = map.traverse.cache[id];

	if (doc != null)
		// We've done this before! We know the answer!
		return doc == -1 ? null : doc;

	let curr;
	city = data[city];

	let fn = (v, path, targets, length) => {
		["children", "parent"].map(x => {
			/* Make sure not to repeat visited nodes. We don't want
			   to check for billions of possibilities.
			*/
			for (let y in v[x]) if (path.indexOf(y) == -1) {
				length += v[x][y];

				path.push(y);

				if (targets.length == 1 && targets.indexOf(y) != -1) {
					if (!curr || curr.length > length)
						curr = {
							path: Object.assign([], path),
							length
						};
				} else if (!curr || curr.length > length) {
					// Only find nodes if length is still shorter.
					let i = targets.indexOf(y);
					let targets_nxt = targets;

					if (i != -1) {
						targets_nxt = Object.assign([], targets);

						targets_nxt.splice(i, 1);
					}

					fn(city[y], path, targets_nxt, length);
				}

				length -= v[x][y];

				path.pop();
			}
		});
	};

	/* Since there's a safety net for infinite loops (this is
	   supposedly not an infinite loop, but there's way too many),
	   the recursion gets cut off. Just catch the error and return
	   what it got before it crashed.

	   The recursion steps shouldn't trigger it since its very far
	   from the safety net's limit. This is just a safety measure.
	*/
	try {
		fn(city[start], [start], targets, 0);
	} catch(err) {}

	// If it got nothing, cache a -1, but make sure to return a null.
	map.traverse.cache[id] = curr || -1;

	return curr;
};

map.traverse.cache = {};
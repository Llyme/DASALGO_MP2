const lemon = {
	abs: i => (i < 0 ? -i : i),
	floor: i => (i - i%1) - (i%1 < 0 ? 1 : 0),
	ceil: i => (i - i%1) + (i%1 > 0 ? 1 : 0),
	sqrt: i => {
		if (i <= 1) return i; else if (i < 0) return NaN; // Imaginary.

		let a = i/2;
		let b = a + (i/a)/2;

		while (lemon.abs(a - b) >= 0.0000001) { // Precision.
			a = b;
			b = (a + (i/a))/2;
		}

		return b;
	},
	root: (i, e) => {
		let v = i;

		if (!e)
			v = 1;

		for (e; e > 1; e--)
			v *= i;

		return v;
	},
	intersect: {
		circle: {
			[3]: (a, b, c, r1, r2, r3) => {
				return new lemon.Vector([
					((b[0] - c[0]) * (
						(b[0]^2 - a[0]^2) +
						(b[1]^2 - a[1]^2) +
						(r1^2 - r2^2)
					) - (a[0] - b[0]) * (
						(c[0]^2 - b[0]^2) +
						(c[1]^2 - b[1]^2) +
						(r2^2 - r3^2)
					)) / (2 *
						(a[1] - b[1]) *
						(b[0] - c[0]) -
						(b[1] - c[1]) *
						(a[0] - b[0])
					),
					b[1] - c[1] * (
						(b[1]^2 - a[1]^2) +
						(b[0]^2 - a[0]^2) +
						(r1^2 - r2^2)
					) - (
						(a[1] - b[1]) * (
							(c[1]^2 - b[1]^2) +
							(c[0]^2 - b[0]^2) +
							(r2^2 - r3^2)
						)
					) / (2 *
						(
							(a[0] - b[0]) *
							(b[1] - c[1]) -
							(b[0] - c[0]) *
							(a[0] - b[1])
						)
					)
				])
			}
		}
	},
	Vector: function(l) {
		let magnitude, unit;

		for (let i = 0; i < l.length; i++)
			this[i] = l[i];

		this.length = l.length;

		this.magnitude = _ => {
			let d;

			if (!magnitude)
				d = 1;
			else for (let i in l) if (l[i] != this[i]) {
				unit = null;
				d = 1;
				break;
			}

			if (d) {
				magnitude = 0;

				for (let i in l) {
					l[i] = this[i];
					magnitude += l[i]*l[i];
				}

				magnitude = lemon.sqrt(magnitude);
			}

			return magnitude;
		};

		this.unit = _ => {
			let d;

			if (!unit)
				d = 1;
			else for (let i in l) if (l[i] != this[i]) {
				magnitude = null;
				d = 1;
				break;
			}

			if (d) {
				if (!magnitude) this.magnitude();

				let n = [];

				for (let i in l) {
					l[i] = this[i];

					n.push(l[i]/magnitude);
				}

				unit = new lemon.Vector(n);
			}

			return unit;
		};
	}
};

let retrieve = require("./http");
let parse5 = require("parse5");

const TIMEOUTS = { // TODO: configurable
	low: 50,
	high: 150,
	essential: 500
};

module.exports = function resolveEmbeds(html, callback) {
	let embeds = [];

	let parser = new parse5.SAXParser({ locationInfo: true });
	parser.on("startTag", (...args) => {
		let link = processTagStart(...args);
		if(link) {
			embeds.push(link);
		}
	});
	parser.on("endTag", (...args) => {
		let pos = processTagEnd(...args);
		if(pos) {
			let link = embeds[embeds.length - 1]; // XXX: assumes well-formed document
			if(link && !link.end) { // ensures we have an embeddable link
				link.end = pos;
			}
		}
	});

	parser.write(html);
	parser.end();

	// retrieve URIs
	embeds = embeds.map(link => {
		let { href, priority } = link.attributes;
		return retrieve(href, TIMEOUTS[priority || "low"]).
			then(html => {
				link.contents = html;
				return link;
			}).
			catch(err => {
				console.error(err); // eslint-disable-line
				return link;
			});
	});
	// transclude contents
	Promise.all(embeds).
		then(links => {
			for(let i = links.length - 1; i >= 0; i--) {
				html = transclude(links[i], html);
			}
			callback(html);
		});
};

function transclude({ start, end, contents }, html) {
	return contents ?
			[html.substr(0, start), contents, html.substr(end)].join("") :
			html;
}

function processTagStart(name, attribs, selfClosing, location) {
	// XXX: can we rely on lowercase tag and attribute names?
	if(name.toLowerCase() !== "a") {
		return;
	}

	// ensure we have an embeddable link
	let embeddable = attribs.some(({ name, value }) => {
		if(!value) {
			return false;
		}
		return name === "is" && value.toLowerCase() === "embeddable-link";
	});
	if(!embeddable) {
		return;
	}

	return {
		start: location.startOffset,
		// index attributes by name
		attributes: attribs.reduce((memo, { name, value }) => {
			memo[name] = value;
			return memo;
		}, {})
	};
}

function processTagEnd(name, location) {
	// XXX: can we rely on lowercase tag names?
	if(name === "a") {
		return location.endOffset;
	}
}

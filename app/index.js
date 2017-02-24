"use strict";

let resolveEmbeds = require("./resolver");
let Hapi = require("hapi");
let Inert = require("inert");
let fs = require("fs");
let path = require("path");

// TODO: configurable
const HOST = "localhost";
const PORT = 8000;

const templatesDir = path.join(__dirname, "..", "resources");
const layoutTemplate = fs.readFileSync(path.join(templatesDir, "layout.html"), {
	encoding: "utf-8"
});

let server = new Hapi.Server();
server.connection({
	host: HOST,
	port: PORT
});

server.register(Inert, err => {
	if(err) {
		throw err;
	}

	init();
});

function init() {
	let routes = [{
		method: "GET",
		path: "/",
		handler: (request, reply) => render("index", { title: "Hello World" }, reply)
	}, {
		method: "GET",
		path: "/header",
		handler: (request, reply) => render("header", { fragment: true }, reply)
	}, {
		method: "GET",
		path: "/footer",
		handler: (request, reply) => render("footer", { fragment: true }, reply)
	}, {
		method: "GET",
		path: "/embed.js",
		handler: (request, reply) => {
			let filepath = path.join(templatesDir, "embed.js");
			reply.file(filepath);
		}
	}];
	routes.forEach(route => {
		server.route(route);
	});

	server.start(err => {
		if(err) {
			throw err;
		}

		console.log("→", server.info.uri); // eslint-disable-line
	});
}

// poor man's templating
function render(resource, options, reply) {
	let filepath = path.join(templatesDir, `${resource}.html`);
	fs.readFile(filepath, (err, html) => {
		if(err) {
			throw err;
		}

		let { title, fragment } = options;
		if(!fragment) {
			html = layoutTemplate.replace("{{BODY}}", html);
		}
		if(title) {
			html = html.replace("{{TITLE}}", title);
		}

		resolveEmbeds(html, html => {
			reply(html).type("text/html");
		});
	});
}

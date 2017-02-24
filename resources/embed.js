/* eslint-disable indent, padded-blocks */
/* eslint-env browser */

(function() {

class EmbeddableLink extends HTMLElement {
	connectedCallback() {
		let uri = this.querySelector("a").href;
		this.retrieve(uri).
			then(html => this.transclude(html)).
			catch(err => null); // eslint-disable-line
	}

	transclude(html) {
		let container = this.parentNode;
		let tmp = document.createElement("div");
		tmp.innerHTML = html;
		[].forEach.call(tmp.childNodes, node => {
			container.insertBefore(node, this);
		});
		container.removeChild(this);
	}

	retrieve(uri) {
		return fetch(uri, { credentials: "include" }).
			then(res => {
				if(res.status !== 200) { // XXX: crude
					throw new Error(`failed to resolve ${uri}: ${res.status}`);
				}
				return res.text();
			});
	}
}

// `[is=…]` polyfill -- XXX: very crude
let links = document.querySelectorAll("a[is=embeddable-link]");
[].forEach.call(links, link => {
	// create eponymous wrapper
	let node = document.createElement("embeddable-link");
	link.parentNode.insertBefore(node, link);
	link.removeAttribute("is");
	node.appendChild(link);
});

customElements.define("embeddable-link", EmbeddableLink);

}());

let request = require("request");

module.exports = function retrieve(uri, timeout) {
	// TODO:
	// * support for relative URIs
	// * support for origin restrictions
	// * ensure HTML (`Accept` request header, `Content-Type` response header)
	// * strip whitespace from URI?
	return new Promise((resolve, reject) => {
		request({ uri, timeout }, (err, response, body) => {
			if(err) {
				reject(err);
			} else if(response.statusCode !== 200) { // XXX: crude
				reject(`resource unavailable (${response.statusCode}): ${uri}`);
			} else {
				resolve(body); // TODO: encoding?
			}
		});
	});
};

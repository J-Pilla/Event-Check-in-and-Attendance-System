// https://stackoverflow.com/questions/61394928/get-user-input-through-node-js-console
// I chose to only bring in createInterface instead of the entire readlin, and then wrap it up nicely
import { createInterface } from "node:readline";

let rl = null;

/** instantiates the input stream */
const openInput = () => {
	rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
};

/** closes the input stream */
const closeInput = () => {
	rl.close();
	rl = null;
};

/** await input from the user, returns a string */
const getLine = (prompt) => {
	if (typeof prompt !== "string")
		throw new TypeError("getLine expects a string");

	return new Promise((resolve) => {
		rl.question(prompt, (input) => {
			resolve(input.trim());
		});
	});
};

// exports
export { openInput, closeInput, getLine };

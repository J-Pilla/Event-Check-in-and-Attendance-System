import { openInput, closeInput, getLine } from "./inputStream.js";
import { JEvent } from "./JEvent.ts";

// https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
const textColors = {
	default: "\x1b[0m",
	error: "\x1b[31m",
};

/**
 * Event Check-in and Attendance System
 *
 * This is a console program that uses prompts to guid a user
 * through several options step by step, allowing them to
 * create events, register attendees, check attendees in,
 * generate attendance reports, and view events and attendees
 */
const main = async () => {
	openInput();
	const prompt =
		"Select an option:\n\n" +
		"0: exit\n" +
		"1: create event\n" +
		"2: register attendee\n" +
		"3: check-in attendee\n" +
		"4: generate attendance report\n" +
		"5: list events\n" +
		"6: list attendees\n\n" +
		"Option: ";
	let input = "";
	const events = [];

	printHeader();
	while ((input = await getLine(prompt)) !== "0") {
		switch (input) {
			case "":
				// empty input, assume a mistake and repeat the question
				break;
			case "1": {
				// create event
				printHeader(true);
				const event = await createEvent();
				if (event === null) break;

				events.push(event);

				printHeader();
				console.log("Event successfully created\n");
				event.print();
				await pause();
				break;
			}
			case "2":
				// register attendee
				if (events.length === 0) {
					printHeader();
					JEvent.listEvents(events);
					await pause();
					break;
				}

				printHeader(true);
				await registerAttendee(events);
				break;
			case "3":
				// check-in attendee
				if (events.length === 0) {
					printHeader();
					JEvent.listEvents(events);
					await pause();
					break;
				}

				printHeader(true);
				await checkInAttendee(events);
				break;
			case "4": {
				// generate attendance report
				if (events.length === 0) {
					printHeader();
					JEvent.listEvents(events);
					await pause();
					break;
				}

				printHeader(true);
				const event = await getEvent(events);
				if (event === null) break;

				printHeader();
				await event.generateReport();
				await pause();
				break;
			}
			case "5":
				// list events
				printHeader();
				JEvent.listEvents(events);
				await pause();
				break;
			case "6": {
				// list attendees
				if (events.length === 0) {
					printHeader();
					JEvent.listEvents(events);
					await pause();
					break;
				}

				printHeader(true);
				const event = await getEvent(events);
				if (event === null) break;

				printHeader();
				event.listAttendees();
				await pause();
				break;
			}
			default:
				printHeader();
				console.log(
					textColors.error,
					"\bInvalid option\n",
					textColors.default,
				);
				await pause();
		}
		printHeader();
	}

	printHeader(true);
	console.log("Thank you, good-bye :)\n");
	await pause(true);
	closeInput();
};

/** main options (1, 2 and 3, see {@link JEvent.generateReport()} for 4) */
// 1
/** recieves input from the user to create an event */
const createEvent = async () => {
	const name = await getInput("Enter the event's name: ");
	if (!name) return null;

	const date = await getDate();
	if (date === null) return null;

	return new JEvent(name, date);
};

// 2
/** recieves input from the user to register an attendee */
const registerAttendee = async (events) => {
	if (!Array.isArray(events))
		throw new TypeError("registerAttendee expects an array of JEvents");

	const event = await getEvent(events);
	if (event === null) return;

	const name = await getInput("Enter the attendee's name: ");
	if (!name) return;

	const email = await getEmail(event, true, name);
	if (!email) return;

	event.pushAttendee(name, email);

	printHeader();
	console.log("Attendee successfully registered\n");
	event.listAttendees();
	await pause();
};

// 3
/** recieves input from the user to check-in an attendee */
const checkInAttendee = async (events) => {
	if (!Array.isArray(events))
		throw new TypeError("registerAttendee expects an array of JEvents");

	const event = await getEvent(events);
	if (event === null) return;

	if (event.attendeeCount() === 0) {
		printHeader();
		event.listAttendees();
		await pause();
		return;
	}

	printHeader(true);
	event.listAttendees();

	const email = await getEmail(event);
	if (!email) return;

	const status = event.checkInAttendee(email);

	printHeader();
	console.log(`${status.message}\n`);
	event.listAttendees();
	await pause();
};

// input handling
/**
 * gets any string other than "" and "0" from a user
 *
 * "" -> assumed to be an accident, repeats the propmt
 *
 * "0" -> used to cancel the current option
 */
const getInput = async (prompt) => {
	let input = "";

	do {
		input = await getLine(prompt);
		if (input === "0") return "";
	} while (!input);

	return input;
};

/**
 * gets a validated date from the user
 *
 * "" -> assumed to be an accident, repeats the propmt
 *
 * "0" -> used to cancel the current option
 */
const getDate = async () => {
	let input = "";

	do {
		if (input)
			console.log(
				textColors.error,
				"\nInvalid date/ format\n",
				textColors.default,
			);

		input = await getLine("Enter the event's date (format: dd/mm/yyyy): ");
		if (input === "0") return null;
	} while (!JEvent.isValidDate(input));

	const dateArray = input.split("/");

	return new Date(
		Number(dateArray[2]),
		Number(dateArray[1] - 1),
		Number(dateArray[0]),
	);
};

/**
 * gets a an event by it's id from the user
 *
 * "" -> assumed to be an accident, repeats the propmt
 *
 * "0" -> used to cancel the current option
 */
const getEvent = async (events) => {
	if (!Array.isArray(events))
		throw new TypeError("registerAttendee expects an array of JEvents");

	let input = "";

	do {
		if (input)
			console.log(textColors.error, "\nInvalid ID\n", textColors.default);

		console.log("Available events:\n");

		JEvent.listEvents(events);

		input = await getLine("Select event by the ID: ");
		if (input === "0") return null;
	} while (
		// https://stackoverflow.com/questions/8965364/comparing-nan-values-for-equality-in-javascript
		Number.isNaN(Number(input)) ||
		Number(input) < 1 ||
		Number(input) > events.length
	);

	return events.filter((event) => event.getId() === Number(input))[0];
};

/**
 * gets a valid email from the user
 *
 * "" -> assumed to be an accident, repeats the propmt
 *
 * "0" -> used to cancel the current option
 * @param isUnique
 * false by default
 *
 * if true, the function checks to make sure the email has not been registered already
 *
 * if false, the function checks to make sure the email has been registered for the event
 */
const getEmail = async (event, isUnique = false, name = "the attendee") => {
	if (!(event instanceof JEvent))
		throw new TypeError("getEmail expects a JEvent for the first argument");

	if (typeof isUnique !== "boolean")
		throw new TypeError(
			"getUnique email expects a boolean for the second argument",
		);

	if (typeof name !== "string")
		throw new TypeError(
			"getUnique email expects a string for the third argument",
		);

	let input = "";
	let isBadInput = false;
	let errorMessage = "";

	do {
		isBadInput = false;
		if (input)
			console.log(
				textColors.error,
				`\n${errorMessage}\n`,
				textColors.default,
			);

		input = await getLine(`Enter ${name}'s email address: `);
		if (input === "0") return "";

		if (!input) {
			isBadInput = true;
			continue;
		}

		if (!JEvent.isValidEmail(input)) {
			errorMessage = "Invalid email address";
			isBadInput = true;
			continue;
		}

		if (isUnique && !event.isUniqueEmail(input)) {
			errorMessage = "Email address is not unique";
			isBadInput = true;
		} else if (!isUnique && event.isUniqueEmail(input)) {
			errorMessage = "Email address is not registered";
			isBadInput = true;
		}
	} while (isBadInput);

	return input;
};

// print functions
/** prints the header to the console */
const printHeader = (isAwaitingInput = false) => {
	if (typeof isAwaitingInput !== "boolean")
		throw new TypeError("printHeader expects a boolean");

	console.clear();
	console.log("Event Check-In and Attendance System\n");

	if (isAwaitingInput) console.log("Enter 0 to cancel\n");
};

/** prints a message to the console awaiting the user to press enter */
const pause = async (isEnd = false) => {
	if (typeof isEnd !== "boolean")
		throw new TypeError("pause expects a boolean");

	await getLine(`press enter to ${isEnd ? "end" : "continue"} . . . `);
};

await main();

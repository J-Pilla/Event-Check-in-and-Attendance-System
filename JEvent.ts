// dependancies
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

/** custome date class, Date stores more info than I need, and the months are 0 indexed */
class JDate {
	// fields
	public day: number;
	public month: number;
	public year: number;

	// constructor
	public constructor(date: Date) {
		if (!(date instanceof Date))
			throw new TypeError("JDate constructor expects a Date");

		this.day = date.getDate();
		this.month = date.getMonth() + 1;
		this.year = date.getFullYear();
	}
}

/** attendee class, stores a name, email, and the check-in state of an attendee as a boolean */
class Attendee {
	// fields
	#name: string;
	#email: string;
	#isCheckedIn: boolean;

	// getters
	public getName = (): string => {
		return this.#name;
	};

	public getEmail = (): string => {
		return this.#email;
	};

	// methods
	public isCheckedIn(): boolean {
		return Boolean(this.#isCheckedIn);
	}

	public checkIn(): void {
		this.#isCheckedIn = true;
	}

	// toString
	public toString(): string {
		return (
			`Name: ${this.#name}\n` +
			`Email: ${this.#email}\n` +
			`Status: ${this.#isCheckedIn ? "Checked-in" : "Registered"}`
		);
	}

	// constructor
	constructor(name: string, email: string) {
		Attendee.#constructorTypeCheck(name, email);
		this.#name = name;
		this.#email = email;
		this.#isCheckedIn = false;
	}

	// type check
	static #constructorTypeCheck(name: string, email: string): void {
		if (typeof name !== "string" || name === "")
			throw new TypeError(
				"Attendee constructor expects a non empty string for the first argument",
			);

		if (typeof email !== "string" || email === "")
			throw new TypeError(
				"Attendee constructor expects a non empty string for the second argument",
			);
	}
}

/**
 * custom event class, not to be confused with an html event that fires
 *
 * stores information about an event, a list of attendees, and has methods
 * to be performed on events, including generating an event report
 */
class JEvent {
	// static fields
	static #idGen = 0;

	// fields
	#id: number;
	#name: string;
	#date: JDate;
	#attendees: Attendee[];

	// getters
	public getId = (): number => {
		return this.#id;
	};

	public getName = (): string => {
		return this.#name;
	};

	public getDay = (): number => {
		return this.#date.day;
	};

	public getMonth = (): number => {
		return this.#date.month;
	};

	public getYear = (): number => {
		return this.#date.year;
	};

	// setters
	public setName(name: string): void {
		if (typeof name !== "string" || name === "")
			throw new TypeError("setName expects a non empty string");

		this.#name = name;
	}

	public setDate(date: Date): void {
		if (!(date instanceof Date))
			throw new TypeError("setDate expects a Date");

		this.#date = new JDate(date);
	}

	// methods
	public attendeeCount(): number {
		return Number(this.#attendees.length);
	}

	public checkedInCount(): number {
		let count = 0;

		this.#attendees.map((attendee) => {
			if (attendee.isCheckedIn()) count++;
		});
		return count;
	}

	/** checks if an email has not been registered to the current event */
	public isUniqueEmail(email: string): boolean {
		if (typeof email !== "string" || email === "")
			throw new TypeError("isUniqueEmail expects a non empty string");

		let isUnique = true;

		this.#attendees.map((attendee) => {
			if (email === attendee.getEmail()) isUnique = false;
		});

		return isUnique;
	}

	public pushAttendee(name: string, email: string): void {
		this.#attendees.push(new Attendee(name, email));
	}

	/**
	 * attempts to check in an attendee and returns
	 * @returns the status { code, message } of the attempt
	 *
	 * 0 success
	 *
	 * 1 failure, not found
	 *
	 * 2 failure, already checked-in
	 */
	public checkInAttendee(email: string): object {
		if (typeof email !== "string")
			throw new TypeError("checkInAttendee expects a string");

		let status = { code: 1, message: "Attendee not registered" };

		this.#attendees.map((attendee) => {
			if (email === attendee.getEmail()) {
				if (attendee.isCheckedIn())
					status = {
						code: 2,
						message: "Attendee already checked-in",
					};
				else {
					attendee.checkIn();
					status = {
						code: 0,
						message: "Attendee successfully checked-in",
					};
				}
			}
		});

		return status;
	}

	// print methods
	/** prints an event to the console */
	public print(): void {
		console.log(`${this.toString()}\n`);
	}

	/** prints a list of events to the console */
	public static listEvents(events: JEvent[]): void {
		if (!Array.isArray(events))
			throw new TypeError("listEvents expects an array of JEvents");

		if (!events.length) {
			console.log("No events available\n");
			return;
		}

		events.map((event) => {
			// https://www.typescriptlang.org/docs/handbook/advanced-types.html
			if (!(event instanceof JEvent))
				throw new TypeError("listEvents expects an array of JEvents");

			event.print();
		});
	}

	/** prints a list of attendees to the console */
	public listAttendees(): void {
		console.log(`Event: ${this.#name}\n`);

		if (this.#attendees.length === 0) {
			console.log("No attendees available\n");
			return;
		}

		this.#attendees.map((attendee, index) => {
			console.log(`Attendee ${index + 1}:\n${attendee.toString()}\n`);
		});
	}

	/**
	 * generates a JSON formatted report, and also prints the object to the console with a success message
	 * @returns an object with the report spread out, the stringified JSON, the folderName
	 */
	public generateReport(folderName = "./reports"): object {
		const time = new Date();
		const fileName =
			`/${this.#name}` +
			`_${time.getFullYear()}` +
			`${time.getMonth() + 1}` +
			`${time.getDate()}` +
			`${time.getHours()}` +
			`${time.getMinutes()}` +
			`${time.getSeconds()}` +
			`${time.getMilliseconds()}` +
			`.json`;

		// https://nodejs.org/en/learn/manipulating-files/working-with-folders-in-nodejs
		if (!existsSync(folderName)) mkdirSync(folderName);

		let checkInList: string[] = [];

		this.#attendees.map((attendee) => {
			if (attendee.isCheckedIn()) checkInList.push(attendee.getName());
		});

		const report = {
			event: this.#name,
			registerCount: this.attendeeCount(),
			checkInCount: this.checkedInCount(),
			checkInList: checkInList,
		};

		const json = JSON.stringify(report);

		// honestly just poked around in documentation plus some trial and error to figure this one out
		writeFileSync(folderName + fileName, json);
		console.log(report, "\n\nReport successfully generated\n");

		return { ...report, json: json, filePath: folderName + fileName };
	}

	// validation methods
	/** validates a date with RegExp formatted dd/mm/yyyy */
	public static isValidDate(date: string) {
		if (typeof date !== "string")
			throw new TypeError("isValidDate expects a string");

		// initial regex pulled from https://stackoverflow.com/questions/5465375/javascript-date-regex-dd-mm-yyyy
		return /^(0?[1-9]|[12][0-9]|3[01])[\/](0?[1-9]|1[012])[\/]\d{4}$/.test(
			date,
		);
	}

	/** validates an email with RegExp */
	public static isValidEmail(email: string) {
		if (typeof email !== "string")
			throw new TypeError("isValidEmail expects a string");

		// https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression
		return /^(?:[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+(?:\.[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9\x2d]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/.test(
			email,
		);
	}

	// toString
	public dayToString(): string {
		let suffix = "th";
		if (this.#date.day < 4 || this.#date.day > 20) {
			switch (this.#date.day % 10) {
				case 1:
					suffix = "st";
					break;
				case 2:
					suffix = "nd";
					break;
				case 3:
					suffix = "rd";
					break;
			}
		}
		return `${this.#date.day}${suffix}`;
	}

	public monthToString(): string {
		switch (this.#date.month) {
			case 1:
				return "January";
			case 2:
				return "February";
			case 3:
				return "March";
			case 4:
				return "April";
			case 5:
				return "May";
			case 6:
				return "June";
			case 7:
				return "July";
			case 8:
				return "August";
			case 9:
				return "September";
			case 10:
				return "October";
			case 11:
				return "November";
			default:
				return "December";
		}
	}

	public dateToString(): string {
		return `${this.monthToString()} ${this.dayToString()}, ${this.#date.year}`;
	}

	public toString(): string {
		return (
			`ID: ${this.#id}\n` +
			`Event: ${this.#name}\n` +
			`Date: ${this.dateToString()}`
		);
	}

	// constructor
	constructor(name: string, date: Date) {
		JEvent.#constructorTypeCheck(name, date);
		this.#id = ++JEvent.#idGen;

		this.#name = name;
		this.#date = new JDate(date);
		this.#attendees = [];
	}

	// type check
	static #constructorTypeCheck(name: string, date: Date): void {
		if (typeof name !== "string" || name === "")
			throw new TypeError(
				"JEvent constructor expects a non empty string for the first argument",
			);

		if (!(date instanceof Date))
			throw new TypeError(
				"JEvent constructor expects a Date for the second argument",
			);
	}
}

export { JEvent };

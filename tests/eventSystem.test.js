import test from "node:test";
import assert from "node:assert/strict";

// dependancies
import { existsSync, rmSync } from "node:fs";

// the module being tested
import { JEvent } from "../JEvent.ts";

test.describe("JEvent module tests", () => {
	test.describe("Unit tests", () => {
		const event = new JEvent("Birthday", new Date(2026, 11, 20));
		test.describe("JEvent static methods", () => {
			test("listEvents", () => {
				assert.doesNotThrow(() => JEvent.listEvents([]));
				assert.doesNotThrow(() => JEvent.listEvents([event]));
				assert.doesNotThrow(() => JEvent.listEvents([event, event]));
			});
			test("isValidDate", () => {
				assert.strictEqual(JEvent.isValidDate("dec 20 1994"), false);
				assert.strictEqual(JEvent.isValidDate("20-12-1994"), false);
				assert.strictEqual(JEvent.isValidDate("1-1-2000"), false);
				assert.strictEqual(JEvent.isValidDate("20/12/1994"), true);
				assert.strictEqual(JEvent.isValidDate("1/1/2000"), true);
			});
			test("isValidEmail", () => {
				assert.strictEqual(JEvent.isValidEmail("1234"), false);
				assert.strictEqual(JEvent.isValidEmail("pillajason"), false);
				assert.strictEqual(JEvent.isValidEmail("pilla.jason"), false);
				assert.strictEqual(
					JEvent.isValidEmail("pilla.jason@gmail"),
					false,
				);
				assert.strictEqual(
					JEvent.isValidEmail("pilla.jason@gmail.com"),
					true,
				);
				assert.strictEqual(
					JEvent.isValidEmail("jason.pilla@student.sl.on.ca"),
					true,
				);
			});

			test.describe("exception handling", () => {
				test("constructor", () => {
					assert.throws(() => new JEvent(), { name: "TypeError" });
					assert.throws(() => new JEvent(1234, new Date()), {
						name: "TypeError",
					});
					assert.throws(() => new JEvent("", new Date()), {
						name: "TypeError",
					});
					assert.throws(() => new JEvent("Birthday", "20/12/2026"), {
						name: "TypeError",
					});
					assert.throws(() => new JEvent("Birthday"), {
						name: "TypeError",
					});
					assert.throws(() => new JEvent(new Date()), {
						name: "TypeError",
					});
				});
				test("listEvent", () => {
					assert.throws(() => JEvent.listEvents(), {
						name: "TypeError",
					});
					assert.throws(() => JEvent.listEvents([""]), {
						name: "TypeError",
					});
					assert.throws(
						() =>
							JEvent.listEvents([
								new JEvent("Birthday", "20/12/2026"),
								"",
							]),
						{
							name: "TypeError",
						},
					);
				});
			});
		});

		test.describe("JEvent non static methods", () => {
			test("getters", () => {
				assert.strictEqual(event.getId(), 1);
				assert.strictEqual(event.getName(), "Birthday");
				assert.strictEqual(event.getDay(), 20);
				assert.strictEqual(event.getMonth(), 12);
				assert.strictEqual(event.getYear(), 2026);
			});
			test("counts", () => {
				assert.strictEqual(event.attendeeCount(), 0);
				assert.strictEqual(event.checkedInCount(), 0);
			});
			test("toString", () => {
				assert.strictEqual(event.dayToString(), "20th");
				assert.strictEqual(event.monthToString(), "December");
			});
			test("setters", () => {
				// running setters last so it doesn't mess with toString
				assert.doesNotThrow(() => event.setName("New Years"));
				assert.doesNotThrow(() => event.setDate(new Date(2027, 0, 1)));
			});

			test.describe("exception handling", () => {
				test("setters", () => {
					assert.throws(() => event.setName(), { name: "TypeError" });
					assert.throws(() => event.setName(""), {
						name: "TypeError",
					});
					assert.throws(() => event.setName(1234), {
						name: "TypeError",
					});
					assert.throws(() => event.setName(true), {
						name: "TypeError",
					});
					assert.throws(() => event.setDate(), { name: "TypeError" });
					assert.throws(() => event.setDate("20/12/2016"), {
						name: "TypeError",
					});
				});
				test("isUniqueEmail", () => {
					assert.throws(() => event.isUniqueEmail(), {
						name: "TypeError",
					});
					assert.throws(() => event.isUniqueEmail(""), {
						name: "TypeError",
					});
					assert.throws(() => event.isUniqueEmail(1234), {
						name: "TypeError",
					});
					assert.throws(() => event.isUniqueEmail(true), {
						name: "TypeError",
					});
				});
				test("pushAttendee", () => {
					assert.throws(() => event.pushAttendee(), {
						name: "TypeError",
					});
					assert.throws(() => event.pushAttendee("Jason Pilla"), {
						name: "TypeError",
					});
					assert.throws(
						() => event.pushAttendee(1234, "pilla.jason@gmail.com"),
						{
							name: "TypeError",
						},
					);
				});
				test("checkInAttendee", () => {
					assert.throws(() => event.checkInAttendee(), {
						name: "TypeError",
					});
					assert.throws(() => event.checkInAttendee(1234), {
						name: "TypeError",
					});
					assert.throws(() => event.checkInAttendee(true), {
						name: "TypeError",
					});
				});
			});
		});
	});

	test.describe("Integration tests", () => {
		test.describe("test effects of pushing and checking in attendees", () => {
			let event;

			test.beforeEach(() => {
				event = new JEvent("Birthday", new Date(2026, 11, 2026));
			});

			test("pushAttendees changes attendeeCount", () => {
				const email = "pilla.jason@gmail.com";
				assert.strictEqual(event.attendeeCount(), 0);
				event.pushAttendee("Jason", email);
				assert.strictEqual(event.attendeeCount(), 1);
			});

			test("pushAttendees causes isUniqueEmail to change from true to false", () => {
				const email = "pilla.jason@gmail.com";
				assert.strictEqual(event.isUniqueEmail(email), true);
				event.pushAttendee("Jason", email);
				assert.strictEqual(event.isUniqueEmail(email), false);
			});

			test("checkInAttendee changes checkedInCount", () => {
				const email = "pilla.jason@gmail.com";
				event.pushAttendee("Jason", email);
				assert.strictEqual(event.checkedInCount(), 0);
				event.checkInAttendee(email);
				assert.strictEqual(event.checkedInCount(), 1);
			});
		});

		test.describe("simulation test", () => {
			const events = [];
			let event;

			test("create two events", () => {
				events.push(
					new JEvent("Birthday", new Date(2026, 11, 20)),
					new JEvent("New Years", new Date(2027, 0, 1)),
				);

				// check the info is correct for each
				assert.strictEqual(events[0].getName(), "Birthday");
				assert.strictEqual(
					events[0].dateToString(),
					"December 20th, 2026",
				);
				assert.strictEqual(events[1].getName(), "New Years");
				assert.strictEqual(
					events[1].dateToString(),
					"January 1st, 2027",
				);

				event = events[0];
			});

			test("register three attendees", () => {
				event.pushAttendee("Jason", "pilla.jason@gmail.com");
				event.pushAttendee("Jason", "jason.pilla@student.sl.on.ca");
				event.pushAttendee("Sebastian", "sebby@kitty.ca");

				// check that attendees are registered
				assert.strictEqual(event.attendeeCount(), 3);
			});

			test("check-in two attendees", () => {
				// not found
				assert.strictEqual(event.checkInAttendee("Jason").code, 1);
				// success
				assert.strictEqual(
					event.checkInAttendee("pilla.jason@gmail.com").code,
					0,
				);
				// already checked-in
				assert.strictEqual(
					event.checkInAttendee("pilla.jason@gmail.com").code,
					2,
				);
				// success
				assert.strictEqual(
					event.checkInAttendee("sebby@kitty.ca").code,
					0,
				);

				// check that attendee is checked-in
				assert.strictEqual(event.checkedInCount(), 2);
			});

			test("generate the report", () => {
				const folder = "./testReports";
				const report = event.generateReport(folder);
				// check the report
				assert.strictEqual(report.event, "Birthday");
				assert.strictEqual(report.registerCount, 3);
				assert.strictEqual(report.checkInCount, 2);
				// using string interpolation, because the arrays aren't strictly equal, even if they contain the same strings
				assert.strictEqual(
					`${report.checkInList}`,
					`${["Jason", "Sebastian"]}`,
				);

				// check the stringified json
				assert.strictEqual(
					report.json,
					'{"event":"Birthday","registerCount":3,"checkInCount":2,"checkInList":["Jason","Sebastian"]}',
				);

				// check that the report now exists
				assert.strictEqual(existsSync(report.filePath), true);

				// remove the file/ folder to prevent stacking test reports
				rmSync(folder, { recursive: true, force: true });
			});
		});
	});
});

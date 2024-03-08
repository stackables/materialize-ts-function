import { SEPARATOR, extractResponse } from "../src/materialize";

describe("extractResponse", () => {
	test("fails if prefix not present", () => {
		expect(() => extractResponse("data without prefix")).toThrow(
			"Incorrect response data"
		);
	});

	test("fails if prefix is repeated", () => {
		expect(() =>
			extractResponse("data without " + SEPARATOR + " prefix" + SEPARATOR)
		).toThrow("Incorrect response data");
	});

	test("data after prefix is returned", () => {
		expect(extractResponse("data without " + SEPARATOR + "data")).toBe("data");
	});
});

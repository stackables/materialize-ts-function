import { isSerializable } from "../src/materialize";

describe("isSerializable", () => {
	it("string", () => {
		expect(isSerializable("HI")).toBeTruthy();
	});

	it("number", () => {
		expect(isSerializable(23454)).toBeTruthy();
	});

	it("null", () => {
		expect(isSerializable(null)).toBeTruthy();
	});

	it("undefined", () => {
		expect(isSerializable(undefined)).toBeFalsy();
	});

	it("plain obj", () => {
		expect(isSerializable({ p: 1, p2: "hi" })).toBeTruthy();
	});

	it("plain obj with func", () => {
		expect(isSerializable({ p: 1, p2: () => {} })).toBeFalsy();
	});

	it("nested obj with func", () => {
		expect(
			isSerializable({ p: 1, p2: "hi", n: { nn: { nnn: 1, nnm: () => {} } } })
		).toBeFalsy();
	});

	it("array", () => {
		expect(isSerializable([1, 2, 3, 5])).toBeTruthy();
	});

	it("array with func", () => {
		expect(isSerializable([1, 2, 3, () => false])).toBeFalsy();
	});

	it("array with nested obj", () => {
		expect(
			isSerializable([1, 2, 3, { nn: { nnn: 1, nnm: "Hi" } }])
		).toBeTruthy();
	});

	it("array with newsted obj with func", () => {
		expect(
			isSerializable([1, 2, 3, { nn: { nnn: 1, nnm: () => {} } }])
		).toBeFalsy();
	});

	test("boolean = true", () => {
		expect(isSerializable(true)).toBeTruthy();
		expect(isSerializable(false)).toBeTruthy();
	});
});

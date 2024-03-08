import { SEPARATOR, extractResponse, materialize } from "../src/materialize";

describe("execute", () => {
	it("prefixes successful results with SEPARATOR", async () => {
		const response = await materialize(async () => true);
		expect(response.startsWith(SEPARATOR)).toBeTruthy();
	});

	it("result after SEPARATOR is json stringify of response", async () => {
		const response = await materialize(async () => ({
			test: 1,
			status: [null, "status", 3],
		}));

		const responseData = extractResponse(response);

		const parsed = JSON.parse(responseData);
		expect(parsed).toStrictEqual({
			test: 1,
			status: [null, "status", 3],
		});
	});

	it("executes function when condition is set to true", async () => {
		const response = await materialize(async () => true, true);
		expect(response.startsWith(SEPARATOR)).toBeTruthy();
	});

	it("does not execute function when condition is set to false", async () => {
		const response = materialize(async () => true, false);
		await expect(response).rejects.toThrow("Materialize condition not true");
	});

	it("will throw on non serializable result", async () => {
		const response = materialize(async () => new Date());
		await expect(response).rejects.toThrow(
			"Function return is not serializable"
		);
	});

	it("will throw if function execution fails", async () => {
		const response = materialize(async () => {
			throw new Error("Execution Failed");
		});
		await expect(response).rejects.toThrow("Execution Failed");
	});
});

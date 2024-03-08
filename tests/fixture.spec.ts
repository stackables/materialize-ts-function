import { jest } from "@jest/globals";
import { exec } from "child_process";
import { readFile } from "fs/promises";
import { promisify } from "util";
import { main } from "../src/source";

const execAsync = promisify(exec);

describe("test ficture", () => {
	beforeAll(async () => {
		await execAsync("git checkout -- tests/fixtures/test-cases.ts");
	});

	beforeEach(() => {
		jest.resetModules();
	});

	test("expect both materialize1 and materialize2 to mutate", async () => {
		const module = await import("./fixtures/test-cases.ts");
		expect(await module.materialize1()).not.toEqual(
			await module.materialize1()
		);
		expect(await module.materialize2()).not.toEqual(
			await module.materialize2()
		);
	});

	test("modify source", async () => {
		const current = await readFile("tests/fixtures/test-cases.ts");
		await main();
		const replaced = await readFile("tests/fixtures/test-cases.ts");
		expect(current).not.toEqual(replaced);
	});

	test("expect only materialize2 to mutate", async () => {
		const module = await import("./fixtures/test-cases.ts");
		expect(await module.materialize1()).toEqual(await module.materialize1());
		expect(await module.materialize2()).not.toEqual(
			await module.materialize2()
		);
	});
});

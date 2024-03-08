import { exec } from "child_process";
import { relative } from "path";
import { cwd } from "process";
import { Project, SourceFile } from "ts-morph";
import { promisify } from "util";
import { extractResponse } from "./materialize";

const execAsync = promisify(exec);

interface Target {
	name: string;
	condition?: string;
}

async function materializeFunctionInFile(source: SourceFile, target: Target) {
	const localPath = relative(cwd(), source.getFilePath());
	const func = source.getFunction(target.name);

	const log = (m: string) => {
		console.log(`${localPath} -> ${target.name} = ${m}`);
	};

	if (!func) {
		log(`function not found`);
		return;
	}

	const body = func.getBodyText();

	if (!body) {
		log(`function body not found`);
		return;
	}

	if (body.includes("/* __materialized__ */")) {
		log(`function already materialized`);
		return;
	}

	if (func.getParameters().length > 0) {
		log(`function has parameters`);
		return;
	}

	source.addStatements(`import { materialize } from "../../src"`);
	// prettier-ignore
	source.addStatements(`materialize(${func.getName()}, ${target.condition ?? "undefined"}).then(console.log).catch((e:any) => console.error(e.message))`);
	await source.save();

	let error: string | undefined = undefined;
	try {
		const result = await execAsync(`ts-node ${source.getFilePath()}`);

		await source.refreshFromFileSystem();

		try {
			const data = extractResponse(result.stdout);
			func.setBodyText(`/* __materialized__ */\nreturn ${data}`);
		} catch (e: any) {
			error = result.stderr.trim();
		}
	} catch (e: any) {
		await source.refreshFromFileSystem();
		error = e.message.trim();
	}

	source.removeStatement(source.getStatements().length - 1);
	source.organizeImports();
	await source.save();
	log(`${error ?? "completed"}`);
}

export async function main(path = "**/*.ts") {
	const project = new Project();
	const sources = project.addSourceFilesAtPaths([path, "!node_modules"]);

	const plan = new Map<SourceFile, Target[]>();

	const addToPlan = (source: SourceFile, instructions: Target) => {
		const current = plan.get(source);
		if (!current) {
			plan.set(source, [instructions]);
		} else {
			plan.set(source, [...current, instructions]);
		}
	};

	// plan
	for (const source of sources) {
		for (const func of source.getFunctions()) {
			let materialize = false;
			let condition: undefined | string = undefined;
			const name = func.getName();

			const comments = func
				.getLeadingCommentRanges()
				.flatMap((cr: any) => cr.getText().split("\n"));

			// parse comments
			comments.forEach((c) => {
				if (c.includes("@materialized")) {
					materialize = true;
				}
				if (c.includes("@if")) {
					const [directive, data] = c.split("@if");
					condition = data.trim();
				}
			});

			if (materialize && name) {
				addToPlan(source, { name, condition });
			}
		}
	}

	// execute
	const array = [...plan.entries()];
	await Promise.all(
		array.map(async ([s, c]) => {
			for (let i = 0; i < c.length; i++) {
				await materializeFunctionInFile(s, c[i]);
				await s.refreshFromFileSystem();
			}
		})
	);
}

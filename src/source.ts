import { exec } from "child_process";
import { join, relative } from "path";
import { cwd } from "process";
import { Project, SourceFile } from "ts-morph";
import { promisify } from "util";
import { extractResponse } from "./materialize";

const execAsync = promisify(exec);

interface Target {
	name: string;
	condition?: string;
}

const selfLocation = join(
	__dirname,
	__dirname.endsWith("build/src") ? "../../" : "./"
);

const tsNodeLocation = join(
	selfLocation,
	__dirname.endsWith("build/src")
		? "node_modules/.bin/"
		: "../node_modules/.bin/"
);

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

	// prettier-ignore
	source.addStatements(`import { materialize } from "${selfLocation}"`);
	// prettier-ignore
	source.addStatements(`materialize/*remove*/(${func.getName()}, ${target.condition ?? "undefined"}).then(console.log).catch((e:any) => console.error(e.message))`);
	await source.save();
	await source.refreshFromFileSystem();

	let error: string | undefined = undefined;
	try {
		const result = await execAsync(
			`${tsNodeLocation}ts-node ${source.getFilePath()}`
		);
		try {
			const data = extractResponse(result.stdout);
			func.setBodyText(`/* __materialized__ */\nreturn ${data}`);
		} catch (e: any) {
			error = result.stderr.trim();
		}
	} catch (e: any) {
		error = e.message.trim();
	}

	const st = source.getStatements();
	st.forEach((s) => {
		if (s.getText().startsWith("materialize/*remove*/(")) {
			s.remove();
		}
	});

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

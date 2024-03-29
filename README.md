[![npm](https://img.shields.io/npm/v/materialize-ts-function?label=materialize-ts-function&logo=npm)](https://www.npmjs.com/package/materialize-ts-function)
[![codecov](https://codecov.io/gh/stackables/materialize-ts-function/branch/main/graph/badge.svg?token=x1DmWF8EId)](https://codecov.io/gh/stackables/materialize-ts-function)

# Materialize typescript functions

A simple cli command to materialize the response of a typescript async function during build time.

## The simplest use-case

#### 1. Annotate your function with @materialized

```typescript
import { readFile } from "fs/promises";

/**
 * @materialized
 */
async function getVersion() {
	// return anything that survives JSON.stringify()

	const pkg = await readFile("./package.json");
	const parsed = JSON.parse(pkg.toString());
	return parsed.version;
}
```

#### 2. Rewrite the code during build

```bash
npx materialize-ts-function
```

#### 3. End result

```typescript
/**
 * @materialized
 */
async function getVersion() {
	/* __materialized__ */
	return "1.0.0";
}
```

## Conditionally skipping materialize

Use any boolean returning expression with `@if` annotation

```typescript
/**
 * @materialized
 * @if process.env.DEBUG !== undefined
 */
async function someComplexLogic() {
	// add business logic here
}
```

## How it works internally

We scan the codebase for all files containing functions with the `@materialized` annotation and temporarily add a simple statement to the end of the file to make it executable with `ts-node`.

Then we capture the output and replace the annotated functions body with the serialized response from the ts-node execution.

```typescript
// Temporary statements to execute the function
import { materialize } from "materialize-ts-function";

materialize(
	someComplexLogic, // <-- @materialized function
	process.env.DEBUG !== undefined // <-- @if annotation literal
)
	.then(console.log)
	.catch(console.error);
```

To debug one can add the same statement to the file and execute if with

```bash
ts-node ./src/original/file/location.ts
```

## Thats it ...

... happy coding :)

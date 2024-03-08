#!/usr/bin/env node

import { main } from "../source";

main()
	.then(() => {
		console.log("\nMaterialization complete");
	})
	.catch(console.error);

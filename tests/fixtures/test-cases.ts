import { randomUUID } from "crypto";

/**
 * @materialized
 */
export async function materialize1() {
	return {
		uuid: randomUUID().toString(),
	};
}

/**
 * @materialized
 * @if process.env.DEBUG==="1"
 */
export async function materialize2() {
	return {
		uuid: randomUUID().toString(),
	};
}

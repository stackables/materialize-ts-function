import _ from "lodash";

export const SEPARATOR = "274c9066-ed6e-4c72-aa7a-9f7ae2d40a8b";

export function isSerializable(obj: unknown) {
	if (_.isNull(obj) || _.isBoolean(obj) || _.isNumber(obj) || _.isString(obj)) {
		return true;
	}

	if (!_.isPlainObject(obj) && !_.isArray(obj)) {
		return false;
	}

	const iter = obj as any;
	for (var key in iter) {
		if (!isSerializable(iter[key])) {
			return false;
		}
	}

	return true;
}

export function extractResponse(data: string) {
	const parts = data.split(SEPARATOR);
	if (parts.length !== 2) {
		throw new Error("Incorrect response data");
	}
	return parts[1];
}

export async function materialize(
	target: () => Promise<any>,
	condition?: boolean
) {
	if (condition !== undefined && condition === false) {
		throw new Error("Materialize condition not true");
	}

	const response = await target();
	if (!isSerializable(response)) {
		throw new Error("Function return is not serializable");
	}

	return SEPARATOR + JSON.stringify(response, null, 2);
}

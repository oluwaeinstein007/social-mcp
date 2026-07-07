import type { Dispatcher } from "undici";
import type { z } from "zod";

export class HttpError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly data?: unknown,
	) {
		super(message);
		this.name = "HttpError";
	}
}

// `dispatcher` is a Node-specific fetch() extension (undici), not part of RequestInit's
// DOM type — needed here so services can route a call through an HttpsProxyAgent-style
// proxy via createProxyDispatcher() without every call site casting the options object.
export type FetchOptions = RequestInit & { dispatcher?: Dispatcher };

export async function fetchJson<T>(
	url: string,
	options?: FetchOptions,
	schema?: z.ZodType<T>,
): Promise<T> {
	const response = await fetch(url, options as RequestInit);

	if (!response.ok) {
		throw new HttpError(
			response.status,
			`HTTP error ${response.status}: ${response.statusText}`,
			await response.text().catch(() => undefined),
		);
	}

	const data = await response.json();

	if (schema) {
		try {
			return schema.parse(data);
		} catch (error) {
			throw new Error(
				`Invalid response data: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	return data as T;
}
